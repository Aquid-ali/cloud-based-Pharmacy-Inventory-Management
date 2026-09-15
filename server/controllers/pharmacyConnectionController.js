const asyncHandler = require('express-async-handler');
const Pharmacy = require('../models/Pharmacy');
const PharmacyConnection = require('../models/PharmacyConnection');
const PharmacyConversation = require('../models/PharmacyConversation');
const ApiError = require('../utils/ApiError');
const { getOwnPharmacyId, sortPair, isParticipant, otherPharmacyId } = require('../services/pharmacyNetworkAuth');

const OTHER_PHARMACY_FIELDS = 'name city state isVerified status';

const toConnectionResponse = async (connection, myPharmacyId) => {
  const otherId = otherPharmacyId(connection, myPharmacyId);
  const otherPharmacy = await Pharmacy.findById(otherId, OTHER_PHARMACY_FIELDS).lean();

  const response = {
    _id: connection._id,
    status: connection.status,
    requestedByMe: String(connection.requestedBy) === String(myPharmacyId),
    blockedByMe: connection.status === 'blocked' && String(connection.blockedBy) === String(myPharmacyId),
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
    otherPharmacy,
  };

  if (connection.status === 'accepted') {
    const conversation = await PharmacyConversation.findOne({ connectionId: connection._id }, { _id: 1 }).lean();
    if (conversation) response.conversationId = conversation._id;
  }

  return response;
};

const loadOwnedConnection = async (id, myPharmacyId) => {
  const connection = await PharmacyConnection.findById(id);
  if (!connection) {
    throw new ApiError(404, 'Connection request not found');
  }
  if (!isParticipant(connection, myPharmacyId)) {
    throw new ApiError(403, 'You are not authorized to act on this connection request');
  }
  return connection;
};

/**
 * @desc    Send (or re-send after a decline) a connection request to
 *          another pharmacy.
 * @route   POST /api/pharmacy-network/connections
 * @access  Private (Admin, pharmacy-scoped)
 */
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const { pharmacyId: targetId } = req.body;

  if (String(targetId) === String(myPharmacyId)) {
    throw new ApiError(400, "You can't connect with your own pharmacy");
  }

  const [me, target] = await Promise.all([Pharmacy.findById(myPharmacyId), Pharmacy.findById(targetId)]);
  if (!target || target.status !== 'active') {
    throw new ApiError(404, 'Pharmacy not found');
  }
  if (!me || me.status !== 'active') {
    throw new ApiError(403, 'Your pharmacy is currently inactive and cannot send connection requests');
  }

  const { pharmacyLow, pharmacyHigh } = sortPair(myPharmacyId, targetId);

  let connection = await PharmacyConnection.findOne({ pharmacyLow, pharmacyHigh });

  if (connection) {
    if (connection.status === 'accepted') {
      throw new ApiError(409, 'You are already connected with this pharmacy');
    }
    if (connection.status === 'blocked') {
      throw new ApiError(403, 'You cannot send a request to this pharmacy right now');
    }
    if (connection.status === 'pending') {
      if (String(connection.requestedBy) === String(myPharmacyId)) {
        throw new ApiError(409, 'You already sent a request to this pharmacy');
      }
      throw new ApiError(409, 'This pharmacy already sent you a request - accept it instead');
    }
    // declined -> re-request allowed, reuse the same doc
    connection.requestedBy = myPharmacyId;
    connection.status = 'pending';
    connection.respondedAt = null;
    await connection.save();
  } else {
    try {
      connection = await PharmacyConnection.create({
        pharmacyLow,
        pharmacyHigh,
        requestedBy: myPharmacyId,
        status: 'pending',
      });
    } catch (error) {
      if (error.code === 11000) {
        connection = await PharmacyConnection.findOne({ pharmacyLow, pharmacyHigh });
      } else {
        throw error;
      }
    }
  }

  res.status(201).json({ success: true, data: { connection: await toConnectionResponse(connection, myPharmacyId) } });
});

/**
 * @desc    List the caller's connections/requests, optionally filtered.
 * @route   GET /api/pharmacy-network/connections?status=&direction=incoming|outgoing
 * @access  Private (Admin, pharmacy-scoped)
 */
const getMyConnections = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const { status, direction } = req.query;

  const filter = { $or: [{ pharmacyLow: myPharmacyId }, { pharmacyHigh: myPharmacyId }] };
  if (status) filter.status = status;

  let connections = await PharmacyConnection.find(filter).sort({ updatedAt: -1 });

  if (direction === 'incoming') {
    connections = connections.filter((c) => String(c.requestedBy) !== String(myPharmacyId));
  } else if (direction === 'outgoing') {
    connections = connections.filter((c) => String(c.requestedBy) === String(myPharmacyId));
  }

  const responses = await Promise.all(connections.map((c) => toConnectionResponse(c, myPharmacyId)));
  res.status(200).json({ success: true, data: { connections: responses } });
});

/**
 * @desc    Count of pending requests sent TO the caller - powers the
 *          combined "Pharmacy Network" nav badge alongside unread messages.
 * @route   GET /api/pharmacy-network/connections/pending-count
 * @access  Private (Admin, pharmacy-scoped)
 */
const getPendingIncomingCount = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);

  const pending = await PharmacyConnection.find(
    { $or: [{ pharmacyLow: myPharmacyId }, { pharmacyHigh: myPharmacyId }], status: 'pending' },
    { requestedBy: 1 }
  ).lean();

  const pendingRequestCount = pending.filter((c) => String(c.requestedBy) !== String(myPharmacyId)).length;
  res.status(200).json({ success: true, data: { pendingRequestCount } });
});

/**
 * @desc    Accept an incoming connection request - creates the shared
 *          PharmacyConversation in the same request.
 * @route   PATCH /api/pharmacy-network/connections/:id/accept
 * @access  Private (Admin, pharmacy-scoped, recipient only)
 */
const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const connection = await loadOwnedConnection(req.params.id, myPharmacyId);

  if (connection.status !== 'pending') {
    throw new ApiError(409, 'This request is no longer pending');
  }
  if (String(connection.requestedBy) === String(myPharmacyId)) {
    throw new ApiError(403, "You can't accept your own request");
  }

  const [pharmacyLowDoc, pharmacyHighDoc] = await Promise.all([
    Pharmacy.findById(connection.pharmacyLow),
    Pharmacy.findById(connection.pharmacyHigh),
  ]);
  if (!pharmacyLowDoc || pharmacyLowDoc.status !== 'active' || !pharmacyHighDoc || pharmacyHighDoc.status !== 'active') {
    throw new ApiError(403, 'Both pharmacies must be active to connect');
  }

  connection.status = 'accepted';
  connection.respondedAt = new Date();
  await connection.save();

  let conversation = await PharmacyConversation.findOne({ connectionId: connection._id });
  if (!conversation) {
    try {
      conversation = await PharmacyConversation.create({
        connectionId: connection._id,
        pharmacyLow: connection.pharmacyLow,
        pharmacyHigh: connection.pharmacyHigh,
      });
    } catch (error) {
      if (error.code === 11000) {
        conversation = await PharmacyConversation.findOne({ connectionId: connection._id });
      } else {
        throw error;
      }
    }
  }

  const response = await toConnectionResponse(connection, myPharmacyId);
  response.conversationId = conversation._id;
  res.status(200).json({ success: true, data: { connection: response } });
});

/**
 * @desc    Decline an incoming connection request.
 * @route   PATCH /api/pharmacy-network/connections/:id/decline
 * @access  Private (Admin, pharmacy-scoped, recipient only)
 */
const declineConnectionRequest = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const connection = await loadOwnedConnection(req.params.id, myPharmacyId);

  if (connection.status !== 'pending') {
    throw new ApiError(409, 'This request is no longer pending');
  }
  if (String(connection.requestedBy) === String(myPharmacyId)) {
    throw new ApiError(403, "You can't decline your own request");
  }

  connection.status = 'declined';
  connection.respondedAt = new Date();
  await connection.save();

  res.status(200).json({ success: true, data: { connection: await toConnectionResponse(connection, myPharmacyId) } });
});

/**
 * @desc    Cancel a request the caller sent, while still pending.
 * @route   DELETE /api/pharmacy-network/connections/:id
 * @access  Private (Admin, pharmacy-scoped, requester only)
 */
const cancelConnectionRequest = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const connection = await loadOwnedConnection(req.params.id, myPharmacyId);

  if (connection.status !== 'pending') {
    throw new ApiError(409, 'This request is no longer pending');
  }
  if (String(connection.requestedBy) !== String(myPharmacyId)) {
    throw new ApiError(403, 'You can only cancel a request you sent');
  }

  await connection.deleteOne();
  res.status(200).json({ success: true, message: 'Connection request cancelled' });
});

/**
 * @desc    Block a connected pharmacy - blocks new messages from either side
 *          until the blocker unblocks.
 * @route   PATCH /api/pharmacy-network/connections/:id/block
 * @access  Private (Admin, pharmacy-scoped, participant only)
 */
const blockConnection = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const connection = await loadOwnedConnection(req.params.id, myPharmacyId);

  if (connection.status === 'blocked') {
    throw new ApiError(409, 'This pharmacy is already blocked');
  }
  if (connection.status !== 'accepted') {
    throw new ApiError(409, 'Only a connected pharmacy can be blocked - decline or cancel a pending request instead');
  }

  connection.status = 'blocked';
  connection.blockedBy = myPharmacyId;
  connection.blockedAt = new Date();
  await connection.save();

  res.status(200).json({ success: true, data: { connection: await toConnectionResponse(connection, myPharmacyId) } });
});

/**
 * @desc    Unblock a pharmacy the caller previously blocked.
 * @route   PATCH /api/pharmacy-network/connections/:id/unblock
 * @access  Private (Admin, pharmacy-scoped, original blocker only)
 */
const unblockConnection = asyncHandler(async (req, res) => {
  const myPharmacyId = getOwnPharmacyId(req.user);
  const connection = await loadOwnedConnection(req.params.id, myPharmacyId);

  if (connection.status !== 'blocked') {
    throw new ApiError(409, 'This pharmacy is not currently blocked');
  }
  if (String(connection.blockedBy) !== String(myPharmacyId)) {
    throw new ApiError(403, 'Only the pharmacy that applied the block can remove it');
  }

  connection.status = 'accepted';
  connection.blockedBy = null;
  connection.blockedAt = null;
  await connection.save();

  res.status(200).json({ success: true, data: { connection: await toConnectionResponse(connection, myPharmacyId) } });
});

module.exports = {
  sendConnectionRequest,
  getMyConnections,
  getPendingIncomingCount,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  blockConnection,
  unblockConnection,
};

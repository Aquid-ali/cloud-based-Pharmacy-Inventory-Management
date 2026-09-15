import React, { useState } from 'react';
import { FiCheck, FiMessageCircle, FiSlash, FiUserPlus, FiX } from 'react-icons/fi';
import Button from '../Button';

/**
 * The connection request state machine control, reused on discovery cards
 * and the pharmacy profile page. Renders exactly one state at a time based
 * on `connection` (null = never connected) and `otherPharmacyStatus`.
 */
const ConnectionActionButton = ({
  connection,
  otherPharmacyId,
  otherPharmacyStatus,
  onSendRequest,
  onCancel,
  onAccept,
  onDecline,
  onBlock,
  onUnblock,
  onMessage,
  size = 'sm',
}) => {
  const [busy, setBusy] = useState(false);

  const run = async (fn, ...args) => {
    setBusy(true);
    try {
      await fn(...args);
    } finally {
      setBusy(false);
    }
  };

  if (otherPharmacyStatus === 'inactive') {
    return (
      <Button size={size} variant="secondary" disabled>
        Unavailable
      </Button>
    );
  }

  if (!connection) {
    return (
      <Button size={size} icon={FiUserPlus} loading={busy} onClick={() => run(onSendRequest, otherPharmacyId)}>
        Connect
      </Button>
    );
  }

  if (connection.status === 'pending' && connection.requestedByMe) {
    return (
      <div className="flex items-center gap-2">
        <Button size={size} variant="secondary" disabled>
          Request Pending
        </Button>
        <Button size={size} variant="ghost" loading={busy} onClick={() => run(onCancel, connection._id)}>
          Cancel
        </Button>
      </div>
    );
  }

  if (connection.status === 'pending' && !connection.requestedByMe) {
    return (
      <div className="flex items-center gap-2">
        <Button size={size} icon={FiCheck} loading={busy} onClick={() => run(onAccept, connection._id)}>
          Accept
        </Button>
        <Button size={size} variant="ghost" icon={FiX} loading={busy} onClick={() => run(onDecline, connection._id)}>
          Decline
        </Button>
      </div>
    );
  }

  if (connection.status === 'accepted') {
    return (
      <div className="flex items-center gap-2">
        <Button size={size} icon={FiMessageCircle} onClick={() => onMessage(connection.conversationId)}>
          Message
        </Button>
        {onBlock && (
          <Button size={size} variant="ghost" icon={FiSlash} loading={busy} onClick={() => run(onBlock, connection._id)}>
            Block
          </Button>
        )}
      </div>
    );
  }

  if (connection.status === 'blocked') {
    if (connection.blockedByMe) {
      return (
        <Button size={size} variant="secondary" loading={busy} onClick={() => run(onUnblock, connection._id)}>
          Unblock
        </Button>
      );
    }
    return (
      <Button size={size} variant="secondary" disabled>
        Blocked by them
      </Button>
    );
  }

  // declined - treat like never connected, a fresh request is allowed
  return (
    <Button size={size} icon={FiUserPlus} loading={busy} onClick={() => run(onSendRequest, otherPharmacyId)}>
      Connect
    </Button>
  );
};

export default ConnectionActionButton;

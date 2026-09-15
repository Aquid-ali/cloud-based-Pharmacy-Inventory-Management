const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  sendConnectionRequest,
  getMyConnections,
  getPendingIncomingCount,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  blockConnection,
  unblockConnection,
} = require('../controllers/pharmacyConnectionController');

const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  sendRequestValidator,
  listConnectionsQueryValidator,
  connectionIdParamValidator,
} = require('../validators/pharmacyConnectionValidator');

router.use(protect);

// Guards against spamming connection requests across the whole pharmacy
// directory - independent of the chat send-message limiter.
const sendRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many connection requests - please try again later.' },
});

router.post('/connections', sendRequestLimiter, sendRequestValidator, validate, sendConnectionRequest);
router.get('/connections', listConnectionsQueryValidator, validate, getMyConnections);
router.get('/connections/pending-count', getPendingIncomingCount);

router.patch('/connections/:id/accept', connectionIdParamValidator, validate, acceptConnectionRequest);
router.patch('/connections/:id/decline', connectionIdParamValidator, validate, declineConnectionRequest);
router.delete('/connections/:id', connectionIdParamValidator, validate, cancelConnectionRequest);
router.patch('/connections/:id/block', connectionIdParamValidator, validate, blockConnection);
router.patch('/connections/:id/unblock', connectionIdParamValidator, validate, unblockConnection);

module.exports = router;

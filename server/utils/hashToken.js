const crypto = require('crypto');

/**
 * SHA-256 hex hash of a raw token. Used so single-use secrets (e.g. password
 * reset tokens) are never persisted in the database in their raw form -
 * only this hash is stored, and an incoming raw token is hashed the same
 * way before being looked up.
 */
const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');

module.exports = hashToken;

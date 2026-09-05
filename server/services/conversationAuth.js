// Single shared "is this user allowed to see this conversation" check, reused
// by every conversation/message/attachment endpoint - mirrors the same
// isStoreAdmin/isPharmacyAdmin pattern already used in orderController.js.
function isParticipant(conversation, user) {
  if (!conversation || !user) return false;
  if (user.role === 'Customer') {
    return conversation.customerId.equals(user._id);
  }
  if (user.role === 'Admin') {
    const pharmacyId = user.pharmacyId?._id || user.pharmacyId;
    return Boolean(pharmacyId) && conversation.pharmacyId.equals(pharmacyId);
  }
  return false;
}

module.exports = { isParticipant };

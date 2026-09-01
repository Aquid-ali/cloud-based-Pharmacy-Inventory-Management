const { body, param } = require('express-validator');

const createOrderValidator = [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.medicineId').isMongoId().withMessage('Each item needs a valid medicineId'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item quantity must be at least 1'),
  body('deliveryType').isIn(['Delivery', 'Pickup']).withMessage('deliveryType must be Delivery or Pickup'),
  body('paymentMethod').isIn(['COD', 'UPI', 'Card']).withMessage('paymentMethod must be COD, UPI or Card'),
  body('address')
    .if(body('deliveryType').equals('Delivery'))
    .notEmpty()
    .withMessage('Address is required for delivery orders'),
  body('address.fullName').if(body('deliveryType').equals('Delivery')).trim().notEmpty().withMessage('Recipient name is required'),
  body('address.phone').if(body('deliveryType').equals('Delivery')).trim().notEmpty().withMessage('Contact phone is required'),
  body('address.line1').if(body('deliveryType').equals('Delivery')).trim().notEmpty().withMessage('Address line is required'),
  body('address.city').if(body('deliveryType').equals('Delivery')).trim().notEmpty().withMessage('City is required'),
  body('address.state').if(body('deliveryType').equals('Delivery')).trim().notEmpty().withMessage('State is required'),
  body('address.pincode').if(body('deliveryType').equals('Delivery')).trim().notEmpty().withMessage('Pincode is required'),
  // Exactly one of storeId (legacy Store+Medicine orders) or pharmacyId
  // (Pharmacy+Inventory orders) must be provided - never both, never neither.
  body('storeId').optional().isMongoId().withMessage('Invalid storeId'),
  body('pharmacyId').optional().isMongoId().withMessage('Invalid pharmacyId'),
  body().custom((value) => {
    if (!value.storeId && !value.pharmacyId) {
      throw new Error('Either storeId or pharmacyId is required');
    }
    if (value.storeId && value.pharmacyId) {
      throw new Error('Provide only one of storeId or pharmacyId');
    }
    return true;
  }),
];

const updateOrderStatusValidator = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('status')
    .isIn(['Placed', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'])
    .withMessage('Invalid order status'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid order id')];

module.exports = { createOrderValidator, idParamValidator, updateOrderStatusValidator };

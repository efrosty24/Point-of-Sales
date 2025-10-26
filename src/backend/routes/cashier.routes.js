const router = require('express').Router();
const ctrl = require('../controllers/cashier.controller');

// Customer lookup by phone
router.get('/customers/lookup', ctrl.lookupCustomers);

// Quote and Checkout (transactional)
router.post('/orders/quote', ctrl.quote);
router.post('/orders', ctrl.checkout);

// Receipt payload
router.get('/orders/:id', ctrl.getReceipt);

module.exports = router;
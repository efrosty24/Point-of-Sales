const router = require('express').Router();
const ctrl = require('../controllers/cashier.controller');

// Customer lookup by phone
router.get('/customers/lookup', ctrl.lookupCustomers);

// Quote and Checkout (transactional)
router.post('/orders/quote', ctrl.quote);
router.post('/register', ctrl.postCheckout);

// RegisterList Activity
router.post('/registerList', ctrl.addToRegister);
router.get('/registerList/:id', ctrl.getRegister);
router.delete('/registerList/:id/items/:productId', ctrl.removeRegisterItem);
router.patch('/registerList/:id/identity', ctrl.updateRegisterIdentity);

// Receipt payload
router.get('/orders/:id/receipt', ctrl.getReceipt);

router.get('/products', ctrl.getProductsForCashier);



module.exports = router;
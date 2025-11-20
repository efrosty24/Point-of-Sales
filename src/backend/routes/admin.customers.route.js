const router = require('express').Router();
const ctrl = require('../controllers/customers.controller');

router.get('/recent', ctrl.recent);

// POST path for adding a customer
router.post('/', ctrl.addCustomer);

// PUT/PATCH for updating a customer
router.put('/:id', ctrl.updateCustomer);

// GET path for retrieving customers (with optional filters)
router.get('/', ctrl.getCustomers);

// DELETE path for deleting a customer by ID
router.delete('/:id', ctrl.deleteCustomer);

// PUT/PATCH path for REACTIVATE a customer by ID
router.put('/:id/reactivate', ctrl.reactivateCustomer);

// POST path for logging in
router.post('/login', ctrl.login);

// POST path for update customer password
router.post('/updatePass', ctrl.updatePassword);



module.exports = router;

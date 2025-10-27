const router = require('express').Router();
const ctrl = require('../controllers/customers.controller');

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

module.exports = router;

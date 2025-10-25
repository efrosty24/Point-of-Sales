const router = require('express').Router();
const ctrl = require('../controllers/employees.controller');

// PUT path for adding employees and updating employee
router.post('/employees', ctrl.addEmployee);

// PUT/PATCH for updating an employee
router.put('/employees/:id', ctrl.updateEmployee);

// GET path for retrieving employees
router.get('/employees', ctrl.getEmployees);

// DELETE path for deleting an employee by ID
router.delete('/employees/:id', ctrl.deleteEmployee);

module.exports = router;
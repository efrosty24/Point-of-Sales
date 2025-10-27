const router = require('express').Router();
const ctrl = require('../controllers/employees.controller');

// Create employee
router.post('/', ctrl.addEmployee);

// Update (full o parcial)
router.put('/:id', ctrl.updateEmployee);
router.patch('/:id', ctrl.updateEmployee);

// List employees (con filtros vía query)
router.get('/', ctrl.getEmployees);

// Delete employee
router.delete('/:id', ctrl.deleteEmployee);

module.exports = router;
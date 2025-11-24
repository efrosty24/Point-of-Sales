const router = require('express').Router();
const ctrl = require('../controllers/employees.controller');

// Get employee dashboard data
router.get('/:id/dashboard', ctrl.getEmployeeDashboard);

// Get employee performance
router.get('/performance', ctrl.getEmployeePerformance);

// List employees (with filters via query)
router.get('/', ctrl.getEmployees);

// Create employee
router.post('/', ctrl.addEmployee);

// Update (full or partial)
router.put('/:id', ctrl.updateEmployee);
router.patch('/:id', ctrl.updateEmployee);

// Deactivate employee (soft delete)
router.delete('/:id', ctrl.deactivateEmployee);

// Reactivate employee
router.put('/:id/reactivate', ctrl.reactivateEmployee);

module.exports = router;

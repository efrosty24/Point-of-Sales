const router = require('express').Router();
const ctrl = require('../controllers/sales.controller');

// Sales summary (orders, units, revenue, avg ticket)
router.get('/summary', ctrl.salesSummary);

// Top products by units (and revenue as tie-breaker)
router.get('/top-products', ctrl.topProducts);

// Revenue by category
router.get('/by-category', ctrl.byCategory);

module.exports = router;
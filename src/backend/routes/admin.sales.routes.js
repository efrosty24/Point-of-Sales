const router = require('express').Router();
const ctrl = require('../controllers/sales.controller');

// Other routes...
router.get('/summary', ctrl.salesSummary);
router.get('/top-products', ctrl.topProducts);
router.get('/by-category', ctrl.byCategory);
router.get('/recent', ctrl.getRecentSales);
router.get('/today', ctrl.today);

// Add this line to serve combined chart data
router.get('/charts', ctrl.charts);

module.exports = router;

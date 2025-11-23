const router = require('express').Router();
const ctrl = require('../controllers/sales.controller');

router.get('/summary', ctrl.salesSummary);

router.get('/recent', ctrl.getRecentSales);

router.get('/today', ctrl.today);

router.get('/charts', ctrl.charts);

router.get('/product-performance', ctrl.productPerformance);

router.get('/customer-analytics', ctrl.customerAnalytics);

router.get('/category-performance', ctrl.categoryPerformance);

router.get('/trends', ctrl.salesTrends);

router.get('/category/:id/transactions', ctrl.categoryTransactions);

router.get('/sales-trends/details', ctrl.salesTrendsDetails);

module.exports = router;

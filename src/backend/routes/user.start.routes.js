const router = require('express').Router();
const ctrl = require('../controllers/start.controller');

router.get('/active', ctrl.getActiveSales);
router.get('/events', ctrl.getSaleEvents);
router.get('/events/:eventId/products', ctrl.getProductsBySaleEvent);
router.get('/discounts', ctrl.getDiscountedProducts);
router.get('/events/counts', ctrl.getSaleEventsWithCounts);

module.exports = router;

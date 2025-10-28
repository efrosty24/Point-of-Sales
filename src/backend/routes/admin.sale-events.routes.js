const router = require('express').Router();
const ev = require('../controllers/saleEvents.controller');
const discountsRoutes = require('./admin.discounts.routes');

// Sale Events CRUD 
router.post('/', ev.create);                 // POST /admin/sale-events
router.get('/', ev.list);                    // GET  /admin/sale-events
router.patch('/:saleEventId', ev.update);    // PATCH /admin/sale-events/:saleEventId
router.delete('/:saleEventId', ev.remove);   // DELETE /admin/sale-events/:saleEventId
router.post('/prune', ev.pruneNonActiveDiscounts); // POST /admin/sale-events/prune
router.get('/:saleEventId/discounts', ev.listDiscountsForEvent);
router.use('/:saleEventId/discounts', discountsRoutes); // POST /admin/sale-events/:saleEventId/discounts

module.exports = router;
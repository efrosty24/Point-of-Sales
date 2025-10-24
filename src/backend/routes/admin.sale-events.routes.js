const router = require('express').Router();
const ev = require('../controllers/saleEvents.controller');
const discounts = require('./admin.discounts.routes');

// POST /admin/sale-events
router.post('/', ev.create);           
// GET  /admin/sale-events
router.get('/', ev.list);                    
router.get('/:saleEventId/discounts', ev.listDiscountsForEvent); // list discounts for event
router.use('/:saleEventId/discounts', discounts);                // nested create/patch/delete if you kept them

module.exports = router;
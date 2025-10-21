const r = require('express').Router();
const ev = require('../controllers/saleEvents.controller');
const discounts = require('./admin.discounts.routes');

r.post('/', ev.create);                 // POST /admin/sale-events
r.get('/', ev.list);                    // GET  /admin/sale-events
r.get('/:saleEventId/discounts', ev.listDiscountsForEvent); // list discounts for event
r.use('/:saleEventId/discounts', discounts);                // nested create/patch/delete if you kept them

module.exports = r;
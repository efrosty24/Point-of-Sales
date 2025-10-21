const r = require('express').Router({ mergeParams: true });
const c = require('../controllers/discounts.controller');

r.post('/', c.createForEvent);
r.patch('/:discountId', c.updateOne);
r.delete('/:discountId', c.deleteOne);

module.exports = r;
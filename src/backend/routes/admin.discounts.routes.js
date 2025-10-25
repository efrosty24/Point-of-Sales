const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/discounts.controller');

router.post('/', ctrl.createForEvent);
router.patch('/:discountId', ctrl.updateOne);
router.delete('/:discountId', ctrl.deleteOne);

module.exports = router;
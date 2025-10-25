
const router = require('express').Router();
const ctrl = require('../controllers/orders.controller');


router.get('/recent', ctrl.recent);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);

module.exports = router;
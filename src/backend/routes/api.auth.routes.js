
const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

router.post('/login', ctrl.login);
router.get('/auth/role', ctrl.getRole);

module.exports = router;
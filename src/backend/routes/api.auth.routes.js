
const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');

// Keep the same path the frontend already uses
router.post('/login', ctrl.login);
// New helper to check admin flag/role without logging in again
router.get('/auth/role', ctrl.getRole);

module.exports = router;
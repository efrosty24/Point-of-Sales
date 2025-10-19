const router = require('express').Router();
const ctrl = require('../controllers/inventory.controller');

// DEBUG: router-level ping to prove the router is mounted
router.get('/ping', (req, res) => res.json({ ok: true, where: 'router' }));

// Inventory list (products + stock + supplier)
router.get('/products', ctrl.listInventoryProducts);

// Simple restock (increase stock by items)
router.post('/restock', ctrl.simpleRestock);

// Frontend helpers
router.get('/suppliers', ctrl.listSuppliers);
router.get('/suppliers/:id/products', ctrl.listSupplierProducts);

module.exports = router;
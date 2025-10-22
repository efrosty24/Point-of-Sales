const router = require('express').Router();
const ctrl = require('../controllers/inventory.controller');

// Inventory list (products + stock + supplier)
router.get('/products', ctrl.listInventoryProducts);

// Simple restock (increase stock by items)
router.post('/restock', ctrl.simpleRestock);

// Frontend helpers
router.get('/suppliers', ctrl.listSuppliers);
router.get('/suppliers/:id/products', ctrl.listSupplierProducts);

// Get low-stock products
router.get('/low-stock', ctrl.getLowStockProducts);

module.exports = router;
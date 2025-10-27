const router = require('express').Router();
const ctrl = require('../controllers/inventory.controller');

// Inventory list (products + stock + supplier)
router.get('/products', ctrl.listInventoryProducts);

// Simple restock (increase stock by items)
router.post('/restock', ctrl.simpleRestock);

// Simple Add product to list
router.post('/products', ctrl.addProduct);

// Frontend helpers
router.get('/suppliers', ctrl.listSuppliers);
router.get('/suppliers/:id/products', ctrl.listSupplierProducts);

// Get low-stock products
router.get('/low-stock', ctrl.getLowStockProducts);
// Suppliers CRUD
router.get('/suppliers/:id', ctrl.getSupplierById);
router.post('/suppliers', ctrl.createSupplier);
router.patch('/suppliers/:id', ctrl.updateSupplier);
router.delete('/suppliers/:id', ctrl.deleteSupplier);

// Get Categoriesl
router.get('/categories', ctrl.listCategories);

module.exports = router;
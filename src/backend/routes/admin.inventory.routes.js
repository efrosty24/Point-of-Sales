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

router.get("/restock-orders", ctrl.getRestockOrders);



// Suppliers CRUD
router.get('/suppliers/:id', ctrl.getSupplierById);
router.post('/suppliers', ctrl.createSupplier);
router.patch('/suppliers/:id', ctrl.updateSupplier);
router.delete('/suppliers/:id', ctrl.deleteSupplier);

// Categories CRUdD
router.get('/categories', ctrl.listCategories);
router.get('/categories/search', ctrl.searchCategoriesByName);
router.post('/categories', ctrl.createCategory);
router.patch('/categories/:id', ctrl.updateCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

// Products CRUD
router.get('/products/:id', ctrl.getProductById);
router.patch('/products/:id', ctrl.updateProduct);
router.delete('/products/:id', ctrl.deactivateProduct);
router.patch('/products/:id/reactivate', ctrl.reactivateProduct);
router.get('/products', ctrl.searchProducts);

module.exports = router;
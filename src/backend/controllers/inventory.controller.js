const svc = require('../services/inventory.service');

exports.listInventoryProducts = (req, res) => {
  const { search, category, supplier } = req.query;
  svc.listInventoryProducts({ search, category, supplier }, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
};

exports.simpleRestock = (req, res) => {
  svc.simpleRestock(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.status(201).json(result);
  });
};


exports.listSuppliers = (req, res) => {
  svc.listSuppliers((err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
};

exports.listSupplierProducts = (req, res) => {
  const supplierId = req.params.id;
  svc.listSupplierProducts(supplierId, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
};

exports.getLowStockProducts = (req, res) => {
  svc.getLowStockProducts((err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
};

exports.addProduct = (req, res) => {
    const productData = req.body;
    if (!productData || !productData.Name || !productData.Price || !productData.Stock) {
        return res.status(400).json({ error: 'Missing product data or required fields' });
    }
    svc.addProduct(productData, (err, result) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        return res.status(201).json({
            message: 'Product added',
            product: {
                ProductID: result.insertId,
                Name: productData.Name,
                Brand: productData.Brand,
                Price: productData.Price,
                Stock: productData.Stock,
                QuantityValue: productData.QuantityValue,
                QuantityUnit: productData.QuantityUnit,
                Description: productData.Description
            }
        });
    });
};
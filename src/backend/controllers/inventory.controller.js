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
// GET /admin/inventory/suppliers/:id
// Returns one supplier by ID.
exports.getSupplierById = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'INVALID_ID' });

  svc.getSupplierById(id, (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(row);
  });
};
// POST /admin/inventory/suppliers
// Creates a supplier (Name required).
exports.createSupplier = (req, res) => {
  const { Name, Phone, Email } = req.body || {};
  if (!Name) return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Name is required.' });

  svc.createSupplier({ Name, Phone, Email }, (err, out) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.status(201).json({ ok: true, SupplierID: out.insertId });
  });
};
// PATCH /admin/inventory/suppliers/:id
// Partial update (Name, Phone, Email).
exports.updateSupplier = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'INVALID_ID' });

  const { Name, Phone, Email } = req.body || {};
  const patch = {};
  if (Name !== undefined) patch.Name = Name;
  if (Phone !== undefined) patch.Phone = Phone;
  if (Email !== undefined) patch.Email = Email;

  if (!Object.keys(patch).length) return res.status(400).json({ error: 'EMPTY_PATCH' });

  svc.updateSupplier(id, patch, (err, out) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!out.found) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ ok: true, updated: out.updated, supplier: out.supplier });
  });
};
// DELETE /admin/inventory/suppliers/:id
// Deletes a supplier if not referenced by Products.
exports.deleteSupplier = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'INVALID_ID' });

  svc.deleteSupplier(id, (err, out) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message });
    if (out.inUse) return res.status(409).json({ error: 'SUPPLIER_IN_USE', message: 'Supplier has Products referencing it.' });
    if (!out.found) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ ok: true, deleted: out.deleted });
  });
};
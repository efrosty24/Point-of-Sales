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

exports.getRestockOrders = (req, res) => {
    const { status } = req.query;
    const filterStatus = status || "pending";

    svc.getRestockOrdersByStatus(filterStatus, (err, rows) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.json(rows);
    });
};


exports.markRestockOrderAsRead = (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Invalid restock order ID" });

    svc.markAsRead(Number(id), (err, result) => {
        if (err) return res.status(500).json({ error: "DB error" });
        res.json({ success: true });
    });
};


exports.addProduct = (req, res) => {
  const raw = req.body || {};
  if (!raw.Name || raw.Price == null || raw.Stock == null) {
    return res.status(400).json({ error: 'Missing product data or required fields' });
  }
  if (raw.SupplierID == null || raw.CategoryID == null) {
    return res.status(400).json({ error: 'SupplierID and CategoryID are required' });
  }
  const productData = {
    Name: String(raw.Name).trim(),
    Brand: raw.Brand ? String(raw.Brand).trim() : null,
    Price: Number(raw.Price) || 0,
    Stock: Number(raw.Stock) || 0,
    ReorderThreshold: Number(raw.ReorderThreshold ?? 0),
    IsPricePerQty: Number(raw.IsPricePerQty ?? 0) ? 1 : 0,
    QuantityValue: Number(raw.QuantityValue ?? 1) || 1,
    QuantityUnit: (raw.QuantityUnit ?? 'unit').toString().trim() || 'unit',
    SupplierID: Number(raw.SupplierID),
    CategoryID: Number(raw.CategoryID),
    ImgName: raw.ImgName ?? null,
    ImgPath: raw.ImgPath ?? null,
    Description: raw.Description ?? null,
  };
  if (!Number.isInteger(productData.SupplierID) || !Number.isInteger(productData.CategoryID)) {
    return res.status(400).json({ error: 'SupplierID and CategoryID must be integers' });
  }

  svc.addProduct(productData, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'DB error', detail: err.code || err.message });
    }
    return res.status(201).json({
      message: 'Product added',
      product: {
        ProductID: result.insertId,
        Name: productData.Name,
        Brand: productData.Brand,
        Price: productData.Price,
        Stock: productData.Stock,
        CategoryID: productData.CategoryID,
        QuantityValue: productData.QuantityValue,
        QuantityUnit: productData.QuantityUnit,
        Description: productData.Description
      }
    });
  });
};

exports.listCategories = (req, res) => {
    svc.listCategories((err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json(rows);
    });
};

exports.getSupplierById = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'INVALID_ID' });

  svc.getSupplierById(id, (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(row);
  });
};

exports.createSupplier = (req, res) => {
  const { Name, Phone, Email } = req.body || {};
  if (!Name) return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Name is required.' });

  svc.createSupplier({ Name, Phone, Email }, (err, out) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.status(201).json({ ok: true, SupplierID: out.insertId });
  });
};

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

exports.getProductById = (req, res) => {
  const { id } = req.params;
  svc.getProductById(id, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  });
};

exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  svc.updateProduct(id, fields, (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated successfully' });
  });
};

exports.deactivateProduct = (req, res) => {
  const { id } = req.params;
  svc.deactivateProduct(id, (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Product not found or already inactive' });
    res.json({ message: 'Product deactivated successfully' });
  });
};

exports.reactivateProduct = (req, res) => {
  const { id } = req.params;
  svc.reactivateProduct(id, (err, result) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Product not found or already active' });
    res.json({ message: 'Product reactivated successfully' });
  });
};

exports.searchProducts = (req, res) => {
  const { search } = req.query;
  if (!search) return res.status(400).json({ error: 'Search query is required' });

  svc.searchProducts(search, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
};

exports.searchCategoriesByName = (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Query parameter "name" is required' });

  svc.searchCategoriesByName(name, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
};

exports.createCategory = (req, res) => {
  const { CategoryName } = req.body;
  if (!CategoryName) return res.status(400).json({ error: 'CategoryName is required' });

  svc.createCategory({ CategoryName }, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Category name already exists' });
      }
      return res.status(500).json({ error: 'DB error' });
    }
    res.status(201).json({ message: 'Category created', CategoryID: result.insertId });
  });
};

exports.updateCategory = (req, res) => {
  const { id } = req.params;
  const { CategoryName } = req.body;
  if (!CategoryName) return res.status(400).json({ error: 'CategoryName is required' });

  svc.updateCategory(id, CategoryName, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Category name already exists' });
      }
      return res.status(500).json({ error: 'DB error' });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category updated successfully' });
  });
};

exports.deleteCategory = (req, res) => {
    const { id } = req.params;

    svc.deleteCategory(id, (err, result) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (!result.found)
            return res.status(404).json({ message: 'Category not found' });
        if (result.inUse)
            return res.status(400).json({
                error: 'Category cannot be deleted',
                message: 'Products are still assigned to this category.'
            });
        res.json({ message: 'Category deleted successfully' });
    });
};

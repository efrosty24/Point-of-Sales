const db = require('../config/db.config');

/**
 * GET /admin/inventory/products
 * Returns product inventory with supplier info and a handy IsLow flag.
 * Schema fields used: Products(Name, Brand, Stock, ReorderThreshold, Price, IsPricePerQty, QuantityValue, QuantityUnit, SupplierID), Suppliers(Name)
 */
exports.listInventoryProducts = ({ search, category, supplier }, cb) => {
  const params = [];
  let where = 'WHERE 1=1';
  if (search)   { where += ' AND (p.Name LIKE ? OR p.Brand LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (category) { where += ' AND p.CategoryID = ?'; params.push(category); }
  if (supplier) { where += ' AND p.SupplierID = ?'; params.push(supplier); }

  const sql = `
    SELECT 
      p.ProductID,
      p.Name,
      p.Brand,
      p.Stock,
      p.CategoryID,
      p.ReorderThreshold,
      p.Price,
      p.IsPricePerQty,
      p.QuantityValue,
      p.QuantityUnit,
      p.SupplierID,
      s.Name AS SupplierName,
      (p.Stock <= p.ReorderThreshold) AS IsLow
    FROM Products p
    LEFT JOIN Suppliers s ON s.SupplierID = p.SupplierID
    ${where}
    ORDER BY p.Name
  `;
  db.query(sql, params, (err, rows) => cb(err, rows));
};
/**
 * POST /admin/inventory/product
 * Returns successful product insertion message, product Name, Brand, Price, Quantity, Price per Quantity, and Description
 * Fields used: Products(Name, Brand, ProductID, Stock, ReorderThreshold, Price, IsPricePerQty, QuantityValue, QuantityUnit,
 * SupplierID, ImgName, ImgPath, DateAdded, CategoryID, Description)
 */

exports.addProduct = (productData, callback) => {
    const sql = `
        INSERT INTO Products (
            Name,
            Brand,
            Stock,
            ReorderThreshold,
            Price,
            IsPricePerQty,
            QuantityValue,
            QuantityUnit,
            SupplierID,
            ImgName,
            ImgPath,
            CategoryID,
            Description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
        productData.Name,
        productData.Brand || null,        // NULLABLE
        productData.Stock,
        productData.ReorderThreshold,
        productData.Price,
        productData.IsPricePerQty,
        productData.QuantityValue,
        productData.QuantityUnit,
        productData.SupplierID,
        productData.ImgName || null,      // NULLABLE
        productData.ImgPath || null,      // NULLABLE
        productData.CategoryID,
        productData.Description || null   // NULLABLE
    ];
    db.query(sql, values, callback);
};
/**
 * POST /admin/inventory/restock
 * Body: { SupplierID, items: [{ ProductID, Qty }] }
 * Minimal MVP: increases stock and logs the restock in RestockOrders (one row per product).
 * Schema fields used: Products(Stock, ProductID), RestockOrders(ProductID, SupplierID, Quantity, Status, DatePlaced)
 */
exports.simpleRestock = ({ SupplierID, items }, cb) => {
  if (!SupplierID || !Array.isArray(items) || items.length === 0) {
    return cb(new Error('Invalid payload'));
  }

  const ops = items.map(it => new Promise((resolve, reject) => {
    const qty = Number(it.Qty) || 0;
    if (qty <= 0) return reject(new Error('Qty must be > 0'));

    // 1) Increase stock
    db.query('UPDATE Products SET Stock = Stock + ? WHERE ProductID = ?', [qty, it.ProductID], (e1) => {
      if (e1) return reject(e1);
      // 2) Log a received restock row (history)
      db.query(
        'INSERT INTO RestockOrders (ProductID, SupplierID, Quantity, Status, DatePlaced) VALUES (?, ?, ?, "received", NOW())',
        [it.ProductID, SupplierID, qty],
        (e2) => e2 ? reject(e2) : resolve()
      );
    });
  }));

  Promise.all(ops)
    .then(() => cb(null, { ok: true, itemsUpdated: items.length, SupplierID }))
    .catch(err => cb(err));
};

/**
 * GET /admin/inventory/low-stock
 * Returns products where stock <= ReorderThreshold
 * Schema fields used: Products(ProductID, Name, Brand, Stock, ReorderThreshold, CategoryID, SupplierID), Categories(CategoryName), Suppliers(Name)
 */
exports.getLowStockProducts = (callback) => {
  const sql = `
    SELECT 
      p.ProductID,
      p.Name,
      p.Brand,
      p.Stock,
      p.ReorderThreshold,
      c.CategoryName,
      s.Name AS SupplierName
    FROM Products p
    JOIN Categories c ON p.CategoryID = c.CategoryID
    JOIN Suppliers s ON p.SupplierID = s.SupplierID
    WHERE p.Stock <= p.ReorderThreshold
    ORDER BY p.Stock ASC;
  `;

  db.query(sql, callback);
};
/**
 * GET /admin/inventory/suppliers
 * Returns suppliers for dropdowns and filtering.
 *
 * Schema fields used:
 *   Suppliers(SupplierID, Name, Phone, Email)
 */
exports.listSuppliers = (cb) => {
  db.query('SELECT SupplierID, Name, Phone, Email FROM Suppliers ORDER BY Name', [], (err, rows) => cb(err, rows));
};
/**
 * GET /admin/inventory/suppliers/:id/products
 * Returns products for a given supplier (to build a restock sheet).
 *
 * Schema fields used:
 *   Products(ProductID, Name, Brand, Stock, ReorderThreshold, Price, IsPricePerQty, QuantityValue, QuantityUnit, SupplierID)
 */

exports.listSupplierProducts = (supplierId, cb) => {
  db.query(
    `SELECT ProductID, Name, Brand, Stock, ReorderThreshold, Price, IsPricePerQty, QuantityValue, QuantityUnit
     FROM Products
     WHERE SupplierID = ?
     ORDER BY Name`,
    [supplierId],
    (err, rows) => cb(err, rows)
  );
};

/**
 * GET one supplier
 * Schema: Suppliers(SupplierID, Name, Phone, Email)
 */
exports.getSupplierById = (id, cb) => {
    const sql = `SELECT SupplierID, Name, Phone, Email FROM Suppliers WHERE SupplierID = ? LIMIT 1`;
    db.query(sql, [id], (err, rows) => (err ? cb(err) : cb(null, rows[0] || null)));
};
/**
 * CREATE supplier
 * Inserts into Suppliers(Name, Phone, Email)
 */
exports.createSupplier = ({ Name, Phone, Email }, cb) => {
    const sql = `INSERT INTO Suppliers (Name, Phone, Email) VALUES (?, ?, ?)`;
    db.query(sql, [Name, Phone || null, Email || null], (err, result) => (err ? cb(err) : cb(null, result)));
};
/**
 * PATCH supplier (partial)
 * Updates Name/Phone/Email.
 */
exports.updateSupplier = (id, patch, cb) => {
    const fields = [];
    const params = [];
    if (patch.Name !== undefined)  { fields.push('Name = ?');  params.push(patch.Name || null); }
    if (patch.Phone !== undefined) { fields.push('Phone = ?'); params.push(patch.Phone || null); }
    if (patch.Email !== undefined) { fields.push('Email = ?'); params.push(patch.Email || null); }
    if (!fields.length) return cb(null, { found: true, updated: 0 });

    params.push(id);
    const sql = `UPDATE Suppliers SET ${fields.join(', ')} WHERE SupplierID = ?`;
    db.query(sql, params, (err, result) => {
        if (err) return cb(err);
        if (result.affectedRows === 0) return cb(null, { found: false, updated: 0 });
        exports.getSupplierById(id, (e2, row) => (e2 ? cb(e2) : cb(null, { found: true, updated: result.affectedRows, supplier: row })));
    });
};
/**
 * DELETE supplier
 * Blocks delete if Products reference this SupplierID.
 */
exports.deleteSupplier = (id, cb) => {
    const qCheck = `SELECT COUNT(*) AS cnt FROM Products WHERE SupplierID = ?`;
    db.query(qCheck, [id], (err, rows) => {
        if (err) return cb(err);
        const cnt = rows[0]?.cnt || 0;
        if (cnt > 0) return cb(null, { inUse: true, found: true, deleted: 0 });

        db.query(`DELETE FROM Suppliers WHERE SupplierID = ?`, [id], (e2, result) => {
            if (e2) return cb(e2);
            if (result.affectedRows === 0) return cb(null, { found: false, deleted: 0 });
            cb(null, { found: true, deleted: result.affectedRows });
        });
    });
};

exports.listCategories = (cb) => {
    db.query(
        `SELECT * FROM Categories`,
        (err, rows) => cb(err, rows)
    );
};
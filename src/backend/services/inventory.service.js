const db = require('../config/db.config');

/**
 * GET /admin/inventory/products
 * Returns product inventory with supplier info and a handy IsLow flag.
 * Schema fields used: Products(Name, Brand, Stock, ReorderThreshold, Price, IsPricePerQty, QuantityValue, QuantityUnit, SupplierID), Suppliers(Name)
 */
exports.listInventoryProducts = ({ search, category, supplier }, cb) => {
  const params = [];
  let where = 'WHERE p.IsActive = 1';

  if (search) {
    where += ' AND (p.Name LIKE ? OR p.Brand LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    where += ' AND p.CategoryID = ?';
    params.push(category);
  }
  if (supplier) {
    where += ' AND p.SupplierID = ?';
    params.push(supplier);
  }

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
    productData.Brand || null,        
    productData.Stock,
    productData.ReorderThreshold,
    productData.Price,
    productData.IsPricePerQty,
    productData.QuantityValue,
    productData.QuantityUnit,
    productData.SupplierID,
    productData.ImgName || null,      
    productData.ImgPath || null,      
    productData.CategoryID,
    productData.Description || null   
  ];
  db.query(sql, values, callback);
};
exports.getRestockOrdersByStatus = (status, callback) => {
  const sql = `
    SELECT r.RestockOrderID, r.ProductID, p.Name AS ProductName,
           r.Quantity, r.Status, r.DatePlaced
    FROM RestockOrders r
    INNER JOIN Products p ON r.ProductID = p.ProductID
    WHERE r.Status = ?
  `;
  db.query(sql, [status], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
};

exports.markAsRead = (restockOrderId, cb) => {
  const sql = `
    UPDATE RestockOrders
    SET Status = 'read'
    WHERE RestockOrderID = ?
  `;
  db.query(sql, [restockOrderId], (err, result) => {
    if (err) return cb(err);
    if (result.affectedRows === 0) return cb(new Error("Restock order not found"));
    cb(null, result);
  });
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
    if (qty <= 0) return reject(new Error(`Qty must be > 0 (ProductID ${it.ProductID})`));
    db.query('SELECT SupplierID FROM Products WHERE ProductID = ?', [it.ProductID], (err, rows) => {
      if (err) return reject(err);
      if (!rows.length) return reject(new Error(`ProductID ${it.ProductID} not found`));

      const productSupplier = rows[0].SupplierID;
      if (productSupplier !== SupplierID) {
        return reject(new Error(`Supplier mismatch for ProductID ${it.ProductID}`));
      }
      db.query(
        'UPDATE Products SET Stock = Stock + ? WHERE ProductID = ?',
        [qty, it.ProductID],
        (e1) => {
          if (e1) return reject(e1);

          db.query(
            'INSERT INTO RestockOrders (ProductID, SupplierID, Quantity, Status, DatePlaced) VALUES (?, ?, ?, "received", NOW())',
            [it.ProductID, SupplierID, qty],
            (e2) => e2 ? reject(e2) : resolve()
          );
        }
      );
    });
  }));

  Promise.allSettled(ops).then(results => {
    const errors = results.filter(r => r.status === 'rejected').map(r => r.reason.message);
    if (errors.length) return cb(new Error(errors.join('; ')));

    cb(null, { ok: true, itemsUpdated: items.length, SupplierID });
  }).catch(err => cb(err));
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
    WHERE p.IsActive = 1
      AND p.Stock <= p.ReorderThreshold
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
  db.query(
    'SELECT SupplierID, Name, Phone, Email FROM Suppliers ORDER BY Name',
    [],
    (err, rows) => cb(err, rows)
  );
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
       AND IsActive = 1
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
    exports.getSupplierById(id, (e2, row) =>
      (e2 ? cb(e2) : cb(null, { found: true, updated: result.affectedRows, supplier: row }))
    );
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

/**
 * GET /admin/inventory/products/:id
 * Returns details of a single product by ID.
 */
exports.getProductById = (id, callback) => {
  const sql = `
    SELECT 
      p.ProductID, p.Name, p.Brand, p.Price, p.Stock, p.ReorderThreshold,
      p.Description, p.IsPricePerQty, p.QuantityValue, p.QuantityUnit,
      c.CategoryName, s.Name AS SupplierName, p.IsActive
    FROM Products p
    JOIN Categories c ON p.CategoryID = c.CategoryID
    JOIN Suppliers s ON p.SupplierID = s.SupplierID
    WHERE p.ProductID = ?;
  `;
  db.query(sql, [id], callback);
};

/**
 * PATCH /admin/inventory/products/:id
 * Updates existing product details.
 */
exports.updateProduct = (id, fields, callback) => {
  const sql = "UPDATE Products SET ? WHERE ProductID = ?";
  db.query(sql, [fields, id], callback);
};

/**
 * DELETE /admin/inventory/products/:id
 * Marks a product as inactive (deactivated) instead of deleting it.
 */
exports.deactivateProduct = (id, callback) => {
  const sql = `
    UPDATE Products
    SET IsActive = 0
    WHERE ProductID = ? AND IsActive = 1;
  `;
  db.query(sql, [id], callback);
};

/**
 * PATCH /admin/inventory/products/:id/reactivate
 * Reactivates a previously inactive product.
 */
exports.reactivateProduct = (id, callback) => {
  const sql = `
    UPDATE Products
    SET IsActive = 1
    WHERE ProductID = ? AND IsActive = 0;
  `;
  db.query(sql, [id], callback);
};

/**
 * GET /admin/inventory/products?search=<name>
 * Searches for products by name or brand.
 */
exports.searchProducts = (search, callback) => {
  const sql = `
    SELECT 
      p.ProductID, p.Name, p.Brand, p.Price, p.Stock,
      c.CategoryName, s.Name AS SupplierName
    FROM Products p
    JOIN Categories c ON p.CategoryID = c.CategoryID
    JOIN Suppliers s ON p.SupplierID = s.SupplierID
    WHERE p.IsActive = 1
      AND (p.Name LIKE ? OR p.Brand LIKE ?)
  `;
  const like = `%${search}%`;
  db.query(sql, [like, like], callback);
};

/**
 * GET /admin/inventory/categories/search?name=<text>
 * Searches categories by name (partial match).
 */
exports.searchCategoriesByName = (name, callback) => {
  const sql = `
    SELECT CategoryID, CategoryName
    FROM Categories
    WHERE CategoryName LIKE ?
    ORDER BY CategoryName ASC;
  `;
  db.query(sql, [`%${name}%`], callback);
};

/**
 * POST /admin/inventory/categories
 * Creates a new category.
 */
exports.createCategory = (data, callback) => {
  const sql = `INSERT INTO Categories (CategoryName) VALUES (?);`;
  db.query(sql, [data.CategoryName], callback);
};

/**
 * PATCH /admin/inventory/categories/:id
 * Updates a category's name.
 */
exports.updateCategory = (id, newName, callback) => {
  const sql = `UPDATE Categories SET CategoryName = ? WHERE CategoryID = ?;`;
  db.query(sql, [newName, id], callback);
};

/**
 * DELETE category
 * Blocks delete if Products reference this CategoryID.
 */
exports.deleteCategory = (id, cb) => {
  const qCheck = `SELECT COUNT(*) AS cnt FROM Products WHERE CategoryID = ?`;
  db.query(qCheck, [id], (err, rows) => {
    if (err) return cb(err);
    const cnt = rows[0]?.cnt || 0;
    if (cnt > 0) return cb(null, { inUse: true, found: true, deleted: 0 });
    db.query(`DELETE FROM Categories WHERE CategoryID = ?`, [id], (e2, result) => {
      if (e2) return cb(e2);
      if (result.affectedRows === 0)
        return cb(null, { found: false, deleted: 0 });
      cb(null, { found: true, deleted: result.affectedRows });
    });
  });
};
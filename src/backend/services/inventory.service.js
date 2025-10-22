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
 * Optional helpers for frontend
 */
exports.listSuppliers = (cb) => {
  db.query('SELECT SupplierID, Name, Phone, Email FROM Suppliers ORDER BY Name', [], (err, rows) => cb(err, rows));
};

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
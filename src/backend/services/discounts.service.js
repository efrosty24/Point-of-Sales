const db = require('../config/db.config');

// AUX: ensure product exists
exports.ensureProductExists = (ProductID, cb) => {
  db.query('SELECT 1 FROM Products WHERE ProductID = ? LIMIT 1', [ProductID], (err, rows) => {
    if (err) return cb(err);
    if (!rows.length) return cb(new Error('PRODUCT_NOT_FOUND'));
    cb(null, true);
  });
};

const ensureEventActiveToday = (SaleEventID, cb) => {
  const sql = `
    SELECT 1
    FROM SaleEvents
    WHERE SaleEventID = ?
      AND CURDATE() BETWEEN StartDate AND EndDate
    LIMIT 1
  `;
  db.query(sql, [SaleEventID], (err, rows) => {
    if (err) return cb(err);
    if (!rows.length) {
      const e = new Error('EVENT_NOT_ACTIVE');
      e.code = 'EVENT_NOT_ACTIVE';
      return cb(e);
    }
    cb(null, true);
  });
};

const ensureNoDuplicateActiveForProduct = (ProductID, cb) => {
  const sql = `
    SELECT d.DiscountID
    FROM Discounts d
    JOIN SaleEvents e ON e.SaleEventID = d.SaleEventID
    WHERE d.ProductID = ?
      AND CURDATE() BETWEEN e.StartDate AND e.EndDate
    LIMIT 1
  `;
  db.query(sql, [ProductID], (err, rows) => {
    if (err) return cb(err);
    if (rows.length) {
      const e = new Error('DUPLICATE_DISCOUNT');
      e.code = 'DUPLICATE_DISCOUNT';
      return cb(e);
    }
    cb(null, true);
  });
};

// CREATE
exports.createDiscount = ({ SaleEventID, ProductID, DiscountType, DiscountValue, Conditions }, cb) => {
  ensureEventActiveToday(SaleEventID, (eAct) => {
    if (eAct) return cb(eAct);

    ensureNoDuplicateActiveForProduct(ProductID, (eDup) => {
      if (eDup) return cb(eDup);

      const ins = `
        INSERT INTO Discounts (SaleEventID, ProductID, DiscountType, DiscountValue, Conditions)
        VALUES (?, ?, ?, ?, ?)
      `;
      const vals = [SaleEventID, ProductID, DiscountType, DiscountValue, Conditions || null];
      db.query(ins, vals, (e2, r2) => {
        if (e2) return cb(e2);
        cb(null, { ok: true, DiscountID: r2.insertId });
      });
    });
  });
};

// LIST by event
exports.listByEvent = (SaleEventID, cb) => {
  const sql = `
    SELECT d.DiscountID, d.ProductID, p.Name AS ProductName,
           d.DiscountType, d.DiscountValue, d.Conditions
    FROM Discounts d
    LEFT JOIN Products p ON p.ProductID = d.ProductID
    WHERE d.SaleEventID = ?
    ORDER BY d.DiscountID DESC
  `;
  db.query(sql, [SaleEventID], (err, rows) => (err ? cb(err) : cb(null, rows)));
};

// GET one
exports.getDiscountById = (id, cb) => {
  db.query(
    `SELECT DiscountID, SaleEventID, ProductID, DiscountType, DiscountValue, Conditions
     FROM Discounts WHERE DiscountID = ? LIMIT 1`,
    [id],
    (err, rows) => (err ? cb(err) : cb(null, rows[0] || null))
  );
};

// UPDATE partial (type/value/conditions)
exports.updateDiscountPartial = (id, patch, cb) => {
  const fields = [];
  const params = [];

  if (patch.DiscountType !== undefined)  { fields.push('DiscountType = ?');  params.push(patch.DiscountType); }
  if (patch.DiscountValue !== undefined) { fields.push('DiscountValue = ?'); params.push(patch.DiscountValue); }
  if (patch.Conditions !== undefined)    { fields.push('Conditions = ?');    params.push(patch.Conditions ?? null); }

  if (!fields.length) {
    const e = new Error('EMPTY_PATCH'); e.code = 'EMPTY_PATCH'; return cb(e);
  }

  params.push(id);
  const sql = `UPDATE Discounts SET ${fields.join(', ')} WHERE DiscountID = ?`;

  db.query(sql, params, (err, result) => {
    if (err) return cb(err);
    if (result.affectedRows === 0) return cb(null, { found: false, updated: 0 });

    exports.getDiscountById(id, (e2, row) => {
      if (e2) return cb(e2);
      cb(null, { found: true, updated: result.affectedRows, discount: row });
    });
  });
};

// DELETE
exports.deleteById = (id, cb) => {
  db.query('DELETE FROM Discounts WHERE DiscountID = ?', [id], (err, result) => {
    if (err) return cb(err);
    if (result.affectedRows === 0) return cb(null, { found: false, deleted: 0 });
    cb(null, { found: true, deleted: result.affectedRows });
  });
};
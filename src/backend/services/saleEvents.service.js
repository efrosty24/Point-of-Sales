const db = require('../config/db.config');

// CREATE
exports.create = ({ Name, Description, StartDate, EndDate }, cb) => {
  const sql = `
    INSERT INTO SaleEvents (Name, Description, StartDate, EndDate)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [Name, Description || null, StartDate, EndDate], (err, res) => {
    if (err) return cb(err);
    cb(null, { ok: true, SaleEventID: res.insertId });
  });
};

// LIST
exports.list = (cb) => {
  const sql = `
    SELECT SaleEventID, Name, Description, StartDate, EndDate
    FROM SaleEvents
    ORDER BY StartDate DESC, SaleEventID DESC
  `;
  db.query(sql, (err, rows) => (err ? cb(err) : cb(null, rows)));
};

// EXISTS
exports.exists = (SaleEventID, cb) => {
  db.query('SELECT 1 FROM SaleEvents WHERE SaleEventID = ? LIMIT 1', [SaleEventID], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows && rows.length > 0);
  });
};

// UPDATE (partial)
exports.update = (id, patch, cb) => {
  const fields = [];
  const vals = [];

  if (patch.Name !== undefined)        { fields.push('Name = ?');        vals.push(patch.Name); }
  if (patch.Description !== undefined) { fields.push('Description = ?'); vals.push(patch.Description ?? null); }
  if (patch.StartDate !== undefined)   { fields.push('StartDate = ?');   vals.push(patch.StartDate); }
  if (patch.EndDate !== undefined)     { fields.push('EndDate = ?');     vals.push(patch.EndDate); }

  if (!fields.length) return cb(null, { found: true, updated: 0, event: null });

  vals.push(id);

  const sql = `UPDATE SaleEvents SET ${fields.join(', ')} WHERE SaleEventID = ?`;
  db.query(sql, vals, (err, r) => {
    if (err) return cb(err);
    if (r.affectedRows === 0) return cb(null, { found: false, updated: 0 });

    db.query(
      `SELECT SaleEventID, Name, Description, StartDate, EndDate
       FROM SaleEvents WHERE SaleEventID = ?`,
      [id],
      (e2, rows) => {
        if (e2) return cb(e2);
        cb(null, { found: true, updated: r.affectedRows, event: rows[0] || null });
      }
    );
  });
};

// DELETE
exports.remove = (id, cb) => {
  db.query('DELETE FROM SaleEvents WHERE SaleEventID = ?', [id], (err, r) => {
    if (err) return cb(err);
    if (r.affectedRows === 0) return cb(null, { found: false, deleted: 0 });
    cb(null, { found: true, deleted: r.affectedRows });
  });
};

// PRUNE: remove discounts linked to non-active sale events
exports.pruneNonActiveDiscounts = (cb) => {
  const sql = `
    DELETE d
    FROM Discounts d
    LEFT JOIN SaleEvents e ON e.SaleEventID = d.SaleEventID
    WHERE e.SaleEventID IS NULL
       OR CURDATE() < e.StartDate
       OR CURDATE() > e.EndDate
  `;
  db.query(sql, (err, result) => {
    if (err) return cb(err);
    cb(null, { ok: true, deleted: result.affectedRows || 0 });
  });
};
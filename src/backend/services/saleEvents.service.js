const db = require('../config/db.config');


exports.create = ({ Name, Description, StartDate, EndDate }, cb) => {
  const sql = `INSERT INTO SaleEvents (Name, Description, StartDate, EndDate) VALUES (?, ?, ?, ?)`;
  db.query(sql, [Name, Description || null, StartDate, EndDate], (err, res) =>
    err ? cb(err) : cb(null, { ok: true, SaleEventID: res.insertId })
  );
};

exports.list = (cb) => {
  const sql = `SELECT SaleEventID, Name, Description, StartDate, EndDate FROM SaleEvents ORDER BY StartDate DESC`;
  db.query(sql, (err, rows) => (err ? cb(err) : cb(null, rows)));
};
exports.exists = (SaleEventID, cb) => {
  db.query('SELECT 1 FROM SaleEvents WHERE SaleEventID = ? LIMIT 1', [SaleEventID], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows.length > 0);
  });
};
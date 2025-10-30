
const db = require('../config/db.config');

exports.findEmployeeById = (employeeId, cb) => {
  const sql = 'SELECT * FROM Employees WHERE EmployeeID = ? LIMIT 1';
  db.query(sql, [employeeId], (err, rows) => {
    if (err) return cb(err);
    cb(null, rows[0] || null);
  });
};

exports.verifyPassword = (user, password) => {
  if (!user) return false;
  return String(user.UserPassword) === String(password);
};

exports.computeIsAdmin = (user) => {
  if (!user) return false;
  if (user.IsAdmin !== undefined && user.IsAdmin !== null) {
    return Boolean(user.IsAdmin);
  }
  return String(user.Role || '').toLowerCase() === 'admin';
};
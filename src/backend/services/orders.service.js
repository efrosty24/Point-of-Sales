const db = require('../config/db.config');


exports.listRecent = (limit = 5, cb) => {
  const sql = `
    SELECT 
      o.OrderID,
      o.DatePlaced,
      COALESCE(SUM(od.Quantity * od.Price), 0) AS Total,
      c.FirstName, c.LastName
    FROM Orders o
    LEFT JOIN OrderDetails od ON od.OrderID = o.OrderID
    LEFT JOIN Customers c     ON c.CustomerID = o.CustomerID
    GROUP BY o.OrderID, o.DatePlaced, c.FirstName, c.LastName
    ORDER BY o.DatePlaced DESC
    LIMIT ?;
  `;
  db.query(sql, [Number(limit) || 5], (err, rows) => cb(err, rows));
};

exports.list = ({ from, to, customerId, employeeId }, cb) => {
  const where = [];
  const params = [];
  if (from)       { where.push('o.DatePlaced >= ?'); params.push(from); }
  if (to)         { where.push('o.DatePlaced < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(to); }
  if (customerId) { where.push('o.CustomerID = ?'); params.push(customerId); }
  if (employeeId) { where.push('o.EmployeeID = ?'); params.push(employeeId); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT 
      o.OrderID, o.DatePlaced, o.CustomerID, o.EmployeeID,
      COALESCE(SUM(od.Quantity * od.Price), 0) AS Total
    FROM Orders o
    LEFT JOIN OrderDetails od ON od.OrderID = o.OrderID
    ${clause}
    GROUP BY o.OrderID, o.DatePlaced, o.CustomerID, o.EmployeeID
    ORDER BY o.DatePlaced DESC
    LIMIT 200;
  `;
  db.query(sql, params, (err, rows) => cb(err, rows));
};

exports.getById = (orderId, cb) => {
  const headerSql = `
    SELECT o.OrderID, o.DatePlaced, o.CustomerID, o.EmployeeID,
           c.FirstName AS CustomerFirst, c.LastName AS CustomerLast
    FROM Orders o
    LEFT JOIN Customers c ON c.CustomerID = o.CustomerID
    WHERE o.OrderID = ? LIMIT 1;
  `;
  const itemsSql = `
    SELECT od.ProductID, p.Name, od.Quantity, od.Price,
           (od.Quantity * od.Price) AS LineTotal
    FROM OrderDetails od
    LEFT JOIN Products p ON p.ProductID = od.ProductID
    WHERE od.OrderID = ?
    ORDER BY od.OrderDetailID ASC;
  `;
  db.query(headerSql, [orderId], (e1, hRows) => {
    if (e1) return cb(e1);
    if (!hRows.length) return cb(null, null);
    db.query(itemsSql, [orderId], (e2, iRows) => {
      if (e2) return cb(e2);
      const total = iRows.reduce((s, r) => s + Number(r.LineTotal || 0), 0);
      cb(null, { header: hRows[0], items: iRows, total });
    });
  });
};
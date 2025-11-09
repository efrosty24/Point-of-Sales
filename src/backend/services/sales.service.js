const db = require('../config/db.config');

/**
 * GET /admin/sales/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Uses Orders(DatePlaced) and OrderDetails(Quantity, Price).
 */
exports.salesSummary = ({ from, to }, cb) => {
  const params = [];
  let where = 'WHERE 1=1';
  if (from) { where += ' AND DATE(o.DatePlaced) >= ?'; params.push(from); }
  if (to)   { where += ' AND DATE(o.DatePlaced) <= ?'; params.push(to); }

  const sql = `
    WITH base AS (
      SELECT o.OrderID, o.Total, o.DatePlaced, o.CustomerID, o.EmployeeID
      FROM Orders o
      ${where}
    )
    SELECT
      COUNT(*)                                             AS orders,
      COALESCE(SUM(base.Total), 0)                         AS revenue,
      CASE WHEN COUNT(*) = 0 THEN 0
           ELSE COALESCE(SUM(base.Total),0)/COUNT(*) END   AS avg_ticket
    FROM base
    JOIN Customers  c  ON c.CustomerID  = base.CustomerID
    JOIN Employees  e  ON e.EmployeeID  = base.EmployeeID
    JOIN (SELECT DISTINCT OrderID FROM OrderDetails) od ON od.OrderID = base.OrderID
  `;
  db.query(sql, params, (err, rows) => cb(err, rows && rows[0]));
};

/**
 * GET /admin/sales/top-products?from=&to=&limit=10
 * Aggregates units and revenue per product.
 */
exports.topProducts = ({ from, to, limit = 10 }, cb) => {
  const params = [];
  let where = 'WHERE 1=1';
  if (from) { where += ' AND DATE(o.DatePlaced) >= ?'; params.push(from); }
  if (to)   { where += ' AND DATE(o.DatePlaced) <= ?'; params.push(to); }

  const sql = `
    SELECT
      p.ProductID,
      p.Name,
      c.CategoryName,                                     
      COALESCE(SUM(od.Quantity), 0)            AS units,
      COALESCE(SUM(od.Quantity * od.Price), 0) AS revenue
    FROM Orders o
    JOIN OrderDetails od ON od.OrderID   = o.OrderID       
    JOIN Products     p  ON p.ProductID  = od.ProductID    
    JOIN Categories   c  ON c.CategoryID = p.CategoryID    
    ${where}
    GROUP BY p.ProductID, p.Name, c.CategoryName
    ORDER BY units DESC, revenue DESC
    LIMIT ?
  `;
  params.push(Number(limit));
  db.query(sql, params, (err, rows) => cb(err, rows));
};

/**
 * GET /admin/sales/by-category?from=&to=
 * Aggregates revenue by category.
 */
exports.byCategory = ({ from, to }, cb) => {
  const params = [];
  let where = 'WHERE 1=1';
  if (from) { where += ' AND DATE(o.DatePlaced) >= ?'; params.push(from); }
  if (to)   { where += ' AND DATE(o.DatePlaced) <= ?'; params.push(to); }

  const sql = `
    SELECT
      c.CategoryID,
      c.CategoryName,
      COALESCE(SUM(od.Quantity * od.Price), 0) AS revenue
    FROM Orders o
    JOIN OrderDetails od ON od.OrderID   = o.OrderID        /* 1 */
    JOIN Products     p  ON p.ProductID  = od.ProductID     /* 2 */
    JOIN Categories   c  ON c.CategoryID = p.CategoryID     /* 3 */
    /* opcional 4to JOIN (no altera el GROUP BY de categoría) */
    LEFT JOIN Suppliers s ON s.SupplierID = p.SupplierID
    ${where}
    GROUP BY c.CategoryID, c.CategoryName
    ORDER BY revenue DESC
  `;
  db.query(sql, params, (err, rows) => cb(err, rows));
};
/**
 * GET /admin/sales/recent?limit=10
 * Fetches recent sales with customer info.
 */
exports.fetchRecentSales = (limit = 10, cb) => {
  const sql = `
    SELECT o.OrderID, o.DatePlaced, o.Total, o.Status, c.FirstName, c.LastName
    FROM Orders o
    JOIN Customers c ON c.CustomerID = o.CustomerID
    ORDER BY o.DatePlaced DESC
    LIMIT ?
  `;
  db.query(sql, [limit], (err, rows) => cb(err, rows));
};
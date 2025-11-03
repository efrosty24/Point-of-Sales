const db = require('../config/db.config');

exports.findCustomerById = (customerId, cb) => {
  const sql = `
    SELECT CustomerID, FirstName, LastName, Email, Phone, Address, City, State, Zip, Country
    FROM Customers
    WHERE CustomerID = ?
    LIMIT 1;
  `;
  db.query(sql, [customerId], cb);
};

exports.findOrderById = (orderId, cb) => {
  const sql = `
    SELECT 
      o.OrderID, o.CustomerID, o.EmployeeID,
      o.Subtotal, o.DiscountTotal, o.Tax, o.Total,
      o.Status, o.DatePlaced,
      c.FirstName AS CustomerFirst, c.LastName AS CustomerLast
    FROM Orders o
    LEFT JOIN Customers c ON o.CustomerID = c.CustomerID
    WHERE o.OrderID = ?
    LIMIT 1;
  `;
  db.query(sql, [orderId], cb);
};

exports.findProductById = (productId, cb) => {
  const sql = `
    SELECT ProductID, Name, Brand, Price, Stock, SupplierID, CategoryID, ReorderThreshold
    FROM Products
    WHERE ProductID = ?
    LIMIT 1;
  `;
  db.query(sql, [productId], cb);
};
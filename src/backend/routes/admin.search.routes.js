const express = require('express');
const router = express.Router();
const db = require('../config/db.config');

router.get('/', (req, res) => {
    const { type, q } = req.query;

    if (!type || !q) return res.status(400).json({ error: "Missing type or query" });

    let sql;
    let params = [q]; // exact match or partial with `%` if needed

    if (type === 'customers') {
        sql = `
          SELECT *
          FROM Customers
          WHERE CustomerID = ?
        `;
    } else if (type === 'orders') {
        sql = `
          SELECT o.OrderID, o.Total, o.Status, o.DatePlaced,
                 c.FirstName AS CustomerFirst, c.LastName AS CustomerLast
          FROM Orders o
          LEFT JOIN Customers c ON o.CustomerID = c.CustomerID
          WHERE o.OrderID = ?
        `;
    } else if (type === 'products') {
        sql = `
          SELECT *
          FROM Products
          WHERE ProductID = ?
        `;
    } else {
        return res.status(400).json({ error: "Invalid search type" });
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

module.exports = router;

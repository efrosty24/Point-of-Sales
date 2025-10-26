const db = require('../config/db.config');
/**
 * Normalize phone by keeping only digits.
 */
const normPhone = (raw) => (raw ? String(raw).replace(/[^\d]/g, '') : '');

// Round to 2 decimals to avoid floating drift.
const round2 = (x) => Math.round(Number(x) * 100) / 100;

/**
 * Lookup customers by phone (digit-normalized exact match).
 * Tables used: Customers(CustomerID, FirstName, LastName, Phone, Email)
 * Returns up to 10 matches; if phone is empty → [].
 */
exports.lookupCustomersByPhone = (phone, cb) => {
    const p = normPhone(phone);
    if (!p) return cb(null, []); // empty phone → front should offer Guest flow

    const sql = `
    SELECT CustomerID, FirstName, LastName, Phone, Email
    FROM Customers
    WHERE REPLACE(REPLACE(REPLACE(Phone,'-',''),'(',''),')','') = ?
    ORDER BY CustomerID DESC
    LIMIT 10
  `;
    db.query(sql, [p], (err, rows) => cb(err, rows));
};

/**
 * Quote an order.
 * Uses current product prices from Products and validates quantities.
 * Tables used: Products(ProductID, Price, Name)
 * Input: { items: [{ ProductID, Qty }], taxRate? }
 * Output: { subtotal, tax, total, items: [{ ProductID, Name, Qty, Price, LineTotal }] }
 */
exports.quoteOrder = ({ items, taxRate = 0 }, cb) => {
    if (!Array.isArray(items) || items.length === 0) {
        return cb(new Error('EMPTY_CART'));
    }

    const ids = items.map(it => it.ProductID);
    const placeholders = ids.map(() => '?').join(',');
    const sql = `SELECT ProductID, Price, Name FROM Products WHERE ProductID IN (${placeholders})`;

    db.query(sql, ids, (e, rows) => {
        if (e) return cb(e);

        const priceMap = new Map(rows.map(r => [r.ProductID, Number(r.Price)]));
        let subtotal = 0;
        let lines = [];

        try {
            lines = items.map(it => {
                const qty = Number(it.Qty) || 0;
                if (qty <= 0) throw new Error(`BAD_QTY:${it.ProductID}`);

                const price = priceMap.get(it.ProductID);
                if (price == null) throw new Error(`PRODUCT_NOT_FOUND:${it.ProductID}`);

                const name = rows.find(r => r.ProductID === it.ProductID)?.Name || '';
                const lineTotal = round2(price * qty);
                subtotal += lineTotal;

                return { ProductID: it.ProductID, Name: name, Qty: qty, Price: price, LineTotal: lineTotal };
            });
        } catch (err) {
            return cb(err);
        }

        subtotal = round2(subtotal);
        const tax = round2(subtotal * Number(taxRate));
        const total = round2(subtotal + tax);

        cb(null, { subtotal, tax, total, items: lines });
    });
};

/**
 * Create an order transactionally and decrement stock.
 * - Locks product rows (FOR UPDATE) to avoid race conditions.
 * - Inserts Orders header and OrderDetails lines with snapshot Price.
 * - Decrements Products.Stock.
 *
 * Tables used:
 *   Orders(OrderID, CustomerID, EmployeeID, DatePlaced, Status, Subtotal, TaxTotal, Total, PaymentMethod)
 *   OrderDetails(OrderID, ProductID, Qty, Price)
 *   Products(ProductID, Price, Stock)
 *
 * Input: { customerId, employeeId?, items: [{ ProductID, Qty }], payment: { method, amount? }, taxRate? }
 * Output: { ok: true, OrderID, subtotal, tax, total }
 */
exports.createOrderTransactional = ({ customerId, employeeId, items, payment, taxRate = 0 }, cb) => {
    if (!Array.isArray(items) || items.length === 0) return cb(new Error('EMPTY_CART'));

    const conn = db;

    const rollback = (e) => conn.rollback(() => cb(e));

    conn.beginTransaction((e0) => {
        if (e0) return cb(e0);

        const ids = items.map(it => it.ProductID);
        const placeholders = ids.map(() => '?').join(',');

        conn.query(
            `SELECT ProductID, Price FROM Products WHERE ProductID IN (${placeholders}) FOR UPDATE`,
            ids,
            (e1, priceRows) => {
                if (e1) return rollback(e1);

                const priceMap = new Map(priceRows.map(r => [r.ProductID, Number(r.Price)]));

                let subtotal = 0;
                const lineValues = [];   
                const stockUpdates = []; // tuples [qty, productId]

                for (const it of items) {
                    const qty = Number(it.Qty) || 0;
                    if (qty <= 0) return rollback(new Error('BAD_QTY'));

                    const price = priceMap.get(it.ProductID);
                    if (price == null) return rollback(new Error('PRODUCT_NOT_FOUND'));

                    subtotal += Math.round(price * qty * 100) / 100;
                    lineValues.push([/*OrderID later*/ 0, it.ProductID, qty, price]);
                    stockUpdates.push([qty, it.ProductID]);
                }

                subtotal = Math.round(subtotal * 100) / 100;
                const tax = Math.round(subtotal * Number(taxRate) * 100) / 100;
                const total = Math.round((subtotal + tax) * 100) / 100;

    
                const orderSql = `INSERT INTO Orders (CustomerID, EmployeeID, Subtotal, Tax, Total, Status) VALUES (?, ?, ?, ?, ?, ?)`;
                conn.query(
                    orderSql,
                    [customerId, employeeId, subtotal, tax, total, 'paid'], 
                    (e2, r2) => {
                        if (e2) return rollback(e2);
                        const orderId = r2.insertId;
                        const detailsSql = `INSERT INTO OrderDetails (OrderID, ProductID, Quantity, Price) VALUES ?`;
                        const detailsValues = lineValues.map(v => [orderId, v[1], v[2], v[3]]);

                        conn.query(detailsSql, [detailsValues], (e3) => {
                            if (e3) return rollback(e3);

                            const doStockUpdate = (tuple, done) => {
                                const [q, pid] = tuple;
                                conn.query(`UPDATE Products SET Stock = Stock - ? WHERE ProductID = ?`, [q, pid], done);
                            };

                            let i = 0;
                            const next = (errStock) => {
                                if (errStock) return rollback(errStock);
                                if (i >= stockUpdates.length) {
                                    return conn.commit((e4) => {
                                        if (e4) return rollback(e4);
                                        cb(null, { ok: true, OrderID: orderId, subtotal, tax, total });
                                    });
                                }
                                doStockUpdate(stockUpdates[i++], next);
                            };
                            next();
                        });
                    }
                );
            }
        );
    });
};

/**
 * Reassign an order from Guest to a real customer.
 * (Admin action)
 * Tables used: Orders(OrderID, CustomerID)
 */
exports.reassignOrderCustomer = ({ orderId, customerId }, cb) => {
    const sql = `UPDATE Orders SET CustomerID = ? WHERE OrderID = ?`;
    db.query(sql, [customerId, orderId], (err, r) => {
        if (err) return cb(err);
        cb(null, { ok: true, updated: r?.affectedRows || 0 });
    });
};

/**
 * Create an order transactionally and decrement stock.
 * - Locks product rows (FOR UPDATE) to avoid race conditions.
 * - Inserts Orders header and OrderDetails lines with snapshot Price.
 * - Decrements Products.Stock.
 *
 * Tables used:
 *   Orders(OrderID, CustomerID, EmployeeID, Subtotal, Tax, Total, Status, DatePlaced)
 *   OrderDetails(OrderID, ProductID, Quantity, Price)
 *   Products(ProductID, Price, Stock)
 */
exports.getOrderReceipt = (orderId, cb) => {
  const headSql = `
    SELECT o.OrderID, o.DatePlaced, o.Status, o.Subtotal, o.Tax, o.Total,
           o.CustomerID, o.EmployeeID, c.FirstName, c.LastName
    FROM Orders o
    LEFT JOIN Customers c ON c.CustomerID = o.CustomerID
    WHERE o.OrderID = ?
  `;
  const itemsSql = `
    SELECT d.ProductID, p.Name, d.Quantity AS Qty, d.Price, (d.Quantity * d.Price) AS LineTotal
    FROM OrderDetails d
    JOIN Products p ON p.ProductID = d.ProductID
    WHERE d.OrderID = ?
  `;

  db.query(headSql, [orderId], (e1, headRows) => {
    if (e1) return cb(e1);
    if (!headRows || headRows.length === 0) return cb(null, null);

    db.query(itemsSql, [orderId], (e2, items) => {
      if (e2) return cb(e2);
      const h = headRows[0];
      cb(null, {
        header: {
          OrderID: h.OrderID,
          DatePlaced: h.DatePlaced,
          Status: h.Status,
          CustomerID: h.CustomerID,
          EmployeeID: h.EmployeeID,
          CustomerName: [h.FirstName, h.LastName].filter(Boolean).join(' ').trim()
        },
        items: items.map(r => ({
          ProductID: r.ProductID,
          Name: r.Name,
          Qty: Number(r.Qty),
          Price: Number(r.Price),
          LineTotal: Number(r.LineTotal)
        })),
        subtotal: Number(h.Subtotal),
        tax: Number(h.Tax),
        total: Number(h.Total)
      });
    });
  });
};
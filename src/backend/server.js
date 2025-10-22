const express = require('express');
const db = require('./config/db.config');
const cors = require('cors');
const bodyParser = require('body-parser');
const adminInventoryRoutes = require('./routes/admin.inventory.routes');
const adminSalesRoutes = require('./routes/admin.sales.routes');
const adminSaleEventsRoutes = require('./routes/admin.sale-events.routes');
const adminDiscountsRoutes = require('./routes/admin.discounts.routes');


const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use('/admin/inventory', adminInventoryRoutes);
app.use('/admin/sales', adminSalesRoutes);
app.use('/admin/sale-events', adminSaleEventsRoutes);
app.use('/admin/discounts', adminDiscountsRoutes);


// GET /api/categories — existing route
app.get('/api/categories', (req, res) => {
    const query = 'SHOW COLUMNS FROM Categories';

    db.query(query, (err, results) => {
        const columnCount = results ? results.length : 0;

        if (err) {
            console.error('Error executing query: ', err);
            return res.status(500).send('Error retrieving categories from database');
        }

        res.json({
            columnCount: columnCount,
            rows: results
        });
    });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { employeeId, password } = req.body;

  if (!employeeId || !password) {
    return res.status(400).json({ success: false, message: 'Missing credentials' });
  }

  const sql = 'SELECT * FROM employees WHERE EmployeeID = ? LIMIT 1';
  db.query(sql, [employeeId], (err, results) => {
    if (err) {
      console.error('Error querying employees:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (!results.length) {
      return res.json({ success: false, message: 'InvalidUP' });
    }

    const u = results[0];

    if (u.UserPassword !== password) {
      return res.json({ success: false, message: 'InvalidUP' });
    }

    // IsAdmin flag if present; fallback to Role
    const isAdmin =
      u.IsAdmin !== undefined && u.IsAdmin !== null
        ? Boolean(u.IsAdmin)
        : String(u.Role || '').toLowerCase() === 'admin';

    const route = isAdmin ? '/admin' : '/cashier';

    return res.json({
      success: true,
      message: 'Login successful',
      employee: {
        id: u.EmployeeID,
        name: `${u.FirstName} ${u.LastName}`,
        role: u.Role,
        isAdmin
      },
      route
    });
  });
});
// Start the server
app.listen(port, () => {
    console.log('Backend listening on port: ' + port);
});

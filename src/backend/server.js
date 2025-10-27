require('dotenv').config();
const express = require('express');
const db = require('./config/db.config');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiAuthRoutes = require('./routes/api.auth.routes');
const adminInventoryRoutes = require('./routes/admin.inventory.routes');
const adminSalesRoutes = require('./routes/admin.sales.routes');
const adminSaleEventsRoutes = require('./routes/admin.sale-events.routes');
const adminDiscountsRoutes = require('./routes/admin.discounts.routes');
const adminEmployeesRoutes = require('./routes/admin.employee.routes');
const adminOrdersRoutes = require('./routes/admin.orders.routes');
const cashierRoutes = require('./routes/cashier.routes');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use('/api', apiAuthRoutes);
app.use('/admin/inventory', adminInventoryRoutes);
app.use('/admin/sales', adminSalesRoutes);
app.use('/admin/sale-events', adminSaleEventsRoutes);
app.use('/admin/discounts', adminDiscountsRoutes);
app.use('/admin/employees', adminEmployeesRoutes);
app.use('/admin/orders', adminOrdersRoutes);
app.use('/cashier', cashierRoutes);


// Ensure guest customer exists, create if not
async function ensureGuestCustomer() {
  const GUEST_ID = parseInt(process.env.GUEST_CUSTOMER_ID || '1000', 10);

  const selectSql = 'SELECT CustomerID FROM Customers WHERE CustomerID = ?';
  const insertSql = `
    INSERT INTO Customers (CustomerID, FirstName, LastName, Email, Phone)
    VALUES (?, 'Guest', '', NULL, NULL)
  `;

  await new Promise((resolve, reject) => {
    db.query(selectSql, [GUEST_ID], (e, rows) => {
      if (e) return reject(e);
      if (rows && rows.length > 0) return resolve();
      db.query(insertSql, [GUEST_ID], (e2) => (e2 ? reject(e2) : resolve()));
    });
  });

  console.log(`[init] Guest customer ensured with ID=${GUEST_ID}`);
}

ensureGuestCustomer()
  .catch(err => {
    console.error('Failed to ensure guest customer:', err);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log('Backend listening on port: ' + port);
    });
  });
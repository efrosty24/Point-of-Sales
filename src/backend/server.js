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
const adminCustomerRoutes = require('./routes/admin.customers.route');
const adminOrdersRoutes = require('./routes/admin.orders.routes');
const cashierRoutes = require('./routes/cashier.routes');
const adminSearchRoutes = require('./routes/admin.search.routes');

const app = express();
const port = process.env.PORT || process.env.APP_PORT || 8080;

const allowedOrigins = [
    // URLS for both CLOUD and Local Deployment
    'https://point-of-sales-476509.uc.r.appspot.com',
    'https://point-of-sales-476509.uc.r.appspot.com/',
    'http://localhost:3000',
    'http://localhost:5173'
];

const corsOptions =  {
    origin: function (origin, callback) {
        // allow requests with no origins
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = "NOT allowed origin from CORS Policy";
            return callback(new Error(msg), true);
        }
        return callback(null, true);
    },
    // Allowed Headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true // for sending cookies/auth headers
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use('/api', apiAuthRoutes);
app.use('/admin/inventory', adminInventoryRoutes);
app.use('/admin/sales', adminSalesRoutes);
app.use('/admin/sale-events', adminSaleEventsRoutes);
app.use('/admin/discounts', adminDiscountsRoutes);
app.use('/admin/employees', adminEmployeesRoutes);
app.use('/admin/customers', adminCustomerRoutes);
app.use('/admin/orders', adminOrdersRoutes);
app.use('/cashier', cashierRoutes);
app.use("/admin/search", adminSearchRoutes);


// Ensure guest customer exists, create if not
async function ensureGuestCustomer() {
    const GUEST_ID = parseInt(process.env.GUEST_CUSTOMER_ID || '1000', 10);

    const selectSql = 'SELECT CustomerID FROM Customers WHERE CustomerID = ?';
    const insertSql = `
        INSERT INTO Customers (CustomerID, FirstName, LastName, Email, Phone)
        VALUES (?, 'Guest', '', NULL, '1234567890')
    `;

    // This structure is now CORRECT for your callback-based 'db' export:
    await new Promise((resolve, reject) => {
        // 1. First db.query uses the callback function (e, rows) => { ... }
        db.query(selectSql, [GUEST_ID], (e, rows) => {
            if (e) return reject(e);
            if (rows && rows.length > 0) return resolve();

            // 2. Second db.query also uses the callback function
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

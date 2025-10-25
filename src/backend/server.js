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


// Start the server
app.listen(port, () => {
    console.log('Backend listening on port: ' + port);
});

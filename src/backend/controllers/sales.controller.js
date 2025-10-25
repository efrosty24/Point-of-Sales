const svc = require('../services/sales.service');
const ordersSvc = require('../services/orders.service');
// GET /admin/sales/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.salesSummary = (req, res) => {
  const { from, to } = req.query;
  svc.salesSummary({ from, to }, (err, data) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(data);
  });
};

// GET /admin/sales/top-products?from=&to=&limit=10
exports.topProducts = (req, res) => {
  const { from, to, limit } = req.query;
  svc.topProducts({ from, to, limit }, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
};

// GET /admin/sales/by-category?from=&to=
exports.byCategory = (req, res) => {
  const { from, to } = req.query;
  svc.byCategory({ from, to }, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });

};

// GET /admin/sales/recent?limit=5
exports.getRecentSales = (req, res) => {
  const limit = Number(req.query.limit) || 5;
  ordersSvc.listRecent(limit, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch recent sales' });
    res.json(rows.map(r => ({
      OrderID: r.OrderID,
      FirstName: r.FirstName,
      LastName: r.LastName,
      Total: Number(r.Total),   
      DatePlaced: r.DatePlaced,
      Status: r.Status ?? 'paid'
    })));
  });
};
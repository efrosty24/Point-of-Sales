const svc = require('../services/sales.service');
const ordersSvc = require('../services/orders.service');
const db = require("../config/db.config"); // Make sure db is imported

// --- Sales Summary ---
exports.salesSummary = (req, res) => {
  const { from, to } = req.query;
  svc.salesSummary({ from, to }, (err, data) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err });
    res.json(data);
  });
};

// --- Top Products ---
exports.topProducts = (req, res) => {
  const { from, to, limit } = req.query;
  svc.topProducts({ from, to, limit }, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err });
    res.json(rows);
  });
};

// --- Revenue by Category ---
exports.byCategory = (req, res) => {
  const { from, to } = req.query;
  svc.byCategory({ from, to }, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error', details: err });
    res.json(rows);
  });
};

// --- Recent Sales ---
exports.getRecentSales = (req, res) => {
  const limit = Number(req.query.limit) || 100;
  ordersSvc.listRecent(limit, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch recent sales', details: err });
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

// --- Today's Sales ---
exports.today = (req, res) => {
  const query = `
    SELECT * FROM Orders
    WHERE DATE(DatePlaced) = CURDATE()
    ORDER BY DatePlaced DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error", details: err });
    res.json(results);
  });
};

// --- Charts (Hourly, Daily, Monthly) ---
exports.charts = (req, res) => {
  const queries = {
    hourly: `
      SELECT HOUR(DatePlaced) AS hour, SUM(Total) AS total
      FROM Orders
      WHERE DATE(DatePlaced) = CURDATE()
      GROUP BY HOUR(DatePlaced)
      ORDER BY HOUR(DatePlaced);
    `,
    daily: `
      SELECT DATE(DatePlaced) AS date, SUM(Total) AS total
      FROM Orders
      WHERE DatePlaced >= CURDATE() - INTERVAL 6 DAY
      GROUP BY DATE(DatePlaced)
      ORDER BY DATE(DatePlaced);
    `,
    monthly: `
      SELECT MONTH(DatePlaced) AS month, SUM(Total) AS total
      FROM Orders
      WHERE YEAR(DatePlaced) = YEAR(CURDATE())
      GROUP BY MONTH(DatePlaced)
      ORDER BY MONTH(DatePlaced);
    `
  };

  const results = {};

  // Generate 24 hours template
  const hoursArray = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push({ hour: i + ":00", total: 0, hourNumber: i });
    }
    return hours;
  };

  // Generate last 7 days template
  const last7DaysArray = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      days.push({ date: `${yyyy}-${mm}-${dd}`, total: 0 });
    }
    return days;
  };

  // Generate 12 months template
  const monthsArray = () => {
    const months = [];
    const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    for (let i = 1; i <= 12; i++) {
      months.push({ month: names[i-1], total: 0, monthNumber: i });
    }
    return months;
  };

  db.query(queries.hourly, (err, hourly) => {
    if (err) return res.status(500).json({ error: "DB error (hourly)" });

    const hours = hoursArray();
    hourly.forEach(h => {
      const idx = hours.findIndex(x => x.hourNumber === h.hour);
      if (idx !== -1) hours[idx].total = Number(h.total || 0);
    });
    results.hourly = hours.map(h => ({ hour: h.hour, total: h.total }));

    db.query(queries.daily, (err, daily) => {
      if (err) return res.status(500).json({ error: "DB error (daily)" });

      const days = last7DaysArray();
      daily.forEach(d => {
        const idx = days.findIndex(x => x.date === d.date.toISOString().split('T')[0]);
        if (idx !== -1) days[idx].total = Number(d.total || 0);
      });
      results.daily = days;

      db.query(queries.monthly, (err, monthly) => {
        if (err) return res.status(500).json({ error: "DB error (monthly)" });

        const months = monthsArray();
        monthly.forEach(m => {
          const idx = months.findIndex(x => x.monthNumber === m.month);
          if (idx !== -1) months[idx].total = Number(m.total || 0);
        });
        results.monthly = months.map(m => ({ month: m.month, total: m.total }));

        res.json(results);
      });
    });
  });
};

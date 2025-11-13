const svc = require('../services/sales.service');
const ordersSvc = require('../services/orders.service');
const db = require("../config/db.config");


exports.salesSummary = (req, res) => {
    const from = req.query?.from;
    const to = req.query?.to;

    svc.salesSummary({ from, to }, (err, data) => {
        if (err) {
            console.error('Error fetching sales summary:', err);
            return res.status(500).json({ error: 'DB error', details: err });
        }
        res.json(data);
    });
};


exports.productPerformance = (req, res) => {
    const from = req.query?.from;
    const to = req.query?.to;
    const limit = req.query?.limit;

    svc.productPerformanceByCategorySupplier({ from, to, limit }, (err, rows) => {
        if (err) {
            console.error('Error fetching product performance:', err);
            return res.status(500).json({ error: 'DB error', details: err });
        }
        res.json(rows);
    });
};


exports.customerAnalytics = (req, res) => {
    const from = req.query?.from;
    const to = req.query?.to;
    const limit = req.query?.limit;

    svc.customerPurchaseAnalytics({ from, to, limit }, (err, rows) => {
        if (err) {
            console.error('Error fetching customer analytics:', err);
            return res.status(500).json({ error: 'DB error', details: err });
        }
        res.json(rows);
    });
};


exports.categoryPerformance = (req, res) => {
    const from = req.query?.from;
    const to = req.query?.to;
    const limit = req.query?.limit;

    svc.categoryPerformanceWithEmployees({ from, to, limit }, (err, rows) => {
        if (err) {
            console.error('Error fetching category performance:', err);
            return res.status(500).json({ error: 'DB error', details: err });
        }
        res.json(rows);
    });
};


exports.salesTrends = (req, res) => {
    const from = req.query?.from;
    const to = req.query?.to;
    const limit = req.query?.limit;

    svc.salesTrendsAndPatterns({ from, to, limit }, (err, rows) => {
        if (err) {
            console.error('Error fetching sales trends:', err);
            return res.status(500).json({ error: 'DB error', details: err });
        }
        res.json(rows);
    });
};


exports.getRecentSales = (req, res) => {
    const from = req.query?.from;
    const to = req.query?.to;
    const limit = req.query?.limit;

    const filters = {
        from: from || undefined,
        to: to || undefined,
        limit: limit ? parseInt(limit) : 10
    };

    svc.fetchRecentSales(filters, (err, rows) => {
        if (err) {
            console.error('Error fetching recent sales:', err);
            return res.status(500).json({ error: 'Failed to fetch recent sales', details: err });
        }

        const formatted = (rows || []).map(r => ({
            OrderID: r.OrderID,
            FirstName: r.FirstName,
            LastName: r.LastName,
            Total: Number(r.Total),
            DatePlaced: r.DatePlaced,
            Status: r.Status ?? 'paid'
        }));

        res.json(formatted);
    });
};


exports.today = (req, res) => {
    const query = `
        SELECT * FROM Orders
        WHERE DATE(DatePlaced) = CURDATE()
        ORDER BY DatePlaced DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching today sales:', err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(results);
    });
};


exports.charts = (req, res) => {
    const from = req.query?.from;
    const to = req.query?.to;

    let dateFilter = '';
    const params = [];

    if (from || to) {
        const conditions = [];
        if (from) {
            conditions.push('DATE(DatePlaced) >= ?');
            params.push(from);
        }
        if (to) {
            conditions.push('DATE(DatePlaced) <= ?');
            params.push(to);
        }
        dateFilter = 'WHERE ' + conditions.join(' AND ');
    }

    const queries = {
        hourly: `
            SELECT HOUR(DatePlaced) AS hour, SUM(Total) AS total
            FROM Orders
            ${dateFilter || 'WHERE DATE(DatePlaced) = CURDATE()'}
            GROUP BY HOUR(DatePlaced)
            ORDER BY HOUR(DatePlaced)
        `,
        daily: `
            SELECT DATE(DatePlaced) AS date, SUM(Total) AS total
            FROM Orders
            ${dateFilter || 'WHERE DatePlaced >= CURDATE() - INTERVAL 6 DAY'}
            GROUP BY DATE(DatePlaced)
            ORDER BY DATE(DatePlaced)
        `,
        monthly: `
            SELECT MONTH(DatePlaced) AS month, SUM(Total) AS total
            FROM Orders
            ${dateFilter || 'WHERE YEAR(DatePlaced) = YEAR(CURDATE())'}
            GROUP BY MONTH(DatePlaced)
            ORDER BY MONTH(DatePlaced)
        `
    };

    const results = {};

    const hoursArray = () => {
        const hours = [];
        for (let i = 0; i < 24; i++) {
            hours.push({ hour: `${i}:00`, total: 0, hourNumber: i });
        }
        return hours;
    };

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

    const monthsArray = () => {
        const months = [];
        const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        for (let i = 1; i <= 12; i++) {
            months.push({ month: names[i-1], total: 0, monthNumber: i });
        }
        return months;
    };

    db.query(queries.hourly, params, (err, hourly) => {
        if (err) {
            console.error('Error fetching hourly data:', err);
            return res.status(500).json({ error: "DB error (hourly)", details: err });
        }

        const hours = hoursArray();
        (hourly || []).forEach(h => {
            const idx = hours.findIndex(x => x.hourNumber === h.hour);
            if (idx !== -1) hours[idx].total = Number(h.total || 0);
        });
        results.hourly = hours.map(h => ({ hour: h.hour, total: h.total }));

        db.query(queries.daily, params, (err, daily) => {
            if (err) {
                console.error('Error fetching daily data:', err);
                return res.status(500).json({ error: "DB error (daily)", details: err });
            }

            const days = last7DaysArray();
            (daily || []).forEach(d => {
                const dateStr = d.date instanceof Date
                    ? d.date.toISOString().split('T')[0]
                    : d.date;
                const idx = days.findIndex(x => x.date === dateStr);
                if (idx !== -1) days[idx].total = Number(d.total || 0);
            });
            results.daily = days;

            db.query(queries.monthly, params, (err, monthly) => {
                if (err) {
                    console.error('Error fetching monthly data:', err);
                    return res.status(500).json({ error: "DB error (monthly)", details: err });
                }

                const months = monthsArray();
                (monthly || []).forEach(m => {
                    const idx = months.findIndex(x => x.monthNumber === m.month);
                    if (idx !== -1) months[idx].total = Number(m.total || 0);
                });
                results.monthly = months.map(m => ({ month: m.month, total: m.total }));

                res.json(results);
            });
        });
    });
};

module.exports = exports;

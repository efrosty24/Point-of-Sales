const svc = require('../services/orders.service');

exports.recent = (req, res) => {
  const limit = Number(req.query.limit) || 5;
  svc.listRecent(limit, (err, rows) =>
    err ? res.status(500).json({ error: 'DB_ERROR' }) : res.json(rows)
  );
};

exports.list = (req, res) => {
  const { from, to, customerId, employeeId } = req.query || {};
  svc.list({ from, to, customerId, employeeId }, (err, rows) =>
    err ? res.status(500).json({ error: 'DB_ERROR' }) : res.json(rows)
  );
};

exports.getOne = (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'INVALID_ID' });
  svc.getById(id, (err, data) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR' });
    if (!data) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(data);
  });
};
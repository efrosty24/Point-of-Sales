const svc = require('../services/search.service');

exports.search = (req, res) => {
  const { type, q } = req.query;

  if (!type || !q) {
    return res.status(400).json({ error: 'Missing type or query' });
  }

  const t = String(type).toLowerCase().trim();
  const id = Number(q); 

  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: 'Query must be a numeric ID' });
  }

  switch (t) {
    case 'customers':
      return svc.findCustomerById(id, (err, rows) =>
        err ? res.status(500).json({ error: err.message }) : res.json(rows)
      );

    case 'orders':
      return svc.findOrderById(id, (err, rows) =>
        err ? res.status(500).json({ error: err.message }) : res.json(rows)
      );

    case 'products':
      return svc.findProductById(id, (err, rows) =>
        err ? res.status(500).json({ error: err.message }) : res.json(rows)
      );

    default:
      return res.status(400).json({ error: 'Invalid search type' });
  }
};
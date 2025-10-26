const svc = require('../services/orders.service');
const cashierSvc = require('../services/cashier.service');

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
/**
 * PATCH /admin/orders/:id/reassign-customer
 * Body: { CustomerID }
 * Sets Orders.CustomerID = CustomerID (guest -> real customer).
 */
exports.reassignCustomer = (req, res) => {
  const { CustomerID } = req.body || {};
  if (!CustomerID) return res.status(400).json({ error: 'MISSING_CUSTOMER_ID' });

  const orderId = req.params.id;
  cashierSvc.reassignOrderCustomer({ orderId, customerId: CustomerID }, (err, r) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR' });
    res.json({ ok: true, updated: r.updated });
  });
};
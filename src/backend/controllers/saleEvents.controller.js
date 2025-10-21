const svc = require('../services/saleEvents.service');
const discountsSvc = require('../services/discounts.service');



exports.create = (req, res) => {
  const { Name, Description, StartDate, EndDate } = req.body || {};
  if (!Name || !StartDate || !EndDate) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Name, StartDate, EndDate are required.' });
  }
  if (StartDate > EndDate) {
    return res.status(400).json({ error: 'INVALID_DATES', message: 'StartDate must be <= EndDate.' });
  }
  svc.create({ Name, Description, StartDate, EndDate }, (err, out) =>
    err ? res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message }) : res.status(201).json(out)
  );
};

exports.list = (_req, res) => {
  svc.list((err, rows) =>
    err ? res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message }) : res.json(rows)
  );
};
exports.listDiscountsForEvent = (req, res) => {
  const SaleEventID = Number(req.params.saleEventId);
  if (!SaleEventID) return res.status(400).json({ error: 'SALE_EVENT_REQUIRED' });

  svc.exists(SaleEventID, (e1, ok) => {
    if (e1) return res.status(500).json({ error: 'DB_ERROR', message: e1.sqlMessage || e1.message });
    if (!ok) return res.status(404).json({ error: 'SALE_EVENT_NOT_FOUND' });

    discountsSvc.listByEvent(SaleEventID, (err, rows) =>
      err ? res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message }) : res.json(rows)
    );
  });
};
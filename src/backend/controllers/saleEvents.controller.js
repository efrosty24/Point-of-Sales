const svc = require('../services/saleEvents.service');
const discountsSvc = require('../services/discounts.service');

// POST /admin/sale-events
exports.create = (req, res) => {
  const { Name, Description, StartDate, EndDate } = req.body || {};
  if (!Name || !StartDate || !EndDate) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Name, StartDate, EndDate are required.' });
  }
  if (String(StartDate) > String(EndDate)) {
    return res.status(400).json({ error: 'INVALID_DATES', message: 'StartDate must be <= EndDate.' });
  }

  svc.create({ Name, Description, StartDate, EndDate }, (err, out) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message });
    return res.status(201).json(out);
  });
};

// GET /admin/sale-events
exports.list = (_req, res) => {
  svc.list((err, rows) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message });
    return res.json(rows);
  });
};

// PATCH /admin/sale-events/:saleEventId
exports.update = (req, res) => {
  const id = Number(req.params.saleEventId);
  if (!id) return res.status(400).json({ error: 'INVALID_ID' });

  const patch = {};
  const { Name, Description, StartDate, EndDate } = req.body || {};
  if (Name !== undefined)        patch.Name = Name;
  if (Description !== undefined) patch.Description = Description;
  if (StartDate !== undefined)   patch.StartDate = StartDate;
  if (EndDate !== undefined)     patch.EndDate = EndDate;

  if (patch.StartDate && patch.EndDate && String(patch.StartDate) > String(patch.EndDate)) {
    return res.status(400).json({ error: 'INVALID_DATES', message: 'StartDate must be <= EndDate.' });
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'EMPTY_PATCH' });
  }

  svc.update(id, patch, (err, out) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message });
    if (!out.found) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ ok: true, updated: out.updated, event: out.event });
  });
};

// DELETE /admin/sale-events/:saleEventId
exports.remove = (req, res) => {
  const id = Number(req.params.saleEventId);
  if (!id) return res.status(400).json({ error: 'INVALID_ID' });

  svc.remove(id, (err, out) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message });
    if (!out.found) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ ok: true, deleted: out.deleted });
  });
};

// POST /admin/sale-events/prune
exports.pruneNonActiveDiscounts = (_req, res) => {
  svc.pruneNonActiveDiscounts((err, out) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message });
    return res.json(out);
  });
};

// GET /admin/sale-events/:saleEventId/discounts
exports.listDiscountsForEvent = (req, res) => {
  const SaleEventID = Number(req.params.saleEventId);
  if (!SaleEventID) return res.status(400).json({ error: 'SALE_EVENT_REQUIRED' });

  svc.exists(SaleEventID, (e1, ok) => {
    if (e1) return res.status(500).json({ error: 'DB_ERROR', message: e1.sqlMessage || e1.message });
    if (!ok) return res.status(404).json({ error: 'SALE_EVENT_NOT_FOUND' });

    discountsSvc.listByEvent(SaleEventID, (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message });
      return res.json(rows);
    });
  });
};
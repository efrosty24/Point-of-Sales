const svc = require('../services/discounts.service');

// POST /admin/sale-events/:saleEventId/discounts
exports.createForEvent = (req, res) => {
  const SaleEventID = Number(req.params.saleEventId);
  const { ProductID, DiscountType, DiscountValue, Conditions } = req.body || {};

  if (!SaleEventID) {
    return res.status(400).json({ error: 'SALE_EVENT_REQUIRED', message: 'Provide :saleEventId in the URL.' });
  }
  if (!ProductID || !DiscountType || DiscountValue == null) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'ProductID, DiscountType, DiscountValue are required.' });
  }
  const t = String(DiscountType).toLowerCase();
  if (!['percentage','fixed','bogo'].includes(t)) {
    return res.status(400).json({ error: 'INVALID_TYPE', message: 'DiscountType must be percentage|fixed|bogo.' });
  }

  svc.ensureProductExists(ProductID, (eP) => {
    if (eP) return res.status(400).json({ error: 'PRODUCT_NOT_FOUND', message: 'ProductID does not exist.' });

    svc.createDiscount({ SaleEventID, ProductID, DiscountType: t, DiscountValue, Conditions }, (err, out) => {
      if (err) {
        if (err.code === 'EVENT_NOT_ACTIVE') {
          return res.status(409).json({ error: 'EVENT_NOT_ACTIVE', message: 'SaleEvent must be active today.' });
        }
        if (err.code === 'DUPLICATE_DISCOUNT') {
          return res.status(409).json({ error: 'DUPLICATE_DISCOUNT', message: 'This product already has an active discount.' });
        }
        return res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message });
      }
      return res.status(201).json(out);
    });
  });
};

// PATCH /admin/discounts/:discountId
exports.updateOne = (req, res) => {
  const DiscountID = Number(req.params.discountId);
  const { DiscountType, DiscountValue, Conditions } = req.body || {};
  if (!DiscountID) return res.status(400).json({ error: 'INVALID_ID' });

  if (DiscountType !== undefined) {
    const t = String(DiscountType).toLowerCase();
    if (!['percentage','fixed','bogo'].includes(t)) {
      return res.status(400).json({ error: 'INVALID_TYPE' });
    }
  }

  const patch = {};
  if (DiscountType !== undefined)  patch.DiscountType  = String(DiscountType).toLowerCase();
  if (DiscountValue !== undefined) patch.DiscountValue = DiscountValue;
  if (Conditions !== undefined)    patch.Conditions    = Conditions;

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'EMPTY_PATCH' });
  }

  svc.updateDiscountPartial(DiscountID, patch, (err, out) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message });
    if (!out.found) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ ok: true, updated: out.updated, discount: out.discount });
  });
};

// DELETE /admin/discounts/:discountId
exports.deleteOne = (req, res) => {
  const DiscountID = Number(req.params.discountId);
  if (!DiscountID) return res.status(400).json({ error: 'INVALID_ID' });

  svc.deleteById(DiscountID, (err, out) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message });
    if (!out.found) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.status(200).json({ ok: true, deleted: out.deleted });
  });
};
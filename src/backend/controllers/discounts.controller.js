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
  if (!['percentage','fixed','bogo'].includes(String(DiscountType))) {
    return res.status(400).json({ error: 'INVALID_TYPE', message: 'DiscountType must be percentage|fixed|bogo.' });
  }

  svc.ensureSaleEventExists(SaleEventID, (e1) => {
    if (e1) return res.status(400).json({ error: 'SALE_EVENT_NOT_FOUND', message: 'Create the SaleEvent first.' });

    svc.ensureProductExists(ProductID, (e2) => {
      if (e2) return res.status(400).json({ error: 'PRODUCT_NOT_FOUND', message: 'ProductID does not exist.' });

      svc.createDiscount({ SaleEventID, ProductID, DiscountType, DiscountValue, Conditions }, (err, out) => {
        if (err) return res.status(500).json({ error: 'DB_ERROR', message: err.sqlMessage || err.message });
        return res.status(201).json(out);
      });
    });
  });
};
exports.updateOne = (req, res) => {
  const DiscountID = Number(req.params.discountId);
  const { DiscountType, DiscountValue, Conditions } = req.body || {};

  if (!DiscountID) return res.status(400).json({ error: 'INVALID_ID' });
  if (
    DiscountType !== undefined &&
    !['percentage','fixed','bogo'].includes(String(DiscountType))
  ) return res.status(400).json({ error: 'INVALID_TYPE' });

  const patch = {};
  if (DiscountType !== undefined)  patch.DiscountType  = DiscountType;
  if (DiscountValue !== undefined) patch.DiscountValue = DiscountValue;
  if (Conditions !== undefined)    patch.Conditions    = Conditions;

  if (Object.keys(patch).length === 0)
    return res.status(400).json({ error: 'EMPTY_PATCH' });

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
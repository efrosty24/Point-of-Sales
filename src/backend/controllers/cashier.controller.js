const svc = require('../services/cashier.service');

/**
 * GET /cashier/customers/lookup?phone=<number>
 * Find existing customers by phone (digit-normalized).
 */
exports.lookupCustomers = (req, res) => {
  const phone = (req.query.phone || '').trim();
  svc.lookupCustomersByPhone(phone, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR' });
    return res.json(rows);
  });
};

/**
 * POST /cashier/orders/quote
 * Body: { items: [{ ProductID, Qty }], taxRate? }
 * Returns computed totals without mutating DB.
 */
exports.quote = (req, res) => {
  const { items, taxRate } = req.body || {};
  svc.quoteOrder({ items, taxRate }, (err, quote) => {
    if (err) {
      const msg = String(err.message || '');
      if (msg.startsWith('PRODUCT_NOT_FOUND')) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
      if (msg.startsWith('BAD_QTY')) return res.status(400).json({ error: 'BAD_QTY' });
      if (msg === 'EMPTY_CART') return res.status(400).json({ error: 'EMPTY_CART' });
      return res.status(500).json({ error: 'DB_ERROR' });
    }
    res.json(quote);
  });
};

/**
 * POST /cashier/orders
 * Body: { customerId?, phone?, employeeId?, items: [{ ProductID, Qty }], payment: { method, amount }, taxRate? }
 * Behavior:
 *   - If no customerId and phone is empty => use GUEST_CUSTOMER_ID
 *   - Creates order + lines transactionally; decrements stock.
 */
exports.checkout = (req, res) => {
  const GUEST_ID = parseInt(process.env.GUEST_CUSTOMER_ID || '1', 10);
  const body = req.body || {};

  let { customerId } = body;
  const phone = (req.query?.phone || body.phone || '').trim();
  if (!customerId && phone === '') {
    customerId = GUEST_ID;
  }

  svc.createOrderTransactional({
    customerId,
    employeeId: body.employeeId || null,
    items: body.items || [],
    payment: body.payment || {},
    taxRate: body.taxRate || 0
  }, (err, result) => {
    if (err) {
      const msg = String(err.message || '');
      if (msg === 'EMPTY_CART') return res.status(400).json({ error: 'EMPTY_CART' });
      if (msg === 'BAD_QTY') return res.status(400).json({ error: 'BAD_QTY' });
      if (msg === 'PRODUCT_NOT_FOUND') return res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
      return res.status(500).json({ error: 'DB_ERROR' });
    }
    res.status(201).json(result);
  });
};

/**
 * GET /cashier/orders/:id
 * Returns the receipt payload for display/print.
 */
exports.getReceipt = (req, res) => {
  const id = req.params.id;
  svc.getOrderReceipt(id, (err, payload) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR' });
    if (!payload) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(payload);
  });
};
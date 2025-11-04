const svc = require('../services/cashier.service');


exports.lookupCustomers = (req, res) => {
  const phone = (req.query.phone || '').trim();
  svc.lookupCustomersByPhone(phone, (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR' });
    return res.json(rows);
  });
};

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

exports.addToRegister = (req, res) => {
    const { customerId, guestId, employeeId, items, taxRate } = req.body || {};
    console.log('addToRegister body:', { customerId, guestId, itemsLen: items?.length });

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'EMPTY_CART' });
    }
    const hasCustomer = customerId != null && Number.isFinite(Number(customerId));
    const hasGuest = guestId != null && Number.isFinite(Number(guestId));
    if (!hasCustomer && !hasGuest) {
        return res.status(400).json({ error: 'BAD_CUSTOMER_OR_GUEST' });
    }

    svc.addToRegister(
        {
            customerId: hasCustomer ? Number(customerId) : null,
            guestId: hasGuest ? Number(guestId) : null,
            employeeId,
            items,
            taxRate,
        },
        (err, result) => {
            if (err) {
                const msg = String(err.message || '');
                if (msg === 'EMPTY_CART') return res.status(400).json({ error: 'EMPTY_CART' });
                if (msg.startsWith('BAD_QTY')) return res.status(400).json({ error: 'BAD_QTY', ProductID: msg.split(':')[1] || null });
                if (msg.startsWith('PRODUCT_NOT_FOUND')) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND', ProductID: msg.split(':')[1] || null });
                if (msg.startsWith('INSUFFICIENT_STOCK')) return res.status(400).json({ error: 'INSUFFICIENT_STOCK', ProductID: msg.split(':')[1] || null });
                return res.status(500).json({ error: 'DB_ERROR', message: msg });
            }
            res.status(201).json(result);
        }
    );
};

exports.getRegister = (req, res) => {
    const id = req.params.id;
    svc.getRegister(id, (err, register) => {
        if (err) return res.status(500).json({ error: 'DB_ERROR' });
        if (!register) return res.status(404).json({ error: 'NOT_FOUND' });
        res.json(register);
    });
};

exports.removeRegisterItem = (req, res) => {
    const registerListId = Number(req.params.id);
    const productId = Number(req.params.productId);
    if (!Number.isFinite(registerListId) || !Number.isFinite(productId)) {
        return res.status(400).json({ error: 'BAD_PARAMS' });
    }
    svc.removeRegisterItem({ registerListId, productId }, (err, data) => {
        if (err) return res.status(500).json({ error: 'DB_ERROR', message: String(err.message || '') });
        if (!data) return res.status(404).json({ error: 'NOT_FOUND' });
        res.json(data);
    });
};


exports.postCheckout = (req, res) => {
    const { registerListId, employeeId } = req.body || {};
    svc.checkoutRegister({ registerListId, employeeId }, (err, result) => {
        if (err) return res.status(500).json({ error: String(err.message || err) });
        if (!result || !result.OrderID) return res.status(500).json({ error: "ORDER_CREATE_FAILED" });

        return res.status(201).json({
            orderId: Number(result.OrderID),
            total: Number(result.total),
            status: result.Status || "Placed",
        });
    });
};

exports.updateRegisterIdentity = (req, res) => {
    const registerListId = Number(req.params.id);
    const { customerId, guestId } = req.body || {};
    const hasCust = customerId != null && Number.isFinite(Number(customerId));
    const hasGuest = guestId != null && Number.isFinite(Number(guestId));
    if (!Number.isFinite(registerListId) || (hasCust === hasGuest)) {
        return res.status(400).json({ error: 'BAD_PARAMS' });
    }

    svc.updateRegisterIdentity(
        { registerListId, customerId: hasCust ? Number(customerId) : null, guestId: hasGuest ? Number(guestId) : null },
        (err, data) => {
            if (err) return res.status(500).json({ error: 'DB_ERROR', message: String(err.message || '') });
            if (!data) return res.status(404).json({ error: 'NOT_FOUND' });
            res.json(data);
        }
    );
};

exports.getReceipt = (req, res) => {
  const id = req.params.id;
  svc.getOrderReceipt(id, (err, payload) => {
    if (err) return res.status(500).json({ error: 'DB_ERROR' });
    if (!payload) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(payload);
  });
};

exports.getProductsForCashier = (req, res) => {
    const { search = '', category = null } = req.query || {};
    svc.listProductsForCashier({ search, category }, (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB_ERROR', message: String(err.message || '') });
        res.json(Array.isArray(rows) ? rows : []);
    });
};

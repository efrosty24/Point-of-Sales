const svc = require('../services/start.service');


exports.getActiveSales = (req, res) => {
    
    svc.getActiveSaleEvents((err, saleEvents) => {
        if (err) {
            console.error('Error fetching sale events:', err);
            return res.status(500).json({
                success: false,
                message: 'Error fetching sale events',
                error: err.message
            });
        }

        
        svc.getActiveDiscountedProducts((err, products) => {
            if (err) {
                console.error('Error fetching discounted products:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching products',
                    error: err.message
                });
            }

            res.json({
                success: true,
                saleEvents: saleEvents,
                discountedProducts: products
            });
        });
    });
};


exports.getSaleEvents = (req, res) => {
    const { active } = req.query;

    if (active === 'true') {
        svc.getActiveSaleEvents((err, events) => {
            if (err) {
                console.error('Error fetching sale events:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching sale events',
                    error: err.message
                });
            }
            res.json({ success: true, saleEvents: events });
        });
    } else {
        svc.getAllSaleEvents((err, events) => {
            if (err) {
                console.error('Error fetching sale events:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching sale events',
                    error: err.message
                });
            }
            res.json({ success: true, saleEvents: events });
        });
    }
};


exports.getProductsBySaleEvent = (req, res) => {
    const { eventId } = req.params;

    if (!eventId) {
        return res.status(400).json({
            success: false,
            message: 'Sale event ID is required'
        });
    }

    svc.getProductsBySaleEventId(eventId, (err, products) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({
                success: false,
                message: 'Error fetching products',
                error: err.message
            });
        }

        res.json({
            success: true,
            products: products
        });
    });
};


exports.getDiscountedProducts = (req, res) => {
    svc.getActiveDiscountedProducts((err, products) => {
        if (err) {
            console.error('Error fetching discounted products:', err);
            return res.status(500).json({
                success: false,
                message: 'Error fetching products',
                error: err.message
            });
        }

        res.json({
            success: true,
            products: products
        });
    });
};


exports.getSaleEventsWithCounts = (req, res) => {
    svc.getSaleEventProductCounts((err, events) => {
        if (err) {
            console.error('Error fetching sale events:', err);
            return res.status(500).json({
                success: false,
                message: 'Error fetching sale events',
                error: err.message
            });
        }

        res.json({
            success: true,
            saleEvents: events
        });
    });
};

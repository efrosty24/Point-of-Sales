const svc = require('../services/customers.service');

exports.addCustomer = (req, res) => {
    const data = req.body;

    if (!data || !data.Email || !data.FirstName || !data.LastName) {
        return res.status(400).json({ error: 'Missing required fields: FirstName, LastName, Email.' });
    }

    svc.addCustomer(data, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Email already exists.' });
            }
            console.error('DB error addCustomer:', err);
            return res.status(500).json({ error: 'DB error' });
        }

        return res.status(201).json({
            message: 'Customer Added',
            customer: {
                CustomerID: result.insertId,
                ...data
            }
        });
    });
};

exports.getCustomers = (req, res) => {
    const options = {
        customerId: req.query.id,
        name: req.query.name,
        email: req.query.email,
        city: req.query.city,
        state: req.query.state,
        country: req.query.country,
        orderBy: req.query.sort,
        orderDirection: req.query.dir
    };

    svc.getFilteredCustomers(options, (err, rows) => {
        if (err) {
            console.error('DB error getCustomers:', err);
            return res.status(500).json({ error: 'Failed to retrieve customers.' });
        }
        return res.status(200).json({
            message: `${rows.length} customers found.`,
            customers: rows
        });
    });
};

exports.updateCustomer = (req, res) => {
    const id = req.params.id;
    const updateData = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Customer ID is required' });
    }
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No update data is provided' });
    }

    svc.updateCustomer(id, updateData, (err, result) => {
        if (err && err.message && err.message.includes('No valid fields')) {
            return res.status(400).json({ error: err.message });
        }
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Email already exists.' });
            }
            console.error('Error updating customer:', err);
            return res.status(500).json({ error: 'Failed to update customer.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Customer with ID ${id} not found` });
        }

        return res.status(200).json({
            message: `${id} updated successfully`,
            updatedFields: updateData
        });
    });
};

exports.deleteCustomer = (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ error: 'Customer ID is required' });
    }

    svc.deleteCustomer(id, (err, result) => {
        console.log(err,result);
        if (err) {
            console.error('DB error deleting customer:', err);
            return res.status(500).json({ error: 'Failed to delete customer.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Customer with ID ${id} not found` });
        }
        return res.status(204).send();
    });
};

exports.reactivateCustomer = (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Customer ID is required' });

    svc.reactivateCustomer(id, (err, result) => {
        if (err) {
            console.error('Error reactivating customer:', err);
            return res.status(500).json({ error: 'Failed to reactivate customer.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Customer with ID ${id} not found` });
        }
        return res.status(200).json({ message: `${id} reactivated` });
    });
};
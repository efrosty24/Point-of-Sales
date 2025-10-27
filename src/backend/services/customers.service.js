const db = require('../config/db.config');

exports.addCustomer = (customerData, callback) => {
    const sql = `
    INSERT INTO Customers (
      FirstName, LastName, Phone, Address, City, State, Zip, Country, Email
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
    const values = [
        customerData.FirstName,
        customerData.LastName,
        customerData.Phone || null,
        customerData.Address || null,
        customerData.City || null,
        customerData.State || null,
        customerData.Zip || null,
        customerData.Country || null,
        customerData.Email
    ];
    db.query(sql, values, callback);
};

exports.getFilteredCustomers = (options, callback) => {
    let sql = `
    SELECT
      *
    FROM Customers
  `;

    const filters = [];
    const values = [];

    if (options.customerId) {
        filters.push('CustomerID = ?');
        values.push(options.customerId);
    }
    if (options.name) {
        const like = `%${options.name}%`;
        filters.push('(FirstName LIKE ? OR LastName LIKE ?)');
        values.push(like, like);
    }
    if (options.email) {
        filters.push('Email LIKE ?');
        values.push(`%${options.email}%`);
    }
    if (options.city) {
        filters.push('City = ?');
        values.push(options.city);
    }
    if (options.state) {
        filters.push('State = ?');
        values.push(options.state);
    }
    if (options.country) {
        filters.push('Country = ?');
        values.push(options.country);
    }

    if (filters.length > 0) {
        sql += ' WHERE ' + filters.join(' AND ');
    }

    let orderBy = 'IsActive';
    let orderDirection = 'DESC';

    if (options.orderBy) {
        switch ((options.orderBy || '').toLowerCase()) {
            case 'name':
                orderBy = 'LastName';
                break;
            case 'id':
                orderBy = 'CustomerID';
                break;
            case 'email':
                orderBy = 'Email';
                break;
            case 'city':
                orderBy = 'City';
                break;
            case 'state':
                orderBy = 'State';
                break;
            case 'country':
                orderBy = 'Country';
                break;
        }
    }

    if (options.orderDirection && options.orderDirection.toUpperCase() === 'DESC') {
        orderDirection = 'DESC';
    }

    sql += ` ORDER BY ${orderBy} ${orderDirection};`;

    db.query(sql, values, callback);
};

exports.updateCustomer = (customerId, customerData, callback) => {
    const setClauses = [];
    const values = [];

    const allowed = [
        'FirstName', 'LastName', 'Phone', 'Address', 'City', 'State', 'Zip', 'Country', 'Email'
    ];

    for (const key of allowed) {
        if (customerData[key] !== undefined) {
            setClauses.push(`${key} = ?`);
            values.push(customerData[key]);
        }
    }

    if (setClauses.length === 0) {
        return callback(new Error('No valid fields provided for update.'), null);
    }

    const sql = `
    UPDATE Customers
    SET ${setClauses.join(', ')}
    WHERE CustomerID = ?;
  `;
    values.push(customerId);

    db.query(sql, values, callback);
};

exports.deleteCustomer = (customerId, callback) => {
    const sql = `UPDATE Customers SET IsActive = 0 WHERE CustomerID = ?`;
    db.query(sql, [customerId], callback);
};

exports.reactivateCustomer = (customerId, callback) => {
    const sql = `
    UPDATE Customers
    SET isActive = 1
    WHERE CustomerID = ?;
  `;
    db.query(sql, [customerId], callback);
};
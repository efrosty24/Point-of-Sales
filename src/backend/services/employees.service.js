const db = require('../config/db.config');

// Simple add employee servive to the database
exports.addEmployee = (employeeData, callback) => {
    const sql = `
        INSERT INTO Employees (
            Email, 
            FirstName, 
            LastName, 
            Phone, 
            Role, 
            UserPassword,
            Address, 
            City, 
            Country, 
            State, 
            Zip
        ) VALUES (
            ?, ?, ?, ?, ?, ?, 
            ?, ?, ?, ?, ?
        );
    `;
    const values = [
        // NOT NULLABLE
        employeeData.Email,
        employeeData.FirstName,
        employeeData.LastName,
        employeeData.Phone,
        employeeData.Role,
        employeeData.UserPassword,
        // NULLABLE (will be NULL if not provided in employeeData)
        employeeData.Address || null,
        employeeData.City || null,
        employeeData.Country || null,
        employeeData.State || null,
        employeeData.Zip || null
    ];

    db.query(sql, values, callback);
};

// Gets employees based on filtering passed on to the controller

exports.getFilteredEmployees = (options, callback) => {
    let sql = `
        SELECT
        EmployeeID,
            FirstName,
            LastName,
            Email,
            Phone,
            Role,
            Address,
            City,
            State,
            Zip,
            Country
        FROM Employees
    `;
    const filters = []
    const values = []

    // Filtering by various means
    if (options.employeeId) {
        filters.push("EmployeeID = ?");
        values.push(options.employeeId);
    }

    if (options.name) {
        const nameSearch = `%${options.name}%`;
        filters.push("(FirstName LIKE ? OR LastName LIKE ?)");
        values.push(nameSearch, nameSearch);
    }

    if (options.role) {
        filters.push("Role = ?");
        values.push(options.role);
    }

    if (filters.length > 0) {
        sql += " WHERE " + filters.join(" AND ");
    }

    let orderBy = "EmployeeID"; // Default sort
    let orderDirection = "ASC"; // Default direction

    if (options.orderBy) {
        // Set column to sort by (e.g., 'name', 'id', 'role')
        switch (options.orderBy.toLowerCase()) {
            case 'name':
                orderBy = "LastName"; // Sorting by last name is usually better for lists
                break;
            case 'id':
                orderBy = "EmployeeID";
                break;
            case 'role':
                orderBy = "Role";
                break;
        }
    }

    if (options.orderDirection && (options.orderDirection.toUpperCase() === 'DESC')) {
        orderDirection = "DESC";
    }

    sql += ` ORDER BY ${orderBy} ${orderDirection};`;
    db.query(sql, values, callback);
}

// Update Employee Data
exports.updateEmployee = (employeeId, employeeData, callback) => {
    const setClauses = [];
    const values = [];

    const allowedUpdates = [
        'FirstName', 'LastName', 'Email', 'Phone', 'Role', 'UserPassword',
        'Address', 'City', 'State', 'Zip', 'Country'
    ];

    for (const key of allowedUpdates) {
        // ensure the value is not undefined.
        if (employeeData[key] !== undefined) {
            setClauses.push(`${key} = ?`);
            values.push(employeeData[key]);
        }
    }

    // Safety check: Don't execute if no fields are being updated
    if (setClauses.length === 0) {
        // Return a specific error indicating no data was provided for update
        return callback(new Error("No valid fields provided for update."), null);
    }

    const sql = `
        UPDATE Employees 
        SET ${setClauses.join(', ')} 
        WHERE EmployeeID = ?;
    `;

    // Add the EmployeeID to the end of the values array for the WHERE clause
    values.push(employeeId);

    db.query(sql, values, callback);
};


exports.deleteEmployee = (employeeId, callback) => {
    const sql = `
        DELETE FROM Employees
        WHERE EmployeeID = ?;
    `
    db.query(sql, [employeeId], callback);
}
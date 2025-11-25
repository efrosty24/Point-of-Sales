const db = require('../config/db.config');

exports.addEmployee = (employeeData, callback) => {
    const sql = `
    INSERT INTO Employees (
      Email,
      FirstName,
      LastName,
      Phone,
      Role,
      UserPassword,
      isActive
    ) VALUES (?, ?, ?, ?, ?, ?, 1);
  `;
    const values = [
        employeeData.Email,
        employeeData.FirstName,
        employeeData.LastName,
        employeeData.Phone,
        employeeData.Role,
        employeeData.UserPassword
    ];
    db.query(sql, values, callback);
};

exports.getFilteredEmployees = (options, callback) => {
    let sql = `
    SELECT
      EmployeeID,
      FirstName,
      LastName,
      Email,
      Phone,
      Role,
      isActive
    FROM Employees
  `;
    const filters = [];
    const values = [];

    if (options.employeeId) {
        filters.push('EmployeeID = ?');
        values.push(options.employeeId);
    }
    if (options.name) {
        const term = `%${options.name}%`;
        filters.push('(FirstName LIKE ? OR LastName LIKE ?)');
        values.push(term, term);
    }
    if (options.role) {
        filters.push('Role = ?');
        values.push(options.role);
    }

    if (filters.length) sql += ' WHERE ' + filters.join(' AND ');

    let orderBy = 'EmployeeID';
    let orderDirection = 'ASC';
    if (options.orderBy) {
        switch (options.orderBy.toLowerCase()) {
            case 'name': orderBy = 'LastName'; break;
            case 'id':   orderBy = 'EmployeeID'; break;
            case 'role': orderBy = 'Role'; break;
        }
    }
    if (options.orderDirection && options.orderDirection.toUpperCase() === 'DESC') {
        orderDirection = 'DESC';
    }

    sql += ` ORDER BY ${orderBy} ${orderDirection};`;
    db.query(sql, values, callback);
};

exports.updateEmployee = (employeeId, employeeData, callback) => {
    const setClauses = [];
    const values = [];
    const allowed = ['FirstName', 'LastName', 'Email', 'Phone', 'Role', 'UserPassword'];

    for (const key of allowed) {
        if (employeeData[key] !== undefined) {
            setClauses.push(`${key} = ?`);
            values.push(employeeData[key]);
        }
    }
    if (!setClauses.length) return callback(new Error('No valid fields provided for update.'), null);

    const sql = `UPDATE Employees SET ${setClauses.join(', ')} WHERE EmployeeID = ?;`;
    values.push(employeeId);
    db.query(sql, values, callback);
};


exports.deactivateEmployee = (employeeId, callback) => {
    const sql = `UPDATE Employees SET isActive = 0 WHERE EmployeeID = ?;`;
    db.query(sql, [employeeId], callback);
};


exports.reactivateEmployee = (employeeId, callback) => {
    const sql = `UPDATE Employees SET isActive = 1 WHERE EmployeeID = ?;`;
    db.query(sql, [employeeId], callback);
};

exports.getTodayAggregates = (employeeId, cb) => {
    const sql = `
    SELECT
      COALESCE(SUM(CASE WHEN Status <> 'Cancelled' THEN Total ELSE 0 END), 0) AS todaySales,
      COALESCE(SUM(CASE WHEN Status <> 'Cancelled' THEN 1 ELSE 0 END), 0)      AS totalOrders
    FROM Orders
    WHERE EmployeeID = ? AND DATE(DatePlaced) = CURDATE();
  `;
    db.query(sql, [employeeId], (err, rows) => cb(err, rows?.[0]));
};

exports.getHourlySalesToday = (employeeId, cb) => {
    const sql = `
    SELECT
      DatePlaced,
      Total,
      Status
    FROM Orders
    WHERE EmployeeID = ? AND DATE(DatePlaced) = CURDATE();
  `;
    db.query(sql, [employeeId], cb);
};

exports.getDailySalesLast7 = (employeeId, cb) => {
    const sql = `
    SELECT
      DATE_FORMAT(d.the_day, '%a') AS day,
      COALESCE(SUM(CASE WHEN o.Status <> 'Cancelled' THEN o.Total ELSE 0 END), 0) AS sales
    FROM (
      SELECT CURDATE() - INTERVAL seq DAY AS the_day
      FROM (SELECT 0 AS seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
            SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) AS s
    ) d
    LEFT JOIN Orders o ON o.EmployeeID = ? AND DATE(o.DatePlaced) = d.the_day
    GROUP BY d.the_day
    ORDER BY d.the_day;
  `;
    db.query(sql, [employeeId], cb);
};

exports.getMonthlySalesLast6 = (employeeId, cb) => {
    const sql = `
    SELECT
      DATE_FORMAT(m.the_month, '%b') AS month,
      COALESCE(SUM(CASE WHEN o.Status <> 'Cancelled' THEN o.Total ELSE 0 END), 0) AS sales
    FROM (
      SELECT DATE_FORMAT(DATE_SUB(LAST_DAY(CURDATE()), INTERVAL seq MONTH), '%Y-%m-01') AS the_month
      FROM (SELECT 0 AS seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
            SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) s
    ) m
    LEFT JOIN Orders o
      ON o.EmployeeID = ?
     AND DATE_FORMAT(o.DatePlaced, '%Y-%m') = DATE_FORMAT(m.the_month, '%Y-%m')
    GROUP BY m.the_month
    ORDER BY m.the_month;
  `;
    db.query(sql, [employeeId], cb);
};

exports.getRecentOrders = (employeeId, cb) => {
    const sql = `
    SELECT
      OrderID,
      DATE_FORMAT(DatePlaced, '%Y-%m-%d') AS DatePlaced,
      Total,
      Status
    FROM Orders
    WHERE EmployeeID = ?
    ORDER BY DatePlaced DESC
    LIMIT 5;
  `;
    db.query(sql, [employeeId], cb);
};

exports.getEmployeePerformance = (filters, cb) => {
    const { fromDate, toDate } = filters || {};
    const params = [];

    const buildDateFilter = (alias) => {
        const conditions = [];
        if (fromDate) {
            conditions.push(`DATE(${alias}.DatePlaced) >= ?`);
            params.push(fromDate);
        }
        if (toDate) {
            conditions.push(`DATE(${alias}.DatePlaced) <= ?`);
            params.push(toDate);
        }
        return conditions.length ? ' AND ' + conditions.join(' AND ') : '';
    };

    const sql = `
        SELECT
            e.EmployeeID,
            e.FirstName,
            e.LastName,
            e.Role,
            e.Email,
            e.isActive,
            COUNT(DISTINCT o.OrderID) AS TotalOrders,
            (
                SELECT COALESCE(SUM(od2.Quantity), 0)
                FROM Orders o2
                INNER JOIN OrderDetails od2 ON o2.OrderID = od2.OrderID
                WHERE o2.EmployeeID = e.EmployeeID${buildDateFilter('o2')}
            ) AS TotalItemsSold,
            (
                SELECT COALESCE(SUM(o3.Total), 0)
                FROM Orders o3
                WHERE o3.EmployeeID = e.EmployeeID${buildDateFilter('o3')}
            ) AS TotalRevenue,
            (
                SELECT COALESCE(AVG(o4.Total), 0)
                FROM Orders o4
                WHERE o4.EmployeeID = e.EmployeeID${buildDateFilter('o4')}
            ) AS AvgOrderValue,
            (
                SELECT COUNT(DISTINCT od5.ProductID)
                FROM Orders o5
                INNER JOIN OrderDetails od5 ON o5.OrderID = od5.OrderID
                WHERE o5.EmployeeID = e.EmployeeID${buildDateFilter('o5')}
            ) AS UniqueProducts,
            MIN(o.DatePlaced) AS FirstSale,
            MAX(o.DatePlaced) AS LastSale
        FROM Employees e
        LEFT JOIN Orders o ON e.EmployeeID = o.EmployeeID${buildDateFilter('o')}
        GROUP BY e.EmployeeID, e.FirstName, e.LastName, e.Role, e.Email, e.isActive
        HAVING TotalOrders > 0
        ORDER BY TotalRevenue DESC
    `;

    console.log('Employee Performance SQL:', sql);
    console.log('Params:', params);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Database error fetching employee performance:', err);
            return cb(err, null);
        }

        if (!results?.length) return cb(null, []);

        const formatted = results.map(emp => ({
            EmployeeID: emp.EmployeeID,
            FirstName: emp.FirstName,
            LastName: emp.LastName,
            Role: emp.Role,
            Email: emp.Email,
            isActive: emp.isActive,
            TotalOrders: Number(emp.TotalOrders) || 0,
            TotalItemsSold: Number(emp.TotalItemsSold) || 0,
            TotalRevenue: Number(emp.TotalRevenue) || 0,
            AvgOrderValue: Number(emp.AvgOrderValue) || 0,
            UniqueProducts: Number(emp.UniqueProducts) || 0,
            FirstSale: emp.FirstSale,
            LastSale: emp.LastSale,
            FullName: `${emp.FirstName} ${emp.LastName}`
        }));

        cb(null, formatted);
    });
};

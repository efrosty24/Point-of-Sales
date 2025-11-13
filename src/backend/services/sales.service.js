const db = require('../config/db.config');


exports.salesSummary = ({ from, to }, cb) => {
    const params = [];
    let where = '';

    if (from || to) {
        const conditions = [];
        if (from) {
            conditions.push('DATE(o.DatePlaced) >= ?');
            params.push(from);
        }
        if (to) {
            conditions.push('DATE(o.DatePlaced) <= ?');
            params.push(to);
        }
        where = 'WHERE ' + conditions.join(' AND ');
    }

    const sql = `
        SELECT
            COUNT(DISTINCT o.OrderID) AS orders,
            COALESCE(SUM(o.Total), 0) AS revenue,
            CASE
                WHEN COUNT(DISTINCT o.OrderID) = 0 THEN 0
                ELSE COALESCE(SUM(o.Total), 0) / COUNT(DISTINCT o.OrderID)
                END AS avg_ticket
        FROM Orders o
            ${where}
    `;

    db.query(sql, params, (err, rows) => {
        if (err) {
            console.error('Error in salesSummary:', err);
            return cb(err, null);
        }
        cb(null, rows && rows[0]);
    });
};


exports.productPerformanceByCategorySupplier = ({ from, to, limit = 10 }, cb) => {
    const params = [];
    const whereClauses = [];

    if (from) {
        whereClauses.push('DATE(o.DatePlaced) >= ?');
        params.push(from);
    }
    if (to) {
        whereClauses.push('DATE(o.DatePlaced) <= ?');
        params.push(to);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
        SELECT
            p.ProductID,
            p.Name AS ProductName,
            p.Brand,
            c.CategoryName,
            COALESCE(s.Name, 'No Supplier') AS SupplierName,
            COALESCE(SUM(od.Quantity), 0) AS UnitsSold,
            COALESCE(SUM(od.Quantity * od.Price), 0) AS TotalRevenue,
            COALESCE(AVG(od.Price), 0) AS AvgPrice,
            COUNT(DISTINCT o.OrderID) AS OrderCount,
            p.Stock AS CurrentStock,
            CASE
                WHEN p.Stock < p.ReorderThreshold THEN 'Low Stock'
                ELSE 'In Stock'
            END AS StockStatus
        FROM Orders o
        INNER JOIN OrderDetails od ON o.OrderID = od.OrderID
        INNER JOIN Products p ON od.ProductID = p.ProductID
        INNER JOIN Categories c ON p.CategoryID = c.CategoryID
        LEFT JOIN Suppliers s ON p.SupplierID = s.SupplierID
        ${whereClause}
        GROUP BY p.ProductID, p.Name, p.Brand, c.CategoryName, s.Name, p.Stock, p.ReorderThreshold
        HAVING UnitsSold > 0
        ORDER BY TotalRevenue DESC, UnitsSold DESC
        LIMIT ?
    `;

    params.push(Number(limit));

    db.query(sql, params, (err, rows) => {
        if (err) {
            console.error('Error in productPerformanceByCategorySupplier:', err);
            return cb(err, null);
        }
        cb(null, rows || []);
    });
};



exports.customerPurchaseAnalytics = ({ from, to, limit = 10 }, cb) => {
    const params = [];
    const whereClauses = [];
    const whereClausesSubquery = [];

    if (from) {
        whereClauses.push('DATE(o.DatePlaced) >= ?');
        whereClausesSubquery.push('DATE(DatePlaced) >= ?');
        params.push(from);
    }
    if (to) {
        whereClauses.push('DATE(o.DatePlaced) <= ?');
        whereClausesSubquery.push('DATE(DatePlaced) <= ?');
        params.push(to);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const whereClauseSubquery = whereClausesSubquery.length > 0 ? `WHERE ${whereClausesSubquery.join(' AND ')}` : '';

    
    const subqueryParams = [...params];

    const sql = `
        SELECT
            grouped_customer.GroupedCustomerID AS CustomerID,
            grouped_customer.CustomerName,
            grouped_customer.Email,
            grouped_customer.LoyaltyPoints,
            order_summary.TotalOrders,
            order_summary.TotalSpent,
            order_summary.AvgOrderValue,
            order_summary.LastPurchaseDate,
            order_summary.FirstPurchaseDate,
            order_summary.CustomerLifespanDays,
            COUNT(DISTINCT od.ProductID) AS UniqueProductsPurchased,
            COALESCE(SUM(od.Quantity), 0) AS TotalItemsBought,
            GROUP_CONCAT(DISTINCT cat.CategoryName ORDER BY cat.CategoryName SEPARATOR ', ') AS PreferredCategories
        FROM (
            SELECT
                CASE 
                    WHEN c.CustomerID = 1 THEN 1 
                    ELSE c.CustomerID 
                END AS GroupedCustomerID,
                CASE
                    WHEN c.CustomerID = 1 THEN 'Guest Customers'
                    ELSE CONCAT(c.FirstName, ' ', c.LastName)
                END AS CustomerName,
                CASE 
                    WHEN c.CustomerID = 1 THEN 'N/A'
                    ELSE c.Email
                END AS Email,
                CASE 
                    WHEN c.CustomerID = 1 THEN 0
                    ELSE c.Points
                END AS LoyaltyPoints,
                c.CustomerID AS OriginalCustomerID
            FROM Customers c
        ) grouped_customer
        INNER JOIN (
            SELECT 
                CASE 
                    WHEN CustomerID IS NULL OR CustomerID = 1 THEN 1
                    ELSE CustomerID 
                END AS CustomerID,
                COUNT(OrderID) AS TotalOrders,
                COALESCE(SUM(Total), 0) AS TotalSpent,
                COALESCE(AVG(Total), 0) AS AvgOrderValue,
                MAX(DatePlaced) AS LastPurchaseDate,
                MIN(DatePlaced) AS FirstPurchaseDate,
                DATEDIFF(MAX(DatePlaced), MIN(DatePlaced)) AS CustomerLifespanDays
            FROM Orders
            ${whereClauseSubquery}
            GROUP BY CASE 
                WHEN CustomerID IS NULL OR CustomerID = 1 THEN 1
                ELSE CustomerID 
            END
        ) order_summary ON grouped_customer.GroupedCustomerID = order_summary.CustomerID
        INNER JOIN Orders o ON (
            CASE 
                WHEN o.CustomerID IS NULL OR o.CustomerID = 1 THEN 1
                ELSE o.CustomerID
            END = grouped_customer.GroupedCustomerID
        )
        INNER JOIN OrderDetails od ON o.OrderID = od.OrderID
        INNER JOIN Products p ON od.ProductID = p.ProductID
        LEFT JOIN Categories cat ON p.CategoryID = cat.CategoryID
        ${whereClause}
        GROUP BY 
            grouped_customer.GroupedCustomerID,
            grouped_customer.CustomerName,
            grouped_customer.Email,
            grouped_customer.LoyaltyPoints,
            order_summary.TotalOrders,
            order_summary.TotalSpent,
            order_summary.AvgOrderValue,
            order_summary.LastPurchaseDate,
            order_summary.FirstPurchaseDate,
            order_summary.CustomerLifespanDays
        HAVING order_summary.TotalOrders > 0
        ORDER BY order_summary.TotalSpent DESC, order_summary.TotalOrders DESC
        LIMIT ?
    `;

    
    const allParams = [...subqueryParams, ...params, Number(limit)];

    db.query(sql, allParams, (err, rows) => {
        if (err) {
            console.error('Error in customerPurchaseAnalytics:', err);
            return cb(err, null);
        }
        cb(null, rows || []);
    });
};




exports.categoryPerformanceWithEmployees = ({ from, to, limit = 10 }, cb) => {
    const params = [];
    const whereClauses = [];

    if (from) {
        whereClauses.push('DATE(o.DatePlaced) >= ?');
        params.push(from);
    }
    if (to) {
        whereClauses.push('DATE(o.DatePlaced) <= ?');
        params.push(to);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
        SELECT
            c.CategoryID,
            c.CategoryName,
            COUNT(DISTINCT o.OrderID) AS OrderCount,
            COUNT(DISTINCT od.ProductID) AS UniqueProducts,
            COALESCE(SUM(od.Quantity), 0) AS TotalUnitsSold,
            COALESCE(SUM(od.Quantity * od.Price), 0) AS TotalRevenue,
            COALESCE(AVG(od.Quantity * od.Price), 0) AS AvgRevenuePerSale,
            COUNT(DISTINCT e.EmployeeID) AS EmployeesInvolved,
            COUNT(DISTINCT cu.CustomerID) AS UniqueCustomers,
            GROUP_CONCAT(DISTINCT CONCAT(e.FirstName, ' ', e.LastName) ORDER BY e.LastName SEPARATOR ', ') AS TopEmployees
        FROM Orders o
                 INNER JOIN OrderDetails od ON o.OrderID = od.OrderID
                 INNER JOIN Products p ON od.ProductID = p.ProductID
                 INNER JOIN Categories c ON p.CategoryID = c.CategoryID
                 LEFT JOIN Employees e ON o.EmployeeID = e.EmployeeID
                 LEFT JOIN Customers cu ON o.CustomerID = cu.CustomerID
            ${whereClause}
        GROUP BY c.CategoryID, c.CategoryName
        HAVING TotalRevenue > 0
        ORDER BY TotalRevenue DESC
            LIMIT ?
    `;

    params.push(Number(limit));

    db.query(sql, params, (err, rows) => {
        if (err) {
            console.error('Error in categoryPerformanceWithEmployees:', err);
            return cb(err, null);
        }
        cb(null, rows || []);
    });
};


exports.salesTrendsAndPatterns = ({ from, to, limit = 20 }, cb) => {
    const params = [];
    const whereClauses = [];

    if (from) {
        // filtrar por fecha LOCAL (America/Chicago)
        whereClauses.push("DATE(CONVERT_TZ(o.DatePlaced, '+00:00', 'America/Chicago')) >= ?");
        params.push(from);
    }
    if (to) {
        whereClauses.push("DATE(CONVERT_TZ(o.DatePlaced, '+00:00', 'America/Chicago')) <= ?");
        params.push(to);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
        SELECT
            CONVERT_TZ(o.DatePlaced, '+00:00', 'America/Chicago') AS SaleDate,
            DAYNAME(CONVERT_TZ(o.DatePlaced, '+00:00', 'America/Chicago')) AS DayOfWeek,
            HOUR(CONVERT_TZ(o.DatePlaced, '+00:00', 'America/Chicago')) AS HourOfDay,

            COUNT(DISTINCT o.OrderID) AS OrderCount,
            COUNT(DISTINCT c.CustomerID) AS UniqueCustomers,
            COUNT(DISTINCT CASE WHEN c.FirstName = 'Guest' THEN NULL ELSE c.CustomerID END) AS RegisteredCustomers,
            COUNT(DISTINCT CASE WHEN c.FirstName = 'Guest' THEN c.CustomerID ELSE NULL END) AS GuestCustomers,
            COALESCE(SUM(DISTINCT o.Total), 0) AS TotalRevenue,
            COALESCE(AVG(DISTINCT o.Total), 0) AS AvgOrderValue,
            COALESCE(AVG(od.Quantity), 0) AS AvgItemsPerOrder,
            COUNT(DISTINCT cat.CategoryID) AS CategoriesInvolved,
            COUNT(DISTINCT p.ProductID) AS UniqueProductsSold,
            COALESCE(SUM(od.Quantity), 0) AS TotalItemsSold,
            MAX(o.Total) AS LargestOrder,
            MIN(o.Total) AS SmallestOrder,
            GROUP_CONCAT(DISTINCT cat.CategoryName ORDER BY cat.CategoryName SEPARATOR ', ') AS TopCategories
        FROM Orders o
            INNER JOIN OrderDetails od ON o.OrderID = od.OrderID
            INNER JOIN Products p ON od.ProductID = p.ProductID
            INNER JOIN Categories cat ON p.CategoryID = cat.CategoryID
            LEFT JOIN Customers c ON o.CustomerID = c.CustomerID
        ${whereClause}
        GROUP BY SaleDate, DayOfWeek, HourOfDay
        HAVING OrderCount > 0
        ORDER BY SaleDate DESC, HourOfDay DESC
        LIMIT ?
    `;

    params.push(Number(limit));

    db.query(sql, params, (err, rows) => {
        if (err) {
            console.error('Error in salesTrendsAndPatterns:', err);
            return cb(err, null);
        }
        cb(null, rows || []);
    });
};


exports.fetchRecentSales = ({ from, to, limit = 10 }, cb) => {
    const params = [];
    const whereClauses = [];

    if (from) {
        whereClauses.push('DATE(o.DatePlaced) >= ?');
        params.push(from);
    }
    if (to) {
        whereClauses.push('DATE(o.DatePlaced) <= ?');
        params.push(to);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
        SELECT
            o.OrderID,
            o.DatePlaced,
            o.Total,
            o.Status,
            c.FirstName,
            c.LastName
        FROM Orders o
                 LEFT JOIN Customers c ON c.CustomerID = o.CustomerID
            ${whereClause}
        ORDER BY o.DatePlaced DESC
            LIMIT ?
    `;

    params.push(Number(limit));

    db.query(sql, params, (err, rows) => {
        if (err) {
            console.error('Error in fetchRecentSales:', err);
            return cb(err, null);
        }
        cb(null, rows || []);
    });
};


exports.getEmployeePerformance = (filters, cb) => {
    const { fromDate, toDate } = filters || {};

    const params = [];
    const whereClauses = [];

    if (fromDate) {
        whereClauses.push('DATE(o.DatePlaced) >= ?');
        params.push(fromDate);
    }
    if (toDate) {
        whereClauses.push('DATE(o.DatePlaced) <= ?');
        params.push(toDate);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
        SELECT
            e.EmployeeID,
            e.FirstName,
            e.LastName,
            e.Role,
            e.Email,
            COUNT(DISTINCT o.OrderID) AS TotalOrders,
            COALESCE(SUM(od.Quantity), 0) AS TotalItemsSold,
            COALESCE(SUM(od.Quantity * od.Price), 0) AS TotalRevenue,
            COALESCE(AVG(o.Total), 0) AS AvgOrderValue,
            COUNT(DISTINCT od.ProductID) AS UniqueProducts,
            MIN(o.DatePlaced) AS FirstSale,
            MAX(o.DatePlaced) AS LastSale
        FROM Employees e
                 LEFT JOIN Orders o ON e.EmployeeID = o.EmployeeID
                 LEFT JOIN OrderDetails od ON o.OrderID = od.OrderID
                 LEFT JOIN Products p ON od.ProductID = p.ProductID
            ${whereClause}
        GROUP BY e.EmployeeID, e.FirstName, e.LastName, e.Role, e.Email
        HAVING TotalOrders > 0
        ORDER BY TotalRevenue DESC
    `;

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Database error occurred fetching employee performance:', err);
            return cb(err, null);
        }

        if (!results || results.length === 0) {
            return cb(null, []);
        }

        const formatted = results.map(emp => ({
            EmployeeID: emp.EmployeeID,
            FirstName: emp.FirstName,
            LastName: emp.LastName,
            Role: emp.Role,
            Email: emp.Email,
            TotalOrders: parseInt(emp.TotalOrders) || 0,
            TotalItemsSold: parseInt(emp.TotalItemsSold) || 0,
            TotalRevenue: parseFloat(emp.TotalRevenue) || 0,
            AvgOrderValue: parseFloat(emp.AvgOrderValue) || 0,
            UniqueProducts: parseInt(emp.UniqueProducts) || 0,
            FirstSale: emp.FirstSale,
            LastSale: emp.LastSale,
            FullName: `${emp.FirstName} ${emp.LastName}`
        }));

        return cb(null, formatted);
    });
};

module.exports = exports;

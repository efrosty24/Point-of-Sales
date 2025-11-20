const db = require('../config/db.config');

// Get all active sale events
exports.getActiveSaleEvents = (cb) => {
    const sql = `
    SELECT 
      SaleEventID,
      Name,
      Description,
      StartDate,
      EndDate
    FROM SaleEvents
    WHERE CURDATE() BETWEEN StartDate AND EndDate
    ORDER BY StartDate ASC;
  `;
    db.query(sql, cb);
};

// Get all sale events (including inactive)
exports.getAllSaleEvents = (cb) => {
    const sql = `
    SELECT 
      SaleEventID,
      Name,
      Description,
      StartDate,
      EndDate
    FROM SaleEvents
    ORDER BY StartDate DESC;
  `;
    db.query(sql, cb);
};

// Get sale event by ID
exports.findSaleEventById = (saleEventId, cb) => {
    const sql = `
    SELECT 
      SaleEventID,
      Name,
      Description,
      StartDate,
      EndDate
    FROM SaleEvents
    WHERE SaleEventID = ?
    LIMIT 1;
  `;
    db.query(sql, [saleEventId], cb);
};

// Get all active discounted products with sale event info
exports.getActiveDiscountedProducts = (cb) => {
    const sql = `
    SELECT 
      p.ProductID,
      p.Name,
      p.Brand,
      p.CategoryID,
      p.Price,
      p.Description,
      p.Stock,
      p.QuantityValue,
      p.QuantityUnit,
      p.ImgName,
      p.ImgPath,
      d.DiscountID,
      d.DiscountType,
      d.DiscountValue,
      d.Conditions,
      se.SaleEventID,
      se.Name AS SaleEventName,
      se.Description AS SaleEventDescription,
      c.CategoryName
    FROM Products p
    INNER JOIN Discounts d ON p.ProductID = d.ProductID
    INNER JOIN SaleEvents se ON d.SaleEventID = se.SaleEventID
    INNER JOIN Categories c ON p.CategoryID = c.CategoryID
    WHERE CURDATE() BETWEEN se.StartDate AND se.EndDate
    ORDER BY 
      CASE d.DiscountType
        WHEN 'bogo' THEN 1
        WHEN 'percentage' THEN 2
        WHEN 'fixed' THEN 3
      END,
      d.DiscountValue DESC;
  `;
    db.query(sql, cb);
};

// Get products by sale event ID
exports.getProductsBySaleEventId = (saleEventId, cb) => {
    const sql = `
    SELECT 
      p.ProductID,
      p.Name,
      p.Brand,
      p.CategoryID,
      p.Price,
      p.Description,
      p.Stock,
      p.QuantityValue,
      p.QuantityUnit,
      p.ImgName,
      p.,
      d.DiscountID,
      d.DiscountType,
      d.DiscountValue,
      d.Conditions,
      se.SaleEventID,
      se.Name AS SaleEventName,
      c.CategoryName
    FROM Products p
    INNER JOIN Discounts d ON p.ProductID = d.ProductID
    INNER JOIN SaleEvents se ON d.SaleEventID = se.SaleEventID
    INNER JOIN Categories c ON p.CategoryID = c.CategoryID
    WHERE se.SaleEventID = ?
    ORDER BY p.Name ASC;
  `;
    db.query(sql, [saleEventId], cb);
};

// Get discount by product ID
exports.getDiscountByProductId = (productId, cb) => {
    const sql = `
    SELECT 
      d.DiscountID,
      d.ProductID,
      d.SaleEventID,
      d.DiscountType,
      d.DiscountValue,
      d.Conditions,
      se.Name AS SaleEventName,
      se.StartDate,
      se.EndDate
    FROM Discounts d
    INNER JOIN SaleEvents se ON d.SaleEventID = se.SaleEventID
    WHERE d.ProductID = ?
      AND CURDATE() BETWEEN se.StartDate AND se.EndDate
    LIMIT 1;
  `;
    db.query(sql, [productId], cb);
};

// Get products by category with active discounts
exports.getDiscountedProductsByCategory = (categoryId, cb) => {
    const sql = `
    SELECT 
      p.ProductID,
      p.Name,
      p.Brand,
      p.Price,
      p.Stock,
      p.QuantityValue,
      p.QuantityUnit,
      p.ImgName,
      p.,
      d.DiscountType,
      d.DiscountValue,
      d.Conditions,
      se.Name AS SaleEventName,
      c.CategoryName
    FROM Products p
    INNER JOIN Discounts d ON p.ProductID = d.ProductID
    INNER JOIN SaleEvents se ON d.SaleEventID = se.SaleEventID
    INNER JOIN Categories c ON p.CategoryID = c.CategoryID
    WHERE p.CategoryID = ?
      AND CURDATE() BETWEEN se.StartDate AND se.EndDate
    ORDER BY p.Name ASC;
  `;
    db.query(sql, [categoryId], cb);
};

// Get count of products in each active sale event
exports.getSaleEventProductCounts = (cb) => {
    const sql = `
    SELECT 
      se.SaleEventID,
      se.Name,
      se.Description,
      se.StartDate,
      se.EndDate,
      COUNT(d.ProductID) AS ProductCount
    FROM SaleEvents se
    LEFT JOIN Discounts d ON se.SaleEventID = d.SaleEventID
    WHERE CURDATE() BETWEEN se.StartDate AND se.EndDate
    GROUP BY se.SaleEventID, se.Name, se.Description, se.StartDate, se.EndDate
    ORDER BY se.StartDate ASC;
  `;
    db.query(sql, cb);
};

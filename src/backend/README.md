# POS Admin API (Backend) — Admin Endpoints Doc

## Folder layout

- `routes/` → HTTP routes only (no DB/logic)
- `controllers/` → Input parsing + HTTP responses
- `services/` → SQL queries and DB logic
- `server.js` → App bootstrap + route mounting

Mounted paths:
- `/admin/inventory` → `routes/admin.inventory.routes.js`
- `/admin/sales` → `routes/admin.sales.routes.js`
- `/admin/sale-events` → `routes/admin.sale-events.routes.js`  
- `/admin/discounts` → `routes/admin.discounts.routes.js`


---

## Inventory API

### GET `/admin/inventory/products`
List products with stock and supplier info.

**Query params (optional)**
- `search` — matches `Name` or `Brand`
- `category` — `CategoryID`
- `supplier` — `SupplierID`

**Sample response**
```json
[
  {
    "ProductID": 1,
    "Name": "Gala Apple",
    "Brand": "OrchardBest",
    "Stock": 24,
    "ReorderThreshold": 30,
    "Price": 0.79,
    "IsPricePerQty": 1,
    "QuantityValue": 1,
    "QuantityUnit": "lb",
    "SupplierID": 1,
    "SupplierName": "Fresh Farms",
    "IsLow": 1
  }
]
```

---

### POST `/admin/inventory/restock`
Increase stock for a set of SKUs and log a restock record per item.

**Body**
```json
{
  "SupplierID": 2,
  "items": [
    { "ProductID": 4, "Qty": 5 },
    { "ProductID": 6, "Qty": 3 }
  ]
}
```

**Response**
```json
{ "ok": true, "itemsUpdated": 2, "SupplierID": 2 }
```

**Behavior**
- `Products.Stock += Qty` (per item)
- Inserts one row per item into `RestockOrders` with `Status="received"` and `DatePlaced=NOW()`

---

### GET `/admin/inventory/suppliers`
Supplier list for dropdowns/search.

**Sample response**
```json
[
  { "SupplierID": 1, "Name": "Fresh Farms", "Phone": "555-1001", "Email": "sales@freshfarms.com" },
  { "SupplierID": 2, "Name": "Daily Dairy", "Phone": "555-1002", "Email": "orders@dailydairy.com" }
]
```

---

### GET `/admin/inventory/suppliers/:id/products`
Products for a given supplier (to build a restock sheet).

**Sample response**
```json
[
  {
    "ProductID": 4,
    "Name": "Whole Milk 1 gal",
    "Brand": "DailyDairy",
    "Stock": 18,
    "ReorderThreshold": 20,
    "Price": 3.99,
    "IsPricePerQty": 0,
    "QuantityValue": 1,
    "QuantityUnit": "ea"
  }
]
```

---

### Get `/admin/inventory/low-stock`
List of products where current stock is less than or equal to the reorder threshold.
Used to alert admins when products need to be restocked.

**Sample reponse**
```json
[
  {
    "ProductID": 12,
    "Name": "Whole Milk",
    "Brand": "DairyPure",
    "Stock": 3,
    "ReorderThreshold": 10,
    "CategoryName": "Dairy",
    "SupplierName": "Fresh Farms Co."
  },
  {
    "ProductID": 18,
    "Name": "Apples",
    "Brand": "Local Orchard",
    "Stock": 5,
    "ReorderThreshold": 12,
    "CategoryName": "Produce",
    "SupplierName": "Green Valley Suppliers"
  }
]
```

---

## Sales API

### GET `/admin/sales/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`
Totals over a date range.

**Response**
```json
{ "orders": 8, "units": 33, "revenue": 95.12, "avg_ticket": 11.89 }
```

---

### GET `/admin/sales/top-products?from=&to=&limit=10`
Top products by units (revenue as tiebreaker).

**Response**
```json
[
  { "ProductID": 2,  "Name": "Banana",    "units": 8, "revenue": 3.12 },
  { "ProductID": 10, "Name": "Cola 12pk", "units": 2, "revenue": 11.98 }
]
```

---

### GET `/admin/sales/by-category?from=&to=`
Revenue aggregated by category.

**Response**
```json
[
  { "CategoryID": 2, "CategoryName": "Dairy",     "revenue": 24.33 },
  { "CategoryID": 4, "CategoryName": "Beverages", "revenue": 15.97 }
]
```

---

## Quick demo (Terminal)

```bash
# Restock
curl -s -X POST "http://localhost:3001/admin/inventory/restock"   -H "Content-Type: application/json"   -d '{"SupplierID":2,"items":[{"ProductID":4,"Qty":5},{"ProductID":6,"Qty":3}]}' | jq .

# Sales
curl -s "http://localhost:3001/admin/sales/summary?from=2025-10-01&to=2025-10-19" | jq .
curl -s "http://localhost:3001/admin/sales/top-products?from=2025-10-01&to=2025-10-19&limit=5" | jq .
curl -s "http://localhost:3001/admin/sales/by-category?from=2025-10-01&to=2025-10-19" | jq .
```

---

## Notes
- SQL in `services/` aligns with the team schema:
  - `OrderDetails.Price` used for revenue math
  - `Orders.DatePlaced` used for date filters
  - `Products.ReorderThreshold` drives `IsLow`


---

## Sale Events API

### POST `/admin/sale-events`
Create a new sale event.  
Sale events represent promotional periods (e.g., *Holiday Sales*, *Fall Promo*) that can group multiple discounts.

**Body**
```json
{
  "Name": "Holiday Sale",
  "Description": "Seasonal discount event",
  "StartDate": "2025-12-01",
  "EndDate": "2025-12-31"
}
```

**Response**
```json
{ "ok": true, "SaleEventID": 2 }
```

**Behavior**
- Validates that `StartDate <= EndDate`.
- Returns `400 INVALID_DATES` if invalid.

---

### GET `/admin/sale-events`
List all sale events in descending order by start date.

**Sample response**
```json
[
  {
    "SaleEventID": 2,
    "Name": "Holiday Sale",
    "Description": "Seasonal discount event",
    "StartDate": "2025-12-01",
    "EndDate": "2025-12-31"
  },
  {
    "SaleEventID": 1,
    "Name": "Fall Promo",
    "Description": "Seasonal discounts",
    "StartDate": "2025-10-20",
    "EndDate": "2025-11-10"
  }
]
```

---

### PATCH `/admin/sale-events/:saleEventId`
Update the name, description, or date range of a sale event.

**Body**
```json
{
  "Name": "Holiday Sale Extended",
  "EndDate": "2026-01-05"
}
```

**Response**
```json
{
  "ok": true,
  "updated": 1,
  "event": {
    "SaleEventID": 2,
    "Name": "Holiday Sale Extended",
    "Description": "Seasonal discount event",
    "StartDate": "2025-12-01",
    "EndDate": "2026-01-05"
  }
}
```

---

### DELETE `/admin/sale-events/:saleEventId`
Delete a sale event and all related discounts (cascades via FK).

**Response**
```json
{ "ok": true, "deleted": 1 }
```

---

### GET `/admin/sale-events/:saleEventId/discounts`
List all discounts associated with a specific sale event.

**Sample response**
```json
[
  {
    "DiscountID": 3,
    "ProductID": 4,
    "ProductName": "Whole Milk 1 gal",
    "DiscountType": "percentage",
    "DiscountValue": "10.00",
    "Conditions": "Valid during Fall Promo"
  }
]
```

---

## Discounts API

### POST `/admin/sale-events/:saleEventId/discounts`
Create a new discount tied to a sale event and product.

**Body**
```json
{
  "ProductID": 4,
  "DiscountType": "percentage",
  "DiscountValue": 10.00,
  "Conditions": "Valid for dairy products only"
}
```

**Response**
```json
{ "ok": true, "DiscountID": 3 }
```

**Behavior**
- Requires existing `SaleEventID` and `ProductID`.
- Returns `400 SALE_EVENT_NOT_FOUND` or `400 PRODUCT_NOT_FOUND` when invalid.

---

### PATCH `/admin/discounts/:discountId`
Update one or more fields of a discount.

**Body**
```json
{
  "DiscountType": "fixed",
  "DiscountValue": 2.50,
  "Conditions": "Only on Wednesdays"
}
```

**Response**
```json
{
  "ok": true,
  "updated": 1,
  "discount": {
    "DiscountID": 3,
    "SaleEventID": 1,
    "ProductID": 4,
    "DiscountType": "fixed",
    "DiscountValue": "2.50",
    "Conditions": "Only on Wednesdays"
  }
}
```

---

### DELETE `/admin/discounts/:discountId`
Delete a discount by ID.

**Response**
```json
{ "ok": true, "deleted": 1 }
```

---

## Quick demo (Terminal)

```bash
# Create event
curl -s -X POST http://localhost:3001/admin/sale-events   -H "Content-Type: application/json"   -d '{"Name":"Holiday Sale","Description":"Seasonal event","StartDate":"2025-12-01","EndDate":"2025-12-31"}' | jq .

# Create discount under event
curl -s -X POST http://localhost:3001/admin/sale-events/1/discounts   -H "Content-Type: application/json"   -d '{"ProductID":4,"DiscountType":"percentage","DiscountValue":10,"Conditions":"Valid during Fall Promo"}' | jq .

# List events and discounts
curl -s http://localhost:3001/admin/sale-events | jq .
curl -s http://localhost:3001/admin/sale-events/1/discounts | jq .

# Update discount
curl -s -X PATCH http://localhost:3001/admin/discounts/3   -H "Content-Type: application/json"   -d '{"DiscountType":"fixed","DiscountValue":2.50}' | jq .

# Delete discount
curl -s -X DELETE http://localhost:3001/admin/discounts/3 | jq .
```

---

## Notes
- Discounts require a valid `SaleEventID` and `ProductID`.  
- Foreign keys:
  - `Discounts.SaleEventID` → `SaleEvents.SaleEventID` (CASCADE)
  - `Discounts.ProductID` → `Products.ProductID` (RESTRICT)
- When a Sale Event is deleted, all its discounts are automatically removed.  
- `DiscountType` supports: `"percentage"`, `"fixed"`, `"bogo"`.  
- Dates are stored as `DATE` type and validated for consistency.  
- All DB logic lives in `/services/` for cleaner separation of concerns.

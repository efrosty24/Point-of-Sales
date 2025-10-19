# POS Admin API (Backend) — Admin Endpoints Doc

## Folder layout

- `routes/` → HTTP routes only (no DB/logic)
- `controllers/` → Input parsing + HTTP responses
- `services/` → SQL queries and DB logic
- `server.js` → App bootstrap + route mounting

Mounted paths:
- `/admin/inventory` → `routes/admin.inventory.routes.js`
- `/admin/sales` → `routes/admin.sales.routes.js`

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

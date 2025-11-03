# POS API (Backend) —  Endpoints Doc
  
## Folder layout

- `routes/` → HTTP routes only (no DB/logic)
- `controllers/` → Input parsing + HTTP responses
- `services/` → SQL queries and DB logic
- `server.js` → App bootstrap + route mounting

Mounted paths:
- `/api` → `routes/api.auth.routes.js`
- `/admin/inventory` → `routes/admin.inventory.routes.js`
- `/admin/sales` → `routes/admin.sales.routes.js`
- `/admin/orders`      → `routes/admin.orders.routes.js`
- `/admin/sale-events` → `routes/admin.sale-events.routes.js`  
- `/admin/discounts` → `routes/admin.discounts.routes.js`
- `/cashier` → `./routes/cashier.routes.js`

---

## POST `/api/login`

Authenticate an employee and return basic profile info.

### Body
```json
{
  "employeeId": 1,
  "password": "Admin123"
}
```

### Response — success
```json
{
  "success": true,
  "message": "Login successful",
  "employee": {
    "id": 1,
    "name": "John Doe",
    "role": "Admin",
    "isAdmin": true
  },
  "route": "/admin"
}
```

### Response — invalid credentials
```json
{ "success": false, "message": "InvalidUP" }
```

### Response — missing credentials
```json
{ "success": false, "message": "Missing credentials" }
```

### Behavior
- Verifies credentials against `employees` table.
- `isAdmin` is computed from:
  - `IsAdmin` column (boolean), **or**
  - `Role = 'admin'` (case-insensitive).
- Returns a route hint:
  - `/admin` if admin
  - `/cashier` otherwise.

---

## GET `/api/auth/role?employeeId=<ID>`

Lightweight endpoint to check if an employee is admin without re-logging in.

### Example
```bash
curl -s "http://localhost:3001/api/auth/role?employeeId=1" | jq .
```

### Response
```json
{
  "id": 1,
  "role": "Admin",
  "isAdmin": true
}
```

### Response — not found
```json
{ "error": "NOT_FOUND" }
```

### Response — missing param
```json
{ "error": "MISSING_EMPLOYEE_ID" }
```
---
# Employees API

### GET `/admin/employees`
List employees with optional filtering and sorting.

**Query params (optional)**
- `id` — filter by `EmployeeID`
- `name` — substring match on `FirstName` or `LastName`
- `role` — one of: `"Admin"`, `"Cashier"`
- `sort` — sort column: `name` | `id` | `role` *(default: `id`)*
- `dir` — sort direction: `ASC` | `DESC` *(default: `ASC`)*

**Sample response**
```json
{
  "message": "3 employees found.",
  "employees": [
    { "EmployeeID": 3, "FirstName": "System", "LastName": "Employee", "Email": "emp@pos.lcom", "Phone": "0000000000", "Role": "Cashier" },
    { "EmployeeID": 6, "FirstName": "Jane", "LastName": "Doe", "Email": "qa2@example.com", "Phone": "555-9999", "Role": "Admin" },
    { "EmployeeID": 8, "FirstName": "Jane", "LastName": "Doe", "Email": "qa.auto+001@example.com", "Phone": "555-9001", "Role": "Admin" }
  ]
}
```

---

### POST `/admin/employees`
Create a new employee.

**Body (required)**
- `Email`
- `FirstName`
- `LastName`
- `Phone`
- `Role` — `"Admin"` or `"Cashier"`
- `UserPassword` *(or `Password`, which is mapped internally to `UserPassword`)*

**Body (optional)**
*(none at the moment)*

**Example request**
```json
{
  "Email": "luis.alfaro@example.com",
  "FirstName": "Luis",
  "LastName": "Alfaro",
  "Phone": "555-7777",
  "Role": "Admin",
  "Password": "NoHashNeeded123"
}
```

**Sample response**
```json
{
  "message": "Employee Added",
  "employee": {
    "EmployeeID": 7,
    "Email": "luis.alfaro@example.com",
    "FirstName": "Luis",
    "LastName": "Alfaro",
    "Phone": "555-7777",
    "Role": "Admin"
  }
}
```

**Behavior**
- If `Password` is provided and `UserPassword` is not, the server maps `Password → UserPassword`.
- No hashing is performed (plain text per current spec).
- `Role` is validated against the enum: `"Admin"`, `"Cashier"`.

**Errors**
```json
{ "error": "Missing employee data or required fields.", "missing": ["..."] }
{ "error": "DB error" }
```

---

### PUT `/admin/employees/:id`
Update one or more fields of an employee.

**Body (any subset)**
- Allowed fields: `FirstName`, `LastName`, `Email`, `Phone`, `Role`, `UserPassword`  
  *(You may send `Password` instead of `UserPassword` if your controller supports mapping; otherwise send `UserPassword`.)*

**Example request**
```json
{ "Phone": "555-0000", "Role": "Cashier" }
```

**Sample response**
```json
{
  "message": "3 updated successfully",
  "updatedFields": { "Phone": "555-0000", "Role": "Cashier" }
}
```

**Errors**
```json
{ "error": "Employee ID is required" }
{ "error": "No update data is provided" }
{ "error": "INVALID_ROLE", "allowed": ["Admin","Cashier"] }
{ "error": "Failed to update employee due to server error." }
{ "error": "Employee with ID <id> not found" }
```

---

### DELETE `/admin/employees/:id`
Delete an employee by ID.

**Response — success**
- HTTP `204 No Content`

**Errors**
```json
{ "error": "Employee ID is required" }
{ "error": "Failed to delete employee data." }
{ "error": "Employee with ID <id> not found" }
```

---

### GET `/admin/employees/:id/dashboard`
Returns summarized sales analytics and performance metrics for a specific employee.

**Description**  
Fetches aggregate sales data (today’s totals, order count, averages, trends, and recent activity) for the employee identified by `:id`.  
The data is computed dynamically from the `Orders` table.

---

**Path parameter**
- `:id` — Employee ID *(integer, required)*

---

**Sample Response**
```json
{
  "todaySales": 1240.55,
  "totalOrders": 63,
  "avgPerOrder": 19.68,
  "hourlySales": [
    { "hour": "8 AM", "sales": 90 },
    { "hour": "9 AM", "sales": 120 },
    { "hour": "10 AM", "sales": 220 },
    { "hour": "11 AM", "sales": 310 },
    { "hour": "12 PM", "sales": 380 },
    { "hour": "1 PM", "sales": 270 },
    { "hour": "2 PM", "sales": 230 },
    { "hour": "3 PM", "sales": 340 }
  ],
  "dailySales": [
    { "day": "Mon", "sales": 2800 },
    { "day": "Tue", "sales": 3100 },
    { "day": "Wed", "sales": 2950 },
    { "day": "Thu", "sales": 3350 },
    { "day": "Fri", "sales": 3700 },
    { "day": "Sat", "sales": 4600 },
    { "day": "Sun", "sales": 3200 }
  ],
  "monthlySales": [
    { "month": "May", "sales": 15800 },
    { "month": "Jun", "sales": 17600 },
    { "month": "Jul", "sales": 19200 },
    { "month": "Aug", "sales": 21000 },
    { "month": "Sep", "sales": 23400 },
    { "month": "Oct", "sales": 25800 }
  ],
  "recentOrders": [
    { "id": "1", "date": "2025-10-30", "total": 54.90, "status": "Completed" },
    { "id": "2", "date": "2025-10-30", "total": 37.50, "status": "Pending" },
    { "id": "3", "date": "2025-10-29", "total": 18.25, "status": "Completed" },
    { "id": "4", "date": "2025-10-29", "total": 63.80, "status": "Cancelled" },
    { "id": "5", "date": "2025-10-29", "total": 22.10, "status": "Completed" }
  ]
}
```

---

**Response Fields**

| Field | Type | Description |
|--------|------|-------------|
| `todaySales` | number | Total sales for the current day (excluding cancelled orders). |
| `totalOrders` | number | Number of orders placed today (excluding cancelled). |
| `avgPerOrder` | number | Average sales per order today (`todaySales / totalOrders`). |
| `hourlySales` | array | Sales per hour for the current day. |
| `dailySales` | array | Total daily sales for the last 7 days. |
| `monthlySales` | array | Total monthly sales for the last 6 months. |
| `recentOrders` | array | Five most recent orders from the employee. |

---

**Errors**
```json
{ "error": "Invalid employee ID" }
{ "error": "Failed to load dashboard data" }
```

---

**Example Test**
```bash
curl -sS "http://127.0.0.1:8080/admin/employees/3/dashboard" | jq .
```

**Example Response**
```json
{
  "todaySales": 88.77,
  "totalOrders": 2,
  "avgPerOrder": 44.38,
  "hourlySales": [
    { "hour": "4 PM", "sales": 34.64 },
    { "hour": "6 PM", "sales": 54.13 }
  ],
  "dailySales": [
    { "day": "Sun", "sales": 129.11 },
    { "day": "Mon", "sales": 179.19 },
    { "day": "Tue", "sales": 53.28 },
    { "day": "Wed", "sales": 0 },
    { "day": "Thu", "sales": 0 },
    { "day": "Fri", "sales": 0 },
    { "day": "Sat", "sales": 88.77 }
  ],
  "monthlySales": [
    { "month": "Jun", "sales": 0 },
    { "month": "Jul", "sales": 0 },
    { "month": "Aug", "sales": 0 },
    { "month": "Sep", "sales": 0 },
    { "month": "Oct", "sales": 361.58 },
    { "month": "Nov", "sales": 88.77 }
  ],
  "recentOrders": [
    { "id": "79", "date": "2025-11-01", "total": 34.64, "status": "Completed" },
    { "id": "78", "date": "2025-11-01", "total": 54.13, "status": "Completed" },
    { "id": "74", "date": "2025-10-28", "total": 31.28, "status": "Placed" },
    { "id": "73", "date": "2025-10-28", "total": 16.41, "status": "Placed" },
    { "id": "76", "date": "2025-10-28", "total": 2.89, "status": "Placed" }
  ]
}
```
---
## Quick demo (Terminal)

```bash
# List all
curl -s "http://localhost:3001/admin/employees" | jq .

# Filter by role
curl -s "http://localhost:3001/admin/employees?role=Cashier" | jq .

# Filter by name substring
curl -s "http://localhost:3001/admin/employees?name=System" | jq .

# Create (Password alias → UserPassword)
curl -s -X POST "http://localhost:3001/admin/employees"   -H "Content-Type: application/json"   -d '{
    "Email":"qa.auto+001@example.com",
    "FirstName":"Jane",
    "LastName":"Doe",
    "Phone":"555-9001",
    "Role":"Admin",
    "Password":"PlainText999"
  }' | jq .

# Update (only allowed fields; Role must be Admin/Cashier)
curl -s -X PUT "http://localhost:3001/admin/employees/3"   -H "Content-Type: application/json"   -d '{"Phone":"555-0000","Role":"Cashier"}' | jq .

# Update with invalid role → 400
curl -i -s -X PUT "http://localhost:3001/admin/employees/3"   -H "Content-Type: application/json"   -d '{"Role":"Manager"}' | head -n 15

# Delete by ID (204 on success)
curl -i -s -X DELETE "http://localhost:3001/admin/employees/8" | head -n1
```


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

### POST `/admin/inventory/products`
Add a product to the catalog.

**Body (required)**
- `Name`
- `Stock`
- `ReorderThreshold`
- `Price`
- `IsPricePerQty` *(boolean: 0/1 or true/false)*
- `QuantityValue`
- `QuantityUnit`
- `SupplierID`
- `CategoryID`

**Body (optional)**
- `Brand`
- `ImgName`
- `ImgPath`
- `Description`

**Example request**
```json
{
  "Name": "Wireless Mechanical Keyboard",
  "Brand": "TechKeys",
  "Stock": 150,
  "ReorderThreshold": 30,
  "Price": 129.99,
  "IsPricePerQty": false,
  "QuantityValue": 1,
  "QuantityUnit": "unit",
  "SupplierID": 105,
  "ImgName": "keyboard_mk500.jpg",
  "ImgPath": "/assets/images/keyboard_mk500.jpg",
  "CategoryID": 1,
  "Description": "Full-size 104-key mechanical keyboard with brown tactile switches and RGB lighting."
}
```

**Sample response**
```json
{
  "message": "Product added",
  "product": {
    "ProductID": 91,
    "Name": "Wireless Mechanical Keyboard",
    "Brand": "TechKeys",
    "Stock": 150,
    "ReorderThreshold": 30,
    "Price": 129.99,
    "IsPricePerQty": false,
    "QuantityValue": 1,
    "QuantityUnit": "unit",
    "SupplierID": 105,
    "ImgName": "keyboard_mk500.jpg",
    "ImgPath": "/assets/images/keyboard_mk500.jpg",
    "CategoryID": 1,
    "Description": "Full-size 104-key mechanical keyboard with brown tactile switches and RGB lighting."
  }
}
```

**Errors**
```json
{ "error": "Missing product data or required fields" }
{ "error": "DB error" }
```

---

### GET `/admin/inventory/suppliers`
List all suppliers (for dropdowns/search).

**Sample response**
```json
[
  { "SupplierID": 1, "Name": "Fresh Farms", "Phone": "555-1001", "Email": "sales@freshfarms.com" },
  { "SupplierID": 2, "Name": "Daily Dairy", "Phone": "555-1002", "Email": "orders@dailydairy.com" }
]
```

---

### GET `/admin/inventory/suppliers/:id`
Retrieve one supplier by ID.

**Sample response**
```json
{
  "SupplierID": 3,
  "Name": "Bake House",
  "Phone": "555-1003",
  "Email": "hello@bakehouse.com"
}
```

**Errors**
```json
{ "error": "INVALID_ID" }
{ "error": "NOT_FOUND" }
```

---

### POST `/admin/inventory/suppliers`
Create a new supplier.

**Body**
```json
{ "Name": "Test Supplier", "Phone": "555-7777", "Email": "test@supplier.com" }
```

**Response**
```json
{ "ok": true, "SupplierID": 8 }
```

**Errors**
```json
{ "error": "MISSING_FIELDS", "message": "Name is required." }
{ "error": "DB error" }
```

---

### PATCH `/admin/inventory/suppliers/:id`
Update supplier fields (partial).

**Body (any subset)**
```json
{ "Name": "Supplier QA", "Phone": "555-0000", "Email": "qa@supplier.com" }
```

**Response**
```json
{
  "ok": true,
  "updated": 1,
  "supplier": {
    "SupplierID": 8,
    "Name": "Supplier QA",
    "Phone": "555-0000",
    "Email": "qa@supplier.com"
  }
}
```

**Errors**
```json
{ "error": "INVALID_ID" }
{ "error": "EMPTY_PATCH" }
{ "error": "NOT_FOUND" }
{ "error": "DB error" }
```

---

### DELETE `/admin/inventory/suppliers/:id`
Delete a supplier (only if not referenced by any products).

**Response**
```json
{ "ok": true, "deleted": 1 }
```

**Errors**
```json
{ "error": "SUPPLIER_IN_USE", "message": "Supplier has Products referencing it." }
{ "error": "NOT_FOUND" }
{ "error": "INVALID_ID" }
{ "error": "DB error" }
```

---

### GET `/admin/inventory/suppliers/:id/products`
Products for a given supplier (restock sheet).

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
### POST `/admin/inventory/restock`
Increase stock for one or more products from a specific supplier.  
Also logs each restock into the `RestockOrders` table for record keeping.

**Body**
```json
{
  "SupplierID": 3,
  "items": [
    { "ProductID": 70, "Qty": 3 },
    { "ProductID": 71, "Qty": 5 }
  ]
}
```

**Response — success**
```json
{
  "ok": true,
  "itemsUpdated": 2,
  "SupplierID": 3
}
```

**Behavior**
- Validates that:
  - `SupplierID` exists.
  - Each product belongs to that supplier.
  - Quantities (`Qty`) are positive.
- Updates stock for each product:  
  `Products.Stock = Products.Stock + Qty`
- Inserts a record into `RestockOrders(ProductID, SupplierID, Quantity, Status="received", DatePlaced=NOW())`.

**Errors**
```json
{ "error": "Invalid payload" }
{ "error": "DB error", "message": "Supplier mismatch for ProductID <id>" }
{ "error": "DB error" }
```

---
### GET `/admin/inventory/low-stock`
Products where `Stock <= ReorderThreshold` (alert list).

**Sample response**
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
  }
]
```

---
### GET `/admin/inventory/products/:id`
Returns detailed information for a single product.

**Sample response**
```json
[
  {
    "ProductID": 1,
    "Name": "Whole Milk",
    "Brand": "DairyPure",
    "Price": 4.99,
    "Stock": 5,
    "ReorderThreshold": 10,
    "Description": "1 gallon whole milk",
    "IsPricePerQty": 0,
    "QuantityValue": 1,
    "QuantityUnit": "gal",
    "CategoryName": "Dairy",
    "SupplierName": "Fresh Farms Co."
  }
]
```

---
### PATCH `/admin/inventory/products/:id`
Updates an existing product’s details.

**Body**
```json
{
  "Price": 5.25,
  "Stock": 15
}
```

**Response**
```json
{ "message": "Product updated successfully" }
```

---
### GET `/admin/inventory/products?search=<name>`
Searches for products by name or brand.

**Sample response**
```json
[
  {
    "ProductID": 1,
    "Name": "Whole Milk",
    "Brand": "DairyPure",
    "Price": 4.99,
    "Stock": 5,
    "CategoryName": "Dairy",
    "SupplierName": "Fresh Farms Co."
  }
]
```

---
### GET `/admin/inventory/categories/search?name=<text>`
Searches for categories by name.

**Sample response**
```json
[
  { "CategoryID": 1, "CategoryName": "Beverages" },
  { "CategoryID": 3, "CategoryName": "Non-Alcoholic Beverages" }
]
```

---
### POST `/admin/inventory/categories`
Creates a new category.

**Body**
```json
{ "CategoryName": "Produce" }
```

**Response**
```json
{ "message": "Category created", "CategoryID": 5 }
```

---
### PATCH `/admin/inventory/categories/:id`
Updates a category’s name.

**Body**
```json
{ "CategoryName": "Dairy & Eggs" }
```

**Response**
```json
{ "message": "Category updated successfully" }
```

---
### DELETE `/admin/inventory/categories/:id`
Deletes a category, unless products reference it.

**Response - Success**
```json
{ "message": "Category deleted successfully" }
```
**Response - Failure**
```json
{ "error": "Category cannot be deleted", "message": "Products are still assigned to this category." }
{ "message": "Category not found" }
```
---

### Quick demo (Suppliers)
```bash
# List
curl -s "http://localhost:3001/admin/inventory/suppliers" | jq .

# Create
curl -s -X POST "http://localhost:3001/admin/inventory/suppliers"   -H "Content-Type: application/json"   -d '{"Name":"QA Supplier","Phone":"555-7000","Email":"qa@supplier.com"}' | jq .

# Get by ID
curl -s "http://localhost:3001/admin/inventory/suppliers/8" | jq .

# Patch
curl -s -X PATCH "http://localhost:3001/admin/inventory/suppliers/8"   -H "Content-Type: application/json"   -d '{"Phone":"555-0001"}' | jq .

# Delete (will fail if supplier has products)
curl -s -X DELETE "http://localhost:3001/admin/inventory/suppliers/8" | jq .
```
---

# Cashier API

### GET `/cashier/customers/lookup?phone=<number>`
Find existing customers by phone (digits only comparison).  
If `phone` is empty or no matches are found, returns an empty array (frontend should offer Guest flow).

**Sample response**
```json
[
  { "CustomerID": 2, "FirstName": "Bob", "LastName": "Jones", "Phone": "(123) 456-7890", "Email": "bob@example.com" }
]
```

---

### POST `/cashier/orders/quote`
Preview totals without saving an order.

**Body**
```json
{
  "items": [
    { "ProductID": 4, "Qty": 2 },
    { "ProductID": 6, "Qty": 1 }
  ],
  "taxRate": 0.0825
}
```

**Response**
```json
{
  "subtotal": 11.77,
  "tax": 0.97,
  "total": 12.74,
  "items": [
    { "ProductID": 4, "Name": "Whole Milk 1 gal", "Qty": 2, "Price": 3.99, "LineTotal": 7.98 },
    { "ProductID": 6, "Name": "Cheddar Cheese 8oz", "Qty": 1, "Price": 3.79, "LineTotal": 3.79 }
  ]
}
```

**Notes**
- Uses current `Products.Price` and validates quantities.
- No DB writes occur.

---

### POST `/cashier/orders`
Create a new order (guest or registered customer) and decrement stock transactionally.

**Guest checkout logic**
- If `customerId` is missing and `phone` is `""`, the order is created under `GUEST_CUSTOMER_ID` (from `.env`).
- On server startup, a minimal Guest row is ensured automatically.

**Body**
```json
{
  "customerId": null,
  "phone": "",
  "employeeId": 1,
  "items": [
    { "ProductID": 4, "Qty": 2 },
    { "ProductID": 6, "Qty": 1 }
  ],
  "payment": { "method": "card", "amount": 12.74 },
  "taxRate": 0.0825
}
```

**Response — success**
```json
{ "ok": true, "OrderID": 10, "subtotal": 11.77, "tax": 0.97, "total": 12.74 }
```

**Errors**
```json
{ "error": "EMPTY_CART" }
{ "error": "BAD_QTY" }
{ "error": "PRODUCT_NOT_FOUND" }
{ "error": "DB_ERROR" }
```

**Behavior**
- Inserts `Orders(CustomerID, EmployeeID, Subtotal, Tax, Total, Status='paid')`.
- Inserts `OrderDetails(OrderID, ProductID, Quantity, Price)` (price snapshot).
- Decrements `Products.Stock` within the same transaction.

---

### GET `/cashier/orders/:id`
Receipt payload (header + line items + totals).

**Sample response**
```json
{
  "header": {
    "OrderID": 10,
    "DatePlaced": "2025-10-25T23:35:03.000Z",
    "Status": "paid",
    "CustomerID": 1000,
    "EmployeeID": 1,
    "CustomerName": "Guest"
  },
  "items": [
    { "ProductID": 4, "Name": "Whole Milk 1 gal", "Qty": 2, "Price": 3.99, "LineTotal": 7.98 },
    { "ProductID": 6, "Name": "Cheddar Cheese 8oz", "Qty": 1, "Price": 3.79, "LineTotal": 3.79 }
  ],
  "subtotal": 11.77,
  "tax": 0.97,
  "total": 12.74
}
```

---

### PATCH `/admin/orders/:id/reassign-customer`
(Admin) Reassign a guest order to a real customer later.

**Body**
```json
{ "CustomerID": 2 }
```

**Response**
```json
{ "ok": true, "updated": 1 }
```

---

## Quick demo (Terminal)

```bash
# Lookup (no match → empty array)
curl -s "http://localhost:3001/cashier/customers/lookup?phone=5550101" | jq .

# Quote (no DB writes)
curl -s -X POST "http://localhost:3001/cashier/orders/quote"   -H "Content-Type: application/json"   -d '{"items":[{"ProductID":4,"Qty":2},{"ProductID":6,"Qty":1}],"taxRate":0.0825}' | jq .

# Checkout as Guest (phone empty → uses GUEST_CUSTOMER_ID)
curl -s -X POST "http://localhost:3001/cashier/orders"   -H "Content-Type: application/json"   -d '{"customerId":null,"phone":"","employeeId":1,"items":[{"ProductID":4,"Qty":2},{"ProductID":6,"Qty":1}],"payment":{"method":"card","amount":12.74},"taxRate":0.0825}' | jq .

# Receipt (replace :id with the OrderID returned above)
curl -s "http://localhost:3001/cashier/orders/10" | jq .

# Reassign guest → real customer
curl -s -X PATCH "http://localhost:3001/admin/orders/10/reassign-customer"   -H "Content-Type: application/json" -d '{"CustomerID":2}' | jq .
```

---

## Cashier Notes
- `.env` must include `GUEST_CUSTOMER_ID=<id>`; the backend ensures that row exists in `Customers` at startup.
- `employeeId` is **required** (FK `NOT NULL`) and must reference an existing `Employees` row.
- `OrderDetails.Price` is a **snapshot** of the price at the time of sale (reporting uses this, not the current `Products.Price`).

## Orders API

### GET `/admin/orders/recent?limit=N`
Returns the N most recent orders (for dashboard widgets).

**Query params**
- `limit` *(optional, default=5)* — number of rows to return.

**Sample response**
```json
[
  {
    "OrderID": 8,
    "DatePlaced": "2025-10-18T19:41:23.000Z",
    "Total": "7.64",
    "FirstName": "Bob",
    "LastName": "Jones"
  }
]
```

---

### GET `/admin/orders?from=YYYY-MM-DD&to=YYYY-MM-DD`
List orders within a date range (inclusive).

**Query params**
- `from` — start date
- `to` — end date

**Sample response**
```json
[
  {
    "OrderID": 8,
    "DatePlaced": "2025-10-18T19:41:23.000Z",
    "CustomerID": 2,
    "EmployeeID": 3,
    "Total": "7.64"
  }
]
```

---

### GET `/admin/orders/:orderId`
Order detail (header + line items) and computed totals.

**Sample response**
```json
{
  "header": {
    "OrderID": 8,
    "DatePlaced": "2025-10-18T19:41:23.000Z",
    "CustomerID": 2,
    "EmployeeID": 3,
    "CustomerFirst": "Bob",
    "CustomerLast": "Jones"
  },
  "items": [
    { "ProductID": 4, "Name": "Whole Milk 1 gal", "Qty": 1, "Price": 3.99, "LineTotal": 3.99 },
    { "ProductID": 2, "Name": "Banana", "Qty": 4, "Price": 0.39, "LineTotal": 1.56 }
  ],
  "total": 7.64
}
```

**Notes**
- `total` is recomputed from line items to verify consistency.
- `Price` per line comes from `OrderDetails.Price`.

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


##  Sale Events API

### GET `/admin/sale-events`
List all sale events (past, active, and future).

**Sample Response**
```json
[
  {
    "SaleEventID": 5,
    "Name": "Fall Promo",
    "Description": "Seasonal",
    "StartDate": "2025-10-01T05:00:00.000Z",
    "EndDate": "2025-10-31T05:00:00.000Z"
  }
]
```

---

### POST `/admin/sale-events`
Create a new sale event.

**Body**
```json
{
  "Name": "Holiday Sale",
  "Description": "End-of-year discounts on selected items.",
  "StartDate": "2025-12-01",
  "EndDate": "2025-12-31"
}
```

**Response**
```json
{
  "ok": true,
  "SaleEventID": 6
}
```

**Errors**
```json
{ "error": "MISSING_FIELDS", "message": "Name, StartDate, EndDate are required." }
{ "error": "INVALID_DATES", "message": "StartDate must be <= EndDate." }
{ "error": "DB_ERROR" }
```

---

### GET `/admin/sale-events/:saleEventId/discounts`
List all discounts linked to a specific event.

**Sample Response**
```json
[
  {
    "DiscountID": 12,
    "ProductID": 61,
    "ProductName": "Bananas",
    "DiscountType": "percentage",
    "DiscountValue": "20.00",
    "Conditions": null
  }
]
```

**Errors**
```json
{ "error": "SALE_EVENT_REQUIRED" }
{ "error": "SALE_EVENT_NOT_FOUND" }
```

---

### POST `/admin/sale-events/prune`
Deletes expired sale events (and their discounts).

**Response**
```json
{ "ok": true, "deleted": 5 }
```

---

##  Discounts API

### POST `/admin/sale-events/:saleEventId/discounts`
Add a discount to a product under an existing sale event.

**Body**
```json
{
  "ProductID": 61,
  "DiscountType": "percentage",
  "DiscountValue": 20
}
```

**Response**
```json
{
  "ok": true,
  "DiscountID": 12
}
```

**Behavior**
- Validates that:
  - The sale event exists and is active (CURDATE() between StartDate and EndDate).
  - The product exists in the database.
  - The product does **not** already have an active discount.
- Supports DiscountType:
  - "percentage" → value in %
  - "fixed" → fixed amount off
  - "bogo" → Buy One Get One type (1:1 default)

**Errors**
```json
{ "error": "SALE_EVENT_REQUIRED" }
{ "error": "SALE_EVENT_NOT_FOUND" }
{ "error": "EVENT_NOT_ACTIVE", "message": "SaleEvent must be active today." }
{ "error": "MISSING_FIELDS" }
{ "error": "INVALID_TYPE" }
{ "error": "PRODUCT_NOT_FOUND" }
{ "error": "DUPLICATE_DISCOUNT", "message": "This product already has an active discount." }
{ "error": "DB_ERROR" }
```

---

### PATCH `/admin/discounts/:discountId`
Update a discount’s fields partially.

**Body**
```json
{
  "DiscountValue": 25
}
```

**Response**
```json
{
  "ok": true,
  "updated": 1,
  "discount": {
    "DiscountID": 12,
    "SaleEventID": 5,
    "ProductID": 61,
    "DiscountType": "percentage",
    "DiscountValue": "25.00",
    "Conditions": null
  }
}
```

**Errors**
```json
{ "error": "INVALID_ID" }
{ "error": "EMPTY_PATCH" }
{ "error": "NOT_FOUND" }
{ "error": "INVALID_TYPE" }
{ "error": "DB_ERROR" }
```

---

### DELETE `/admin/discounts/:discountId`
Delete a discount by its ID.

**Response**
```json
{ "ok": true, "deleted": 1 }
```

**Errors**
```json
{ "error": "INVALID_ID" }
{ "error": "NOT_FOUND" }
{ "error": "DB_ERROR" }
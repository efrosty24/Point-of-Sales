# POS API (Backend) — Endpoints Doc

## Folder layout

- `routes/` → HTTP routes only (no DB/logic)
- `controllers/` → Input parsing + HTTP responses
- `services/` → SQL queries and DB logic
- `server.js` → App bootstrap + route mounting

Mounted paths:
- `/api` → `routes/api.auth.routes.js`
- `/admin/inventory` → `routes/admin.inventory.routes.js`
- `/admin/sales` → `routes/admin.sales.routes.js`
- `/admin/orders` → `routes/admin.orders.routes.js`
- `/admin/sale-events` → `routes/admin.sale-events.routes.js`  
- `/admin/employees` → `routes/admin.employee.routes.js` 
- `/admin/discounts` → `routes/admin.discounts.routes.js`
- `/cashier` → `routes/cashier.routes.js`
- `/admin/search` → `routes/admin.search.routes.js`
- `/user/start` → `routes/user.start.routes.js`

---
# LOGIN API

## POST `/api/login`

Authenticate an employee and return basic profile info.

### Body
```json
{
  "email": "john.doe@example.com",
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

*Status: 200 OK*

```json
{ "success": false, "message": "InvalidUP" }
```

### Response — missing credentials

*Status: 400 Bad Request*

```json
{ "success": false, "message": "Missing credentials" }
```

### Response — database error

*Status: 500 Internal Server Error*

```json
{ "success": false, "message": "Database error" }
```

### Behavior

* Verifies credentials against the `Employees` table using the **email** field.
* Email match is **case-insensitive** (`LOWER(Email) = LOWER(?)`).
* Password is checked against `UserPassword` as **plain text** (per current system spec).
* `isAdmin` is derived from:

  * the `IsAdmin` column, **or**
  * `Role = 'admin'` (case-insensitive).
* Returns an automatic redirect hint:

  * `/admin` if user is admin
  * `/cashier` otherwise.

---

## GET `/api/auth/role?employeeId=<ID>`

Lightweight endpoint to check admin status without logging in again.

### Example

```bash
curl -s "http://localhost:8080/api/auth/role?employeeId=1" | jq .
```

### Response — success

```json
{
  "id": 1,
  "role": "Admin",
  "isAdmin": true
}
```

### Response — not found

*Status: 404 Not Found*

```json
{ "error": "NOT_FOUND" }
```

### Response — missing param

*Status: 400 Bad Request*

```json
{ "error": "MISSING_EMPLOYEE_ID" }
```

### Response — database error

*Status: 500 Internal Server Error*

```json
{ "error": "DB_ERROR" }
```

### Behavior

* Looks up the employee by `EmployeeID`.
* Computes `isAdmin` using the same logic as the login endpoint.
* Returns:

  * `id` → `EmployeeID`
  * `role` → `Role`
  * `isAdmin` → computed boolean.

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

**Example request**
```json
{
  "Email": "luis.alfaro@example.com",
  "FirstName": "Luis",
  "LastName": "Alfaro",
  "Phone": "555-7777",
  "Role": "Admin",
  "Password": "Test123"
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

**Path parameter**
- `:id` — Employee ID *(integer, required)*

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

**Response Fields**

| Field          | Type   | Description                                                  |
|----------------|--------|--------------------------------------------------------------|
| `todaySales`   | number | Total sales for the current day (excluding cancelled orders).|
| `totalOrders`  | number | Number of orders placed today (excluding cancelled).         |
| `avgPerOrder`  | number | Average sales per order today (`todaySales / totalOrders`).  |
| `hourlySales`  | array  | Sales per hour for the current day.                          |
| `dailySales`   | array  | Total daily sales for the last 7 days.                       |
| `monthlySales` | array  | Total monthly sales for the last 6 months.                   |
| `recentOrders` | array  | Five most recent orders from the employee.                   |

**Errors**
```json
{ "error": "Invalid employee ID" }
{ "error": "Failed to load dashboard data" }
```

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

## Quick demo (Employees)

```bash
# List all
curl -s "http://localhost:8080/admin/employees" | jq .

# Filter by role
curl -s "http://localhost:8080/admin/employees?role=Cashier" | jq .

# Filter by name substring
curl -s "http://localhost:8080/admin/employees?name=System" | jq .

# Create (Password alias → UserPassword)
curl -s -X POST "http://localhost:8080/admin/employees"   -H "Content-Type: application/json"   -d '{
    "Email":"qa.auto+001@example.com",
    "FirstName":"Jane",
    "LastName":"Doe",
    "Phone":"555-9001",
    "Role":"Admin",
    "Password":"PlainText999"
  }' | jq .

# Update (only allowed fields; Role must be Admin/Cashier)
curl -s -X PUT "http://localhost:8080/admin/employees/3"   -H "Content-Type: application/json"   -d '{"Phone":"555-0000","Role":"Cashier"}' | jq .

# Update with invalid role → 400
curl -i -s -X PUT "http://localhost:8080/admin/employees/3"   -H "Content-Type: application/json"   -d '{"Role":"Manager"}' | head -n 15

# Delete by ID (204 on success)
curl -i -s -X DELETE "http://localhost:8080/admin/employees/8" | head -n1
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
  "ImgName": "",
  "ImgPath": "",
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
    "ImgName": "",
    "ImgPath": "",
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
curl -s "http://localhost:8080/admin/inventory/suppliers" | jq .

# Create
curl -s -X POST "http://localhost:8080/admin/inventory/suppliers"   -H "Content-Type: application/json"   -d '{"Name":"QA Supplier","Phone":"555-7000","Email":"qa@supplier.com"}' | jq .

# Get by ID
curl -s "http://localhost:8080/admin/inventory/suppliers/8" | jq .

# Patch
curl -s -X PATCH "http://localhost:8080/admin/inventory/suppliers/8"   -H "Content-Type: application/json"   -d '{"Phone":"555-0001"}' | jq .

# Delete (will fail if supplier has products)
curl -s -X DELETE "http://localhost:8080/admin/inventory/suppliers/8" | jq .
```

---

## Cashier API

### GET `/cashier/customers/lookup?email=<email>`

Look up existing customers by **email** (case-insensitive, exact match).

**Query params**

- `email` — customer email (if empty, the API returns an empty array)

If `email` is empty or there are no matches, the endpoint returns an empty array.

**Sample response**
```json
[
  {
    "CustomerID": 2,
    "FirstName": "Bob",
    "LastName": "Jones",
    "Phone": "(123) 456-7890",
    "Email": "bob@example.com",
    "Points": 120
  }
]
```

**Errors**
```json
{ "error": "DB_ERROR" }
```

---

### GET `/cashier/products`

Returns products available to the cashier, including original and discounted price.

**Query params (optional)**

* `search` — free text used to search by product `Name` or `ProductID`

  * if `search` is all digits → matches by name **or** exact/partial `ProductID`
  * otherwise → matches by name or textual `ProductID`
* `category` — `CategoryID` or `"All"` (any other falsy value means “all categories”)

**Sample response**

```json
[
  {
    "ProductID": 4,
    "Name": "Whole Milk 1 gal",
    "Brand": "DailyDairy",
    "OriginalPrice": 3.99,
    "FinalPrice": 3.19,
    "DiscountType": "percentage",
    "DiscountValue": 20,
    "ImgPath": "/assets/images/milk_whole.jpg",
    "Stock": 18,
    "ImgName": "milk_whole.jpg",
    "QuantityValue": 1,
    "QuantityUnit": "gal"
  }
]
```

**Notes**

* `FinalPrice` is already computed based on any discount:

  * `percentage` → `Price * (1 - DiscountValue/100)`
  * `fixed` → `max(Price - DiscountValue, 0)`
  * no discount → equal to `OriginalPrice`

**Errors**

```json
{ "error": "DB_ERROR", "message": "..." }
```

---

### POST `/cashier/orders/quote`

Computes an **order quote** (subtotal, tax, total) without writing anything to the database.

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
    {
      "ProductID": 4,
      "Name": "Whole Milk 1 gal",
      "Qty": 2,
      "Price": 3.99,
      "LineTotal": 7.98
    },
    {
      "ProductID": 6,
      "Name": "Cheddar Cheese 8oz",
      "Qty": 1,
      "Price": 3.79,
      "LineTotal": 3.79
    }
  ]
}
```

**Behavior**

* Validates that every `Qty > 0` and each `ProductID` exists.
* Uses current `Products.Price` values.
* Does **not** create a register or order; no DB writes.

**Errors**

```json
{ "error": "EMPTY_CART" }           // no items in the request
{ "error": "BAD_QTY" }              // some Qty <= 0
{ "error": "PRODUCT_NOT_FOUND" }    // some product ID not found
{ "error": "DB_ERROR" }             // general DB error
```

---

## Register (live cart for the cashier)

The cashier flow is:

1. Load products using `GET /cashier/products`.
2. Build or update a cart using `POST /cashier/registerList`.
3. Fetch the live cart with `GET /cashier/registerList/:id`.
4. Optionally remove individual items or delete the entire cart.
5. Assign the cart to a Customer or Guest via `PATCH /cashier/registerList/:id/identity`.
6. Finalize the sale using `POST /cashier/register`, which creates an `Order`.

---

### POST `/cashier/registerList`

Create or update a **RegisterList** (cart) for a given customer or guest.
Internally manages `RegisterList` + `RegisterItems` and updates `Products.Stock`.

**Body**

```json
{
  "customerId": 2,              
  "guestId": null,
  "employeeId": 1,
  "items": [
    { "ProductID": 4, "Qty": 2 },
    { "ProductID": 6, "Qty": 1 }
  ],
  "taxRate": 0.0825             
}
```

**Response — success (simplified)**

```json
{
  "RegisterListID": 15,
  "subtotal": 11.77,
  "tax": 0.97,
  "total": 12.74,
  "items": [
    {
      "ProductID": 4,
      "Name": "Whole Milk 1 gal",
      "Stock": 16,
      "Qty": 2,
      "OriginalPrice": 3.99,
      "Price": 3.19,
      "LineTotal": 6.38,
      "DiscountType": "percentage",
      "DiscountValue": 20
    },
    {
      "ProductID": 6,
      "Name": "Cheddar Cheese 8oz",
      "Stock": 17,
      "Qty": 1,
      "OriginalPrice": 3.79,
      "Price": 3.79,
      "LineTotal": 3.79,
      "DiscountType": null,
      "DiscountValue": 0
    }
  ]
}
```

**Behavior**

* Finds the most recent `RegisterList` for that `CustomerID` or `GuestID`, or creates a new one.
* Locks products and register items (`FOR UPDATE`) to keep stock consistent.
* Applies discounts per product:

  * `percentage` — percent off per unit
  * `fixed` — fixed amount off per unit
  * `bogo` — Buy-One-Get-One (X=1, Y=1) logic on quantity
* Adjusts stock in `Products` based on the **delta** between previous cart quantities and the new ones.
* Upserts into `RegisterItems` via `ON DUPLICATE KEY UPDATE`.

**Errors**

```json
{ "error": "EMPTY_CART" }
{ "error": "BAD_CUSTOMER_OR_GUEST" }        // neither valid customerId nor guestId
{ "error": "BAD_QTY", "ProductID": "4" }
{ "error": "PRODUCT_NOT_FOUND", "ProductID": "4" }
{ "error": "INSUFFICIENT_STOCK", "ProductID": "4" }
{ "error": "DB_ERROR", "message": "..." }
```

---

### GET `/cashier/registerList/:id`

Returns the full snapshot of a register (cart).

**Sample response**

```json
{
  "RegisterListID": 15,
  "CustomerID": 2,
  "EmployeeID": 1,
  "DateCreated": "2025-11-22T19:13:45.000Z",
  "subtotal": 11.77,
  "discount": 2.38,
  "tax": 0,
  "total": 11.77,
  "items": [
    {
      "ProductID": 4,
      "Name": "Whole Milk 1 gal",
      "Qty": 2,
      "Price": 3.19,
      "OriginalPrice": 3.99,
      "LineTotal": 6.38,
      "SavedAmount": 1.60,
      "DiscountType": "percentage",
      "DiscountValue": 20,
      "DiscountLabel": "20% off",
      "ImgPath": "/assets/images/milk_whole.jpg",
      "ImgName": "milk_whole.jpg"
    }
  ]
}
```

> Note: In this snapshot, `tax` is currently computed with a rate of `0`; the actual tax/total logic for the final order is recomputed during checkout.

**Errors**

```json
{ "error": "DB_ERROR" }
{ "error": "NOT_FOUND" }
```

---

### DELETE `/cashier/registerList/:id/items/:productId`

Removes a **single product** from the register and restores its stock in `Products`.

**Response — success**

Returns the **updated register snapshot**, same format as `GET /cashier/registerList/:id`.

**Errors**

```json
{ "error": "BAD_PARAMS" }                        // invalid or non-numeric ids
{ "error": "DB_ERROR", "message": "..." }
{ "error": "NOT_FOUND" }                         // item or register not found
```

---

### DELETE `/cashier/registerList/:id/cart`

Deletes the entire register list (the cart header).

> Note: This endpoint just deletes the `RegisterList` row. Stock restoration is handled at the item level (`DELETE /cashier/registerList/:id/items/:productId`) and/or is used when the cart is already empty.

**Response — success**

```json
{
  "RegisterListID": 15,
  "deleted": true,
  "affected": 1
}
```

**Errors**

```json
{ "error": "BAD_PARAMS" }
{ "error": "DB_ERROR", "message": "..." }
{ "error": "NOT_FOUND" }
```

---

### PATCH `/cashier/registerList/:id/identity`

Assigns or changes the identity of a register between a real customer and a guest.

Exactly **one** of `customerId` or `guestId` must be provided.

**Body**

```json
{ "customerId": 2 }
```

or

```json
{ "guestId": 5 }
```

**Response — success**

Returns the updated register snapshot (same format as `GET /cashier/registerList/:id`).

**Errors**

```json
{ "error": "BAD_PARAMS" }                    // invalid id, or both/neither of customerId/guestId
{ "error": "DB_ERROR", "message": "..." }
{ "error": "NOT_FOUND" }
```

---

## Checkout & receipt

### POST `/cashier/register`

Finalizes a register and converts it into an `Order`.
After this, the register/cart is deleted.

**Body**

```json
{
  "registerListId": 15,
  "employeeId": 1
}
```

**Response — success**
*Status: 201 Created*

```json
{
  "orderId": 42,
  "total": 12.74,
  "status": "Placed"
}
```

**Behavior**

* Locks the register header and its items.
* Computes:

  * `subtotal` (based on final unit prices stored in `RegisterItems`)
  * `discountTotal` (amount saved, including BOGO logic)
  * `tax` (using fixed tax rate `0.0825`)
  * `total`
* Inserts into `Orders`:

  * `CustomerID`, `GuestID`, `EmployeeID`, `Subtotal`, `DiscountTotal`, `Tax`, `Total`, `Status = 'Placed'`, `DatePlaced = NOW()`.
* Inserts into `OrderDetails`:

  * `OrderID`, `ProductID`, `Quantity`, `DiscountID` (if any), `Price` (final unit price snapshot).
* Deletes:

  * All `RegisterItems` for that `RegisterListID`
  * The `RegisterList` itself.
* Stock is **not** changed here (stock was already adjusted when building/updating the cart).

**Errors**

```json
{ "error": "REGISTER_NOT_FOUND" }
{ "error": "EMPTY_REGISTER" }
{ "error": "ORDER_CREATE_FAILED" }          
```

---

### GET `/cashier/orders/:id/receipt`

Returns a full receipt payload for a given order.

**Sample response**

```json
{
  "OrderID": 42,
  "CustomerID": 2,
  "GuestID": null,
  "EmployeeID": 1,
  "CashierName": "Alice",
  "Date": "2025-11-22T20:05:13.000Z",
  "Status": "Placed",
  "CustomerName": "Bob Jones",
  "CustomerPoints": 120,
  "Subtotal": 11.77,
  "Discount": 2.38,
  "Tax": 0.97,
  "Total": 12.74,
  "Items": [
    {
      "ProductID": 4,
      "Name": "Whole Milk 1 gal",
      "Qty": 2,
      "UnitPrice": 3.19,
      "OriginalPrice": 3.99,
      "LineTotal": 6.38,
      "SavedAmount": 1.60,
      "DiscountType": "percentage",
      "DiscountValue": 20
    },
    {
      "ProductID": 6,
      "Name": "Cheddar Cheese 8oz",
      "Qty": 1,
      "UnitPrice": 3.79,
      "OriginalPrice": 3.79,
      "LineTotal": 3.79,
      "SavedAmount": 0,
      "DiscountType": null,
      "DiscountValue": null
    }
  ]
}
```

**Notes**

* If any of the totals in `Orders` (`Subtotal`, `DiscountTotal`, `Tax`, `Total`) are invalid, the service recalculates them from `OrderDetails`.
* `CustomerName` is:

  * loaded from `Customers` if `CustomerID` exists, or
  * `"Guest"` otherwise.

**Errors**

```json
{ "error": "DB_ERROR" }
{ "error": "NOT_FOUND" }
```

---

### Cashier – quick demo (curl)

```bash
# 1) Lookup customer by email
curl -s "http://localhost:8080/cashier/customers/lookup?email=bob@example.com" | jq .

# 2) List cashier products (with discounts)
curl -s "http://localhost:8080/cashier/products?search=milk" | jq .

# 3) Quote (no DB writes)
curl -s -X POST "http://localhost:8080/cashier/orders/quote"   -H "Content-Type: application/json"   -d '{"items":[{"ProductID":4,"Qty":2},{"ProductID":6,"Qty":1}],"taxRate":0.0825}' | jq .

# 4) Create/update register for a customer
curl -s -X POST "http://localhost:8080/cashier/registerList"   -H "Content-Type: application/json"   -d '{"customerId":2,"guestId":null,"employeeId":1,"items":[{"ProductID":4,"Qty":2},{"ProductID":6,"Qty":1}],"taxRate":0.0825}' | jq .

# 5) Get register snapshot
curl -s "http://localhost:8080/cashier/registerList/15" | jq .

# 6) Remove one product from the register and restore its stock
curl -s -X DELETE "http://localhost:8080/cashier/registerList/15/items/4" | jq .

# 7) Reassign register identity to a guest
curl -s -X PATCH "http://localhost:8080/cashier/registerList/15/identity"   -H "Content-Type: application/json"   -d '{"guestId":5}' | jq .

# 8) Checkout register → create order
curl -s -X POST "http://localhost:8080/cashier/register"   -H "Content-Type: application/json"   -d '{"registerListId":15,"employeeId":1}' | jq .

# 9) Get order receipt
curl -s "http://localhost:8080/cashier/orders/42/receipt" | jq .
```

---

## Orders API

### GET `/admin/orders/recent?limit=N`

Returns the **N most recent orders** (for dashboards / widgets).

**Query params**

- `limit` *(optional, default = 5)* — number of orders to return.

**Sample response**
```json
[
  {
    "OrderID": 8,
    "DatePlaced": "2025-10-18T19:41:23.000Z",
    "Status": "Placed",
    "Total": "7.64",
    "FirstName": "Bob",
    "LastName": "Jones"
  }
]
```

**Notes**

* Joins `Orders` with `Customers` to include the customer name (if any).
* Ordered by `DatePlaced DESC`.

**Errors**

```json
{ "error": "DB_ERROR" }
```

---

### GET `/admin/orders?from=YYYY-MM-DD&to=YYYY-MM-DD&customerId=&employeeId=`

List orders within an optional date range and/or filtered by customer/employee.

**Query params (all optional)**

* `from` — start date (inclusive), e.g. `2025-10-01`
* `to` — end date (inclusive)
* `customerId` — filter by `CustomerID`
* `employeeId` — filter by `EmployeeID`

If no params are provided, it returns up to 200 orders (latest first).

**Sample response**

```json
[
  {
    "OrderID": 8,
    "DatePlaced": "2025-10-18T19:41:23.000Z",
    "CustomerID": 2,
    "EmployeeID": 3,
    "Total": 7.64
  }
]
```

**Notes**

* `Total` is **computed from `OrderDetails`** as `SUM(Quantity * Price)` and grouped by `OrderID`.
* Results are limited to 200 rows and ordered by `DatePlaced DESC`.

**Errors**

```json
{ "error": "DB_ERROR" }
```

---

### GET `/admin/orders/:id`

Get a **single order** with header + line items and a recomputed total.

**Sample response**

```json
{
  "header": {
    "OrderID": 8,
    "DatePlaced": "2025-10-18T19:41:23.000Z",
    "CustomerID": 2,
    "EmployeeID": 3,
    "CustomerFirst": "Bob",
    "CustomerLast": "Jones",
    "Total": 7.64,
    "Tax": 0.63
  },
  "items": [
    {
      "ProductID": 4,
      "Name": "Whole Milk 1 gal",
      "Quantity": 1,
      "Price": 3.99,
      "LineTotal": 3.99
    },
    {
      "ProductID": 2,
      "Name": "Banana",
      "Quantity": 4,
      "Price": 0.39,
      "LineTotal": 1.56
    }
  ],
  "total": 7.64
}
```

**Notes**

* `header.Total` and `header.Tax` come from the `Orders` table.
* `items` come from `OrderDetails` joined with `Products`.
* The top-level `total` field is recomputed in code as
  `sum(LineTotal)` from the line items to verify consistency.

**Errors**

```json
{ "error": "INVALID_ID" }     // non-numeric :id
{ "error": "DB_ERROR" }
{ "error": "NOT_FOUND" }
```

---

### PATCH `/admin/orders/:id/reassign-customer`

Reassign an order from a guest (or wrong customer) to a **real customer**.

**Body**

```json
{ "CustomerID": 2 }
```

**Response**

```json
{ "ok": true, "updated": 1 }
```

**Behavior**

* Updates `Orders.CustomerID` for the given `OrderID`.
* Implemented via `cashierSvc.reassignOrderCustomer()`.

**Errors**

```json
{ "error": "MISSING_CUSTOMER_ID" }  // body missing CustomerID
{ "error": "DB_ERROR" }
```

---

### GET `/admin/orders/by-product/:productId`

List **all orders that contain a given product**.

> Controller: `orders.controller.byProduct`
> Service: `orders.service.listByProduct`

**Path params**

* `productId` — the product to filter on.

**Sample response**

```json
[
  {
    "OrderID": 8,
    "DatePlaced": "2025-10-18T19:41:23.000Z",
    "Status": "Placed",
    "CustomerFirst": "Bob",
    "CustomerLast": "Jones",
    "Quantity": 2,
    "Price": 3.99,
    "ProductTotal": 7.98
  }
]
```

**Notes**

* `ProductTotal = Quantity * Price` for that product within the order.
* Useful for “product performance” / “which orders included this item?” views.

**Errors**

```json
{ "error": "Product ID is required" }
{ "error": "DB_ERROR" }
```

---

### GET `/admin/orders/by-customer/:id`

List **all orders for a given customer**, with per-order aggregates.

> Controller: `orders.controller.byCustomer`
> Service: `orders.service.listByCustomer`

**Path params**

* `id` — `CustomerID`

**Sample response**

```json
[
  {
    "OrderID": 8,
    "DatePlaced": "2025-10-18T19:41:23.000Z",
    "Status": "Placed",
    "ItemCount": 5,
    "Total": 7.64,
    "CustomerFirst": "Bob",
    "CustomerLast": "Jones"
  }
]
```

**Notes**

* `ItemCount` = `SUM(Quantity)` for all line items in that order.
* `Total` = `SUM(Quantity * Price)` for that order (recomputed from `OrderDetails`).
* Returns an empty array `[]` if the customer has no orders.

**Errors**

```json
{ "error": "INVALID_CUSTOMER_ID" }
{ "error": "DB_ERROR" }
```

---

## Sales & Analytics API

---

### GET `/admin/sales/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`

High-level sales totals over an optional date range.

**Query params (optional)**  
- `from` — start date (inclusive), e.g. `2025-10-01`  
- `to` — end date (inclusive), e.g. `2025-10-19`

**Response**
```json
{
  "orders": 8,
  "revenue": 95.12,
  "avg_ticket": 11.89
}
```

**Notes**

* `orders` = number of distinct `Orders.OrderID` in range.
* `revenue` = `SUM(Orders.Total)` (0 if no orders).
* `avg_ticket` = `revenue / orders` (0 if `orders = 0`).

---

### GET `/admin/sales/top-products?from=&to=&limit=10`

Top-selling products with category, supplier, and stock info.

**Query params (optional)**

* `from` — start date (inclusive)
* `to` — end date (inclusive)
* `limit` — max number of products (default: 10)

**Response**

```json
[
  {
    "ProductID": 2,
    "ProductName": "Banana",
    "Brand": "Generic",
    "CategoryName": "Produce",
    "SupplierName": "Fresh Farms",
    "UnitsSold": 8,
    "TotalRevenue": 3.12,
    "AvgPrice": 0.39,
    "OrderCount": 4,
    "CurrentStock": 120,
    "StockStatus": "In Stock"
  }
]
```

**Notes**

* Uses `OrderDetails.Quantity` and `OrderDetails.Price` (snapshot at sale time).
* Only returns rows where `UnitsSold > 0`.
* Sorted by `TotalRevenue DESC`, then `UnitsSold DESC`.
* `StockStatus` is computed from `Products.Stock` vs `Products.ReorderThreshold`.

---

### GET `/admin/sales/by-category?from=&to=&limit=10`

Category-level performance including employee and customer coverage.

**Query params (optional)**

* `from` — start date (inclusive)
* `to` — end date (inclusive)
* `limit` — max number of categories (default: 10)

**Response**

```json
[
  {
    "CategoryID": 2,
    "CategoryName": "Dairy",
    "OrderCount": 15,
    "UniqueProducts": 6,
    "TotalUnitsSold": 33,
    "TotalRevenue": 95.12,
    "AvgRevenuePerSale": 6.34,
    "EmployeesInvolved": 3,
    "UniqueCustomers": 12,
    "TopEmployees": "Alice Smith, Bob Jones"
  }
]
```

**Notes**

* Aggregates from `Orders`, `OrderDetails`, `Products`, `Categories`, `Employees`, `Customers`.
* Only categories with `TotalRevenue > 0` are returned.
* Sorted by `TotalRevenue DESC`.

---

### GET `/admin/sales/customer-analytics?from=&to=&limit=10`

Customer (and guest) purchase analytics and lifetime value.

**Query params (optional)**

* `from` — start date (inclusive)
* `to` — end date (inclusive)
* `limit` — max customer groups (default: 10)

**Guest grouping**

* All guest / null customers are grouped as a single synthetic customer:

  * `CustomerID = 1`
  * `CustomerName = "Guest Customers"`
  * `Email = "N/A"`
  * `LoyaltyPoints = 0`

**Response**

```json
[
  {
    "CustomerID": 1,
    "CustomerName": "Guest Customers",
    "Email": "N/A",
    "LoyaltyPoints": 0,
    "TotalOrders": 5,
    "TotalSpent": 62.45,
    "AvgOrderValue": 12.49,
    "LastPurchaseDate": "2025-10-19T21:30:00.000Z",
    "FirstPurchaseDate": "2025-10-10T18:12:00.000Z",
    "CustomerLifespanDays": 9,
    "UniqueProductsPurchased": 14,
    "TotalItemsBought": 40,
    "PreferredCategories": "Beverages, Dairy, Produce"
  }
]
```

**Notes**

* `CustomerLifespanDays = DATEDIFF(LastPurchaseDate, FirstPurchaseDate)`.
* `PreferredCategories` is a comma-separated list of distinct category names.
* Sorted by `TotalSpent DESC`, then `TotalOrders DESC`.

---

### GET `/admin/sales/trends?from=&to=&limit=20`

Sales trends by **local date + hour**, using America/Chicago timezone.

**Query params (optional)**

* `from` — start local date (inclusive)
* `to` — end local date (inclusive)
* `limit` — max buckets (default: 20)

**Response**

```json
[
  {
    "SaleDate": "2025-10-19T21:00:00.000-05:00",
    "DayOfWeek": "Sunday",
    "HourOfDay": 21,
    "OrderCount": 4,
    "UniqueCustomers": 3,
    "RegisteredCustomers": 2,
    "GuestCustomers": 1,
    "TotalRevenue": 62.45,
    "AvgOrderValue": 15.61,
    "AvgItemsPerOrder": 3.25,
    "CategoriesInvolved": 3,
    "UniqueProductsSold": 9,
    "TotalItemsSold": 13,
    "LargestOrder": 25.99,
    "SmallestOrder": 5.75,
    "TopCategories": "Beverages, Dairy, Produce"
  }
]
```

**Notes**

* Internally uses `CONVERT_TZ(o.DatePlaced, '+00:00', 'America/Chicago')`.
* Grouped by `(SaleDate, DayOfWeek, HourOfDay)`.
* Only buckets where `OrderCount > 0` are returned.

---

### GET `/admin/sales/recent?from=&to=&limit=10`

Recent orders list for dashboard widgets.

**Query params (optional)**

* `from` — start date (inclusive)
* `to` — end date (inclusive)
* `limit` — max rows (default: 10)

**Response**

```json
[
  {
    "OrderID": 15,
    "FirstName": "Alice",
    "LastName": "Smith",
    "Total": 23.45,
    "DatePlaced": "2025-10-19T21:30:00.000Z",
    "Status": "paid"
  }
]
```

**Notes**

* Joins `Orders` with `Customers` to show name.
* If `Status` is null, API defaults it to `"paid"`.

---

### GET `/admin/sales/today`

Raw list of today’s orders (server date).

**Response**

```json
[
  {
    "OrderID": 15,
    "CustomerID": 2,
    "EmployeeID": 3,
    "Subtotal": 21.70,
    "DiscountTotal": 0,
    "Tax": 1.75,
    "Total": 23.45,
    "Status": "Paid",
    "DatePlaced": "2025-10-19T21:30:00.000Z"
  }
]
```

**Notes**

* Internally: `WHERE DATE(DatePlaced) = CURDATE()`.

---

### GET `/admin/sales/charts?from=&to=`

Pre-shaped data for **hourly / daily / monthly** revenue charts.

If `from` / `to` are omitted, it uses defaults:

* Hourly → today
* Daily → last 7 days
* Monthly → current year

**Response**

```json
{
  "hourly": [
    { "hour": "0:00",  "total": 0 },
    { "hour": "1:00",  "total": 0 },
    { "hour": "2:00",  "total": 0 }
  ],
  "daily": [
    { "date": "2025-10-13", "total": 0 },
    { "date": "2025-10-14", "total": 12.34 }
  ],
  "monthly": [
    { "month": "Jan", "total": 0 },
    { "month": "Feb", "total": 45.67 }
  ]
}
```

**Notes**

* Backend fills **all buckets**:

  * 24 hours for `hourly`
  * Last 7 days for `daily`
  * 12 months for `monthly`
* Missing buckets are filled with `total = 0`, so the frontend can render charts without extra shaping.

---

### GET `/admin/sales/employees?fromDate=&toDate=`

Employee performance metrics based on orders and line items.

**Query params (optional)**

* `fromDate` — start date (inclusive)
* `toDate` — end date (inclusive)

**Response**

```json
[
  {
    "EmployeeID": 3,
    "FirstName": "Laura",
    "LastName": "Garcia",
    "Role": "Cashier",
    "Email": "laura@example.com",
    "TotalOrders": 42,
    "TotalItemsSold": 180,
    "TotalRevenue": 1250.75,
    "AvgOrderValue": 29.78,
    "UniqueProducts": 55,
    "FirstSale": "2025-10-01T15:11:00.000Z",
    "LastSale": "2025-10-19T21:30:00.000Z",
    "FullName": "Laura Garcia"
  }
]
```

**Notes**

* Only employees with `TotalOrders > 0` are returned.
* Sorted by `TotalRevenue DESC`.

---

## Quick demo (Sales & Analytics)

```bash
# Restock (Inventory API)
curl -s -X POST "http://localhost:8080/admin/inventory/restock"   -H "Content-Type: application/json"   -d '{"SupplierID":2,"items":[{"ProductID":4,"Qty":5},{"ProductID":6,"Qty":3}]}' | jq .

# High-level KPIs
curl -s "http://localhost:8080/admin/sales/summary?from=2025-10-01&to=2025-10-19" | jq .

# Top products
curl -s "http://localhost:8080/admin/sales/top-products?from=2025-10-01&to=2025-10-19&limit=5" | jq .

# Category performance
curl -s "http://localhost:8080/admin/sales/by-category?from=2025-10-01&to=2025-10-19" | jq .

# Customer analytics
curl -s "http://localhost:8080/admin/sales/customer-analytics?from=2025-10-01&to=2025-10-19&limit=5" | jq .

# Trends (date + hour buckets)
curl -s "http://localhost:8080/admin/sales/trends?from=2025-10-01&to=2025-10-19&limit=20" | jq .

# Recent sales
curl -s "http://localhost:8080/admin/sales/recent?limit=10" | jq .

# Today’s orders
curl -s "http://localhost:8080/admin/sales/today" | jq .

# Chart data (hourly / daily / monthly)
curl -s "http://localhost:8080/admin/sales/charts" | jq .
```

---

# Sale Events API 

## GET `/admin/sale-events`

List all sale events (past, active, and upcoming).

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

**Notes**

* Sorted by `StartDate DESC`, then `SaleEventID DESC`.
* Dates are returned in UTC (MySQL → Node default).

---

## POST `/admin/sale-events`

Create a new sale event.

### Body

```json
{
  "Name": "Holiday Sale",
  "Description": "End-of-year discounts on selected items.",
  "StartDate": "2025-12-01",
  "EndDate": "2025-12-31"
}
```

### Response

```json
{
  "ok": true,
  "SaleEventID": 6
}
```

### Errors

```json
{ "error": "MISSING_FIELDS", "message": "Name, StartDate, EndDate are required." }
{ "error": "INVALID_DATES",  "message": "StartDate must be <= EndDate." }
{ "error": "DB_ERROR" }
```

---

## PATCH `/admin/sale-events/:saleEventId`

Update one or more fields of an existing sale event.

### Partial Body Example

```json
{
  "Description": "Updated description",
  "EndDate": "2025-12-28"
}
```

### Response

```json
{
  "ok": true,
  "updated": 1,
  "event": {
    "SaleEventID": 6,
    "Name": "Holiday Sale",
    "Description": "Updated description",
    "StartDate": "2025-12-01",
    "EndDate": "2025-12-28"
  }
}
```

### Errors

```json
{ "error": "INVALID_ID" }
{ "error": "EMPTY_PATCH" }
{ "error": "INVALID_DATES" }
{ "error": "NOT_FOUND" }
{ "error": "DB_ERROR" }
```

---

## DELETE `/admin/sale-events/:saleEventId`

Delete a sale event.

### Response

```json
{ "ok": true, "deleted": 1 }
```

### Errors

```json
{ "error": "INVALID_ID" }
{ "error": "NOT_FOUND" }
{ "error": "DB_ERROR" }
```

---

## GET `/admin/sale-events/:saleEventId/discounts`

List all discounts attached to a specific sale event.

### Sample Response

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

### Errors

```json
{ "error": "SALE_EVENT_REQUIRED" }
{ "error": "SALE_EVENT_NOT_FOUND" }
{ "error": "DB_ERROR" }
```

**Notes**

* First validates the event exists (`svc.exists`).
* Then fetches discounts using `discounts.service.listByEvent`.

---

## POST `/admin/sale-events/prune`

Delete **all discounts** linked to events that are:

* non-existent
* not yet active
* already expired

### Response

```json
{
  "ok": true,
  "deleted": 5
}
```

### Notes

* Uses MySQL `DELETE ... JOIN` to remove invalid discount rows.
* Does **not** delete the sale events themselves.
* Useful as a daily/cron cleanup task.

---

# Discounts API

Discounts are always created **within a sale event**.
Endpoints live under:

```
/admin/sale-events/:saleEventId/discounts
/admin/discounts/:discountId
```

---

## POST `/admin/sale-events/:saleEventId/discounts`

Add a discount to a product under an existing, active sale event.

### Body

```json
{
  "ProductID": 61,
  "DiscountType": "percentage",
  "DiscountValue": 20
}
```

### Response

```json
{
  "ok": true,
  "DiscountID": 12
}
```

### Behavior

This endpoint enforces multiple validations:

* SaleEvent exists
* SaleEvent **is active today** (`CURDATE()` between `StartDate` and `EndDate`)
* Product exists
* Product cannot already have an **active** discount
* Supports these types:

  * `"percentage"` → % off
  * `"fixed"` → subtract fixed amount
  * `"bogo"` → Buy-One-Get-One (default 1:1)

### Possible Errors

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

## PATCH `/admin/discounts/:discountId`

Partially update fields of a discount.

### Body

```json
{
  "DiscountValue": 25
}
```

### Response

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

### Possible Errors

```json
{ "error": "INVALID_ID" }
{ "error": "EMPTY_PATCH" }
{ "error": "NOT_FOUND" }
{ "error": "INVALID_TYPE" }
{ "error": "DB_ERROR" }
```

---

## DELETE `/admin/discounts/:discountId`

Delete a discount by its ID.

### Response

```json
{ "ok": true, "deleted": 1 }
```

### Possible Errors

```json
{ "error": "INVALID_ID" }
{ "error": "NOT_FOUND" }
{ "error": "DB_ERROR" }
```

---

## Search API 

Single endpoint to quickly look up **customers**, **orders**, or **products** by numeric ID.

### GET `/admin/search?type=&q=`

Search by ID in one of the core entities.

#### Query params

* `type` — which entity to search:

  * `"customers"`
  * `"orders"`
  * `"products"`
* `q` — numeric ID to search for (e.g. `5`, `42`, `101`)

If `q` is not a valid number, the request is rejected.

---

### Search customers

**Request**

```http
GET /admin/search?type=customers&q=2
```

**Sample response**

```json
[
  {
    "CustomerID": 2,
    "FirstName": "Alice",
    "LastName": "Smith",
    "Email": "alice@example.com",
    "Phone": "555-1234",
    "Address": "123 Main St",
    "City": "Houston",
    "State": "TX",
    "Zip": "77096",
    "Country": "USA"
  }
]
```

---

### Search orders

**Request**

```http
GET /admin/search?type=orders&q=8
```

**Sample response**

```json
[
  {
    "OrderID": 8,
    "CustomerID": 2,
    "EmployeeID": 3,
    "Subtotal": 21.7,
    "DiscountTotal": 0,
    "Tax": 1.75,
    "Total": 23.45,
    "Status": "Paid",
    "DatePlaced": "2025-10-19T21:30:00.000Z",
    "CustomerFirst": "Alice",
    "CustomerLast": "Smith"
  }
]
```

---

### Search products

**Request**

```http
GET /admin/search?type=products&q=61
```

**Sample response**

```json
[
  {
    "ProductID": 61,
    "Name": "Bananas",
    "Brand": "Generic",
    "Price": 0.39,
    "Stock": 120,
    "SupplierID": 4,
    "CategoryID": 2,
    "ReorderThreshold": 20
  }
]
```

---

### Error responses

Possible error shapes returned by this endpoint:

```json
{ "error": "Missing type or query" }
{ "error": "Query must be a numeric ID" }
{ "error": "Invalid search type" }
{ "error": "Some database error message..." }
```

**Notes**

* `type` is case-insensitive (`"Customers"`, `"customers"` both work).
* `q` must be a numeric ID; otherwise the request is rejected with `Query must be a numeric ID`.
* Each handler returns an **array** (empty if not found), since it forwards the raw rows from MySQL. If you prefer a single object or `{ found: false }`, you can wrap this in the controller later.

---

## Storefront Start / Promotions API 

These endpoints power the **storefront home page** and **promotions** view: active sale events, discounted products, and counts.

Base path (example):
If mounted as `app.use('/user/start', userStartRoutes)`, then endpoints are:

* `/user/start/active`
* `/user/start/events`
* `/user/start/events/:eventId/products`
* `/user/start/discounts`
* `/user/start/events/counts`

---

### GET `/user/start/active`

Home page data: **all active sale events** + **all currently discounted products**.

**Response**

```json
{
  "success": true,
  "saleEvents": [
    {
      "SaleEventID": 5,
      "Name": "Fall Promo",
      "Description": "Seasonal discounts on selected dairy and produce.",
      "StartDate": "2025-10-01T05:00:00.000Z",
      "EndDate": "2025-10-31T05:00:00.000Z"
    }
  ],
  "discountedProducts": [
    {
      "ProductID": 61,
      "Name": "Bananas",
      "Brand": "Generic",
      "CategoryID": 2,
      "Price": 0.39,
      "Description": "Fresh yellow bananas",
      "Stock": 120,
      "QuantityValue": 1,
      "QuantityUnit": "lb",
      "ImgName": "bananas-1lb.jpg",
      "ImgPath": "/images/products/bananas-1lb.jpg",
      "DiscountID": 12,
      "DiscountType": "percentage",
      "DiscountValue": 20,
      "Conditions": null,
      "SaleEventID": 5,
      "SaleEventName": "Fall Promo",
      "SaleEventDescription": "Seasonal discounts on selected dairy and produce.",
      "CategoryName": "Produce"
    }
  ]
}
```

**Notes**

* “Active” means: `CURDATE()` is between `SaleEvents.StartDate` and `SaleEvents.EndDate`.
* Discounted products are ordered by **discount priority**:

  1. `bogo`
  2. `percentage`
  3. `fixed`
     then by `DiscountValue DESC`.

---

### GET `/user/start/events`

List sale events, with optional filter for **only active** events.

**Query params (optional)**

* `active=true` → only events where `CURDATE()` is between `StartDate` and `EndDate`.
* omit / anything else → all events (past, active, and future).

**Response**

```json
{
  "success": true,
  "saleEvents": [
    {
      "SaleEventID": 5,
      "Name": "Fall Promo",
      "Description": "Seasonal discounts on selected dairy and produce.",
      "StartDate": "2025-10-01T05:00:00.000Z",
      "EndDate": "2025-10-31T05:00:00.000Z"
    },
    {
      "SaleEventID": 6,
      "Name": "Holiday Sale",
      "Description": "End-of-year discounts on selected items.",
      "StartDate": "2025-12-01T05:00:00.000Z",
      "EndDate": "2025-12-31T05:00:00.000Z"
    }
  ]
}
```

**Notes**

* When `active=true`, events are ordered by `StartDate ASC`.
* Otherwise, all events are ordered by `StartDate DESC`.

---

### GET `/user/start/events/:eventId/products`

Products that belong to a specific **sale event**, with pricing and discount info.

**Path params**

* `eventId` — numeric `SaleEventID`.

**Response**

```json
{
  "success": true,
  "products": [
    {
      "ProductID": 61,
      "Name": "Bananas",
      "Brand": "Generic",
      "CategoryID": 2,
      "Price": 0.39,
      "Description": "Fresh yellow bananas",
      "Stock": 120,
      "QuantityValue": 1,
      "QuantityUnit": "lb",
      "ImgName": "bananas-1lb.jpg",
      "DiscountID": 12,
      "DiscountType": "percentage",
      "DiscountValue": 20,
      "Conditions": null,
      "SaleEventID": 5,
      "SaleEventName": "Fall Promo",
      "CategoryName": "Produce"
    }
  ]
}
```

**Errors**

```json
{ "success": false, "message": "Sale event ID is required" }
{ "success": false, "message": "Error fetching products", "error": "DB error message..." }
```

**Notes**

* Results are ordered by `Product.Name ASC`.

---

### GET `/user/start/discounts`

Flat list of **all products that currently have an active discount** (across all active events).

**Response**

```json
{
  "success": true,
  "products": [
    {
      "ProductID": 61,
      "Name": "Bananas",
      "Brand": "Generic",
      "CategoryID": 2,
      "Price": 0.39,
      "Description": "Fresh yellow bananas",
      "Stock": 120,
      "QuantityValue": 1,
      "QuantityUnit": "lb",
      "ImgName": "bananas-1lb.jpg",
      "ImgPath": "/images/products/bananas-1lb.jpg",
      "DiscountID": 12,
      "DiscountType": "percentage",
      "DiscountValue": 20,
      "Conditions": null,
      "SaleEventID": 5,
      "SaleEventName": "Fall Promo",
      "SaleEventDescription": "Seasonal discounts on selected dairy and produce.",
      "CategoryName": "Produce"
    }
  ]
}
```

**Notes**

* Same query as used in `/user/start/active` for `discountedProducts`, but exposed standalone.
* Only includes rows where the associated `SaleEvent` is **active today** (`CURDATE()` between `StartDate` and `EndDate`).

---

### GET `/user/start/events/counts`

Sale events plus a **count of products** attached to each active event.

**Response**

```json
{
  "success": true,
  "saleEvents": [
    {
      "SaleEventID": 5,
      "Name": "Fall Promo",
      "Description": "Seasonal discounts on selected dairy and produce.",
      "StartDate": "2025-10-01T05:00:00.000Z",
      "EndDate": "2025-10-31T05:00:00.000Z",
      "ProductCount": 12
    }
  ]
}
```

**Notes**

* Includes **only active events**:

  ```sql
  WHERE CURDATE() BETWEEN se.StartDate AND se.EndDate
  ```

* `ProductCount` is computed from the number of `Discounts.ProductID` linked to each event (via `SaleEventID`).
* Events are ordered by `StartDate ASC`.

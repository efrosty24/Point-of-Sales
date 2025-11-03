import { useEffect, useState } from "react";
import "./Dashboard.css";
import SearchBar from "./SearchBar";
import api from "../utils/api.js";

function Dashboard() {
  const [recentSales, setRecentSales] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newCustomers, setNewCustomers] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState("");

  useEffect(() => {
    // Fetch recent sales
    api.get("/admin/sales/recent")
      .then(res => setRecentSales(res.data))
      .catch(err => console.error(err));

    // Fetch new customers
    api.get("/admin/customers/recent?limit=5")
      .then(res => setNewCustomers(res.data))
      .catch(err => console.error(err));

    // Fetch low stock products
    api.get("/admin/inventory/low-stock")
      .then(res => setLowStock(res.data))
      .catch(err => console.error(err));
  }, []);

  // --- HANDLE SEARCH ---
  const handleSearch = (query, type) => {
  setSearchType(type);

  api.get(`/admin/search?type=${type}&q=${query}`)
     .then(res => setSearchResults(res.data))
     .catch(err => console.error(err));
};

  const openOrderDetails = (orderId) => {
    api.get(`/admin/orders/${orderId}`)
      .then(res => setSelectedOrder(res.data))
      .catch(err => {
        console.error(err);
        alert("Failed to fetch order details");
      });
  };

  const closeOrderDetails = () => setSelectedOrder(null);

  const formatCurrency = (val) => (typeof val === "number" ? val.toFixed(2) : "0.00");

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard</h1>

      {/* --- SEARCH BAR --- */}
      <SearchBar onSearch={handleSearch} />

      {searchResults.length > 0 && (
        <div className="search-results" style={{ marginBottom: "20px" }}>
          <h2>Search Results</h2>

          {searchType === "orders" && (
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total ($)</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(order => {
                  const isPending = order.Status?.toLowerCase() === "pending";
                  return (
                    <tr key={order.OrderID} className={isPending ? "pending-order" : ""}>
                      <td>{order.OrderID}</td>
                      <td>{order.CustomerFirst || "Guest"} {order.CustomerLast || ""}</td>
                      <td>{order.Total}</td>
                      <td>{order.DatePlaced ? new Date(order.DatePlaced).toLocaleString() : "N/A"}</td>
                      <td>
                        <span className={`badge ${isPending ? "pending" : "completed"}`}>
                          {order.Status || "N/A"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {searchType === "customers" && (
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(customer => (
                  <tr key={customer.CustomerID}>
                    <td>{customer.CustomerID}</td>
                    <td>{customer.FirstName} {customer.LastName}</td>
                    <td>{customer.Phone || "N/A"}</td>
                    <td>{customer.Email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {searchType === "products" && (
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Brand</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(p => (
                  <tr key={p.ProductID} className={p.Stock <= p.ReorderThreshold ? "low-stock-row" : ""}>
                    <td>{p.ProductID}</td>
                    <td>{p.Name} {p.Stock <= p.ReorderThreshold && <span className="low-stock-badge">LOW</span>}</td>
                    <td>{p.Price}</td>
                    <td>{p.Brand}</td>
                    <td>{p.Stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* --- RECENT SALES --- */}

      <h2 className="dashboard-title">Recent Orders</h2>
      {recentSales.length === 0 ? <p>No recent sales</p> : (
        <table className="sales-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total ($)</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentSales.map(order => {
              const isPending = order.Status?.toLowerCase() === "pending";
              return (
                <tr key={order.OrderID} className={isPending ? "pending-order" : ""} 
                    onClick={() => openOrderDetails(order.OrderID)} style={{ cursor: "pointer" }}>
                  <td>{order.OrderID}</td>
                  <td>{order.FirstName || "Guest"} {order.LastName || ""}</td>
                  <td>${formatCurrency(order.Total)}</td>
                  <td>{order.DatePlaced ? new Date(order.DatePlaced).toLocaleString() : "N/A"}</td>
                  <td><span className={`badge ${isPending ? "pending" : "completed"}`}>{order.Status || "N/A"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* --- NEW CUSTOMERS --- */}
      <h2 className="dashboard-title" style={{ marginTop: 40 }}>New Customers</h2>
      {newCustomers.length === 0 ? <p>No new customers</p> : (
        <table className="sales-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {newCustomers.map(c => (
              <tr key={c.CustomerID}>
                <td>{c.CustomerID}</td>
                <td>{c.FirstName} {c.LastName}</td>
                <td>{c.Phone || "N/A"}</td>
                <td>{c.Email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* --- LOW STOCK --- */}
      <h2 className="dashboard-title" style={{ marginTop: 40 }}>Low Stock Alerts</h2>
      {lowStock.length === 0 ? <p>No low stock products</p> : (
        <table className="sales-table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Name</th>
              <th>Stock</th>
              <th>Reorder Threshold</th>
              <th>Supplier</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map(p => (
              <tr key={p.ProductID} className={p.Stock <= p.ReorderThreshold ? "low-stock-row" : ""}>
                <td>{p.ProductID}</td>
                <td>{p.Name} {p.Stock <= p.ReorderThreshold && <span className="low-stock-badge">LOW</span>}</td>
                <td>{p.Stock}</td>
                <td>{p.ReorderThreshold}</td>
                <td>{p.SupplierName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* --- ORDER MODAL --- */}
      {selectedOrder && selectedOrder.header && (
        <div className="order-modal" onClick={closeOrderDetails}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeOrderDetails}>×</button>
            <h2>Order #{selectedOrder.header.OrderID}</h2>
            <p>Customer: {selectedOrder.header.CustomerFirst || "Guest"} {selectedOrder.header.CustomerLast || ""}</p>

            <table className="sales-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price ($)</th>
                  <th>Line Total ($)</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map(item => {
                  const qty = Number(item.Quantity) || 0;
                  const price = Number(item.Price) || 0;
                  const lineTotal = qty * price;
                  return (
                    <tr key={item.ProductID}>
                      <td>{item.Name || "N/A"}</td>
                      <td>{qty}</td>
                      <td>${formatCurrency(price)}</td>
                      <td>${formatCurrency(lineTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: "right" }}><strong>Total:</strong></td>
                  <td>
                    <strong>
                      ${selectedOrder.items?.reduce((sum, item) => sum + (Number(item.Price) || 0) * (Number(item.Quantity) || 0), 0).toFixed(2)}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

import { useEffect, useState } from "react";
import "./Dashboard.css";
import SearchBar from "./SearchBar";
import api from "../utils/api.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Label,
} from "recharts";
import { FaDollarSign, FaShoppingCart, FaUsers, FaChartLine } from "react-icons/fa";

function Dashboard() {
  const [recentSales, setRecentSales] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newCustomers, setNewCustomers] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState("");

  // Chart Data
  const [hourlySales, setHourlySales] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);

  useEffect(() => {
    api.get("/admin/sales/recent").then(res => setRecentSales(res.data)).catch(console.error);
    api.get("/admin/customers/recent?limit=5").then(res => setNewCustomers(res.data)).catch(console.error);
    api.get("/admin/inventory/low-stock").then(res => setLowStock(res.data)).catch(console.error);
    api.get("/admin/sales/hourly").then(res => setHourlySales(res.data)).catch(console.error);
    api.get("/admin/sales/daily").then(res => setDailySales(res.data)).catch(console.error);
    api.get("/admin/sales/monthly").then(res => setMonthlySales(res.data)).catch(console.error);
  }, []);

  const handleSearch = (query, type) => {
    setSearchType(type);
    api.get(`/admin/search?type=${type}&q=${query}`)
      .then(res => setSearchResults(res.data))
      .catch(console.error);
  };

  const openOrderDetails = (orderId) => {
    api.get(`/admin/orders/${orderId}`)
      .then(res => setSelectedOrder(res.data))
      .catch(() => alert("Failed to fetch order details"));
  };

  const closeOrderDetails = () => setSelectedOrder(null);
  const formatCurrency = (val) => (typeof val === "number" ? val.toFixed(2) : "0.00");

  // --- Compute Sales Report from live data ---
  const totalSales = recentSales.reduce((sum, order) => sum + (Number(order.Total) || 0), 0);
  const totalOrders = recentSales.length;
  const totalCustomers = newCustomers.length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p className="role-label">Admin</p>
      </div>

      {/* --- SALES REPORT CARDS --- */}
      <div className="report-row">
        <div className="report-card">
          <div className="report-icon"><FaDollarSign /></div>
          <div>
            <h4>Total Sales</h4>
            <p>${formatCurrency(totalSales)}</p>
          </div>
        </div>

        <div className="report-card">
          <div className="report-icon"><FaShoppingCart /></div>
          <div>
            <h4>Total Orders</h4>
            <p>{totalOrders}</p>
          </div>
        </div>

        <div className="report-card">
          <div className="report-icon"><FaUsers /></div>
          <div>
            <h4>Total Customers</h4>
            <p>{totalCustomers}</p>
          </div>
        </div>
      </div>

      {/* --- CHARTS --- */}
      <div className="charts-grid">
        <div className="chart-card">
          <h4>Hourly Sales</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={hourlySales.length ? hourlySales : [{ hour: "No Data", total: 0 }]}
              margin={{ top: 10, right: 2, left: 2, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour">
                <Label
                  value="Hour"
                  offset={-5}
                  position="insideBottom"
                  style={{ textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }}
                />
              </XAxis>
              <YAxis>
                <Label
                  value="Sales ($)"
                  angle={-90}
                  position="insideLeft"
                  style={{ textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }}
                />
              </YAxis>
              <Tooltip />
              <Bar dataKey="total" fill="#4caf50" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Daily Sales</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={dailySales.length ? dailySales : [{ date: "No Data", total: 0 }]}
              margin={{ top: 10, right: 2, left: 2, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date">
                <Label
                  value="Day"
                  offset={-5}
                  position="insideBottom"
                  style={{ textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }}
                />
              </XAxis>
              <YAxis>
                <Label
                  value="Sales ($)"
                  angle={-90}
                  position="insideLeft"
                  style={{ textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }}
                />
              </YAxis>
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#388e3c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Monthly Sales Growth</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={monthlySales.length ? monthlySales : [{ month: "No Data", total: 0 }]}
              margin={{ top: 10, right: 2, left: 2, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month">
                <Label
                  value="Month"
                  offset={-5}
                  position="insideBottom"
                  style={{ textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }}
                />
              </XAxis>
              <YAxis>
                <Label
                  value="Sales ($)"
                  angle={-90}
                  position="insideLeft"
                  style={{ textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }}
                />
              </YAxis>
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#2e7d32" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- SEARCH BAR --- */}
      <SearchBar onSearch={handleSearch} />

      {/* --- SEARCH RESULTS --- */}
      {searchResults.length > 0 && (
        <div className="search-results" style={{ marginBottom: "20px" }}>
          <h2>Search Results</h2>
          {/* Orders, Customers, Products tables (same as original code) */}
        </div>
      )}

      {/* --- RECENT ORDERS --- */}
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

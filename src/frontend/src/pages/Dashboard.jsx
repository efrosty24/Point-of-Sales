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
    api.get("/admin/sales/today").then(res => setTodaySales(res.data)).catch(console.error);
    api.get("/admin/sales/charts")
  .then(res => {
    setHourlySales(res.data.hourly || []);
    setDailySales(res.data.daily || []);
    setMonthlySales(res.data.monthly || [
      { month: "Jan", total: 0 },
      { month: "Feb", total: 0 }
    ]); // fallback dummy data
  })
  .catch(console.error);
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

  // --- Compute Today's Sales Report ---
  const today = new Date();
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate();
  };

  const todayOrders = recentSales.filter(order => isToday(order.DatePlaced));
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.Total || 0), 0);
  const todayOrdersCount = todayOrders.length;
  const avgSalePerOrder = todayOrdersCount > 0 ? todaySales / todayOrdersCount : 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p className="role-label">Admin</p>
      </div>

      {/* --- SALES REPORT CARDS --- */}
      <div className="report-row separated-cards">
        <div className="report-card sales-card">
          <div className="report-icon"><FaDollarSign /></div>
          <div className="report-info">
            <h4>Today's Sales</h4>
            <p>${formatCurrency(todaySales)}</p>
          </div>
        </div>

        <div className="report-card orders-card">
          <div className="report-icon"><FaShoppingCart /></div>
          <div className="report-info">
            <h4>Today's Orders</h4>
            <p>{todayOrdersCount}</p>
          </div>
        </div>

        <div className="report-card average-card">
          <div className="report-icon"><FaChartLine /></div>
          <div className="report-info">
            <h4>Average Sale per Order</h4>
            <p>${formatCurrency(avgSalePerOrder)}</p>
          </div>
        </div>
      </div>

      {/* --- CHARTS --- */}
      <div className="charts-grid">
        {/* HOURLY SALES */}
        <div className="chart-card">
          <h4>Hourly Sales</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={hourlySales.length ? hourlySales : Array.from({length:24}, (_,i)=>({hour:`${i}:00`, total:0}))}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#ddd"/>
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: "#555" }} />
              <YAxis tick={{ fontSize: 12, fill: "#555" }} />
              <Tooltip formatter={(value) => `$${value}`} />
              <Bar dataKey="total" fill="#4caf50" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* DAILY SALES */}
        <div className="chart-card">
        <h4>Daily Sales</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={dailySales.length ? dailySales : Array.from({length:7}, (_,i)=> {
              const d = new Date(); 
              d.setDate(d.getDate() - (6-i));
              return { date: d.toISOString(), total: 0 };
            })}
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#ddd"/>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: "#555" }} 
              tickFormatter={(dateStr) => {
                const d = new Date(dateStr);
                return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              }}
            />
            <YAxis tick={{ fontSize: 12, fill: "#555" }} />
            <Tooltip 
              labelFormatter={(label) => {
                const d = new Date(label);
                return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              }}
              formatter={(value) => `$${value}`}
            />
            <Line type="monotone" dataKey="total" stroke="#388e3c" strokeWidth={2} dot={{ r:4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

        {/* MONTHLY SALES */}
        <div className="chart-card">
          <h4>Monthly Sales</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={monthlySales.length ? monthlySales : Array.from({length:12}, (_,i)=>({month:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], total:0}))}
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="4 4" stroke="#ddd"/>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#555" }} />
              <YAxis tick={{ fontSize: 12, fill: "#555" }} />
              <Tooltip formatter={(value) => `$${value}`} />
              <Line type="monotone" dataKey="total" stroke="#2e7d32" strokeWidth={2} dot={{ r:4 }} />
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
              {searchResults.map(order => (
                <tr key={order.OrderID} onClick={() => openOrderDetails(order.OrderID)} style={{ cursor: "pointer" }}>
                  <td>{order.OrderID}</td>
                  <td>{order.FirstName || "Guest"} {order.LastName || ""}</td>
                  <td>${formatCurrency(order.Total)}</td>
                  <td>{order.DatePlaced ? new Date(order.DatePlaced).toLocaleString() : "N/A"}</td>
                  <td><span className={`badge ${order.Status?.toLowerCase() === "pending" ? "pending" : "completed"}`}>{order.Status || "N/A"}</span></td>
                </tr>
              ))}
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
      {searchResults.map(c => (
        <tr key={c.CustomerID}>
          <td>{c.CustomerID}</td>
          <td>{c.FirstName} {c.LastName}</td>
          <td>{c.Phone || "N/A"}</td>
          <td>{c.Email || "N/A"}</td>
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
        <th>Price ($)</th>
        <th>Stock</th>
      </tr>
    </thead>
    <tbody>
      {searchResults.map(p => (
        <tr key={p.ProductID}>
          <td>{p.ProductID}</td>
          <td>{p.Name}</td>
          <td>${formatCurrency(p.Price)}</td>
          <td>{p.Stock}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}

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
                    <td colSpan={3} style={{ textAlign: "right" }}><strong>Subtotal:</strong></td>
                    <td>
                      <strong>${formatCurrency(selectedOrder.total)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ textAlign: "right" }}><strong>Tax:</strong></td>
                    <td>
                      <strong>${formatCurrency(Number(selectedOrder.header.Tax || 0))}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ textAlign: "right" }}><strong>Grand Total:</strong></td>
                    <td>
                      <strong>${formatCurrency(selectedOrder.total + (Number(selectedOrder.header.Tax) || 0))}</strong>
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

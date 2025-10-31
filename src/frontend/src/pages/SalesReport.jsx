import { useEffect, useState } from "react";
import "./SalesReport.css";
import api from "../utils/api.js";

function SalesReport() {
  const [summary, setSummary] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [byCategory, setByCategory] = useState([]);

  useEffect(() => {
    // Fetch sales summary
    api
      .get("/admin/sales/summary")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        setSummary(data || {});
      })
      .catch((err) => console.error("Error fetching summary:", err));

    // Fetch top products
    api
      .get("/admin/sales/top-products", { params: { limit: 10 } })
      .then((res) => setTopProducts(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Error fetching top products:", err));

    // Fetch revenue by category
    api
      .get("/admin/sales/by-category")
      .then((res) => setByCategory(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Category revenue error:", err));
  }, []);

  const formatCurrency = (val) =>
    val !== undefined && !isNaN(val) ? parseFloat(val).toFixed(2) : "0.00";


  const categoryRevenueArray = Object.entries(
    byCategory.reduce((acc, c) => {
      const revenue = parseFloat(c.revenue) || 0;
      if (acc[c.CategoryName]) acc[c.CategoryName] += revenue;
      else acc[c.CategoryName] = revenue;
      return acc;
    }, {})
  ).map(([name, revenue]) => ({ CategoryName: name, Revenue: revenue }));

  return (
    <div className="sales-report-container">
      <h1>Sales Report</h1>

      {/* Summary cards */}
      <div className="cards-container">
        <div className="card">
          <h3>Total Sales</h3>
          <p>${formatCurrency(summary.revenue)}</p>
        </div>
        <div className="card">
          <h3>Total Orders</h3>
          <p>{summary.orders || 0}</p>
        </div>
        <div className="card">
          <h3>Average Ticket</h3>
          <p>${formatCurrency(summary.avg_ticket)}</p>
        </div>
      </div>

      {/* Top Products Table */}
      <h2>Top Products</h2>
      <table className="sales-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Units Sold</th>
            <th>Revenue ($)</th>
          </tr>
        </thead>
        <tbody>
          {topProducts.length > 0 ? (
            topProducts.map((p) => (
              <tr key={p.ProductID}>
                <td>{p.Name}</td>
                <td>{p.units}</td>
                <td>${formatCurrency(p.revenue)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No top products data</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Revenue by Category Table */}
      <div style={{ height: "20px" }}></div>
      <h2>Revenue by Category</h2>
      <table className="sales-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Revenue ($)</th>
          </tr>
        </thead>
        <tbody>
          {categoryRevenueArray.length > 0 ? (
            categoryRevenueArray.map((c, idx) => (
              <tr key={idx}>
                <td>{c.CategoryName}</td>
                <td>${formatCurrency(c.Revenue)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">No category revenue data</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SalesReport;
import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/admin/sales/recent")
      .then(res => setRecentSales(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Recent Order</h1>
      {recentSales.length === 0 ? (
        <p className="no-sales">No recent sales</p>
      ) : (
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
            {recentSales.map(sale => (
              <tr key={sale.OrderID}>
                <td>{sale.OrderID}</td>
                <td>{sale.FirstName} {sale.LastName}</td>
                <td>{sale.Total}</td>
                <td>{new Date(sale.DatePlaced).toLocaleString()}</td>
                <td>{sale.Status || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Dashboard;

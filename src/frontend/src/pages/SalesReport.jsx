import { useEffect, useState } from "react";
import axios from "axios";
import "./SalesReport.css";

function SalesReport() {
    const [sales, setSales] = useState([]);

    useEffect(() => {
        axios
            .get("http://localhost:3001/api/sales") // match our new backend route
            .then((res) => {
                if (res.data.success) {
                    setSales(res.data.sales);
                }
            })
            .catch((err) => console.error(err));
    }, []);

    // Total amount: sum of Total field for each order
    const totalAmount = sales
        .reduce((sum, s) => sum + parseFloat(s.Total), 0)
        .toFixed(2);

    return (
        <div className="sales-report-container">
            <h1>Sales Report</h1>

            <div className="cards-container">
                <div className="card">
                    <h3>Total Sales</h3>
                    <p>${totalAmount}</p>
                </div>
                <div className="card">
                    <h3>Total Orders</h3>
                    <p>{sales.length}</p>
                </div>
            </div>

            <table className="sales-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Products</th>
                        <th>Total ($)</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map((sale) => (
                        <tr key={sale.OrderID}>
                            <td>{sale.OrderID}</td>
                            <td>
                                {sale.CustomerFirstName} {sale.CustomerLastName}
                            </td>
                            <td>{sale.Products}</td>
                            <td>{sale.Total}</td>
                            <td>{new Date(sale.DatePlaced).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SalesReport;

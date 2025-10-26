import { useEffect, useState } from "react";
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
} from "recharts";
import "./EmpDashboard.css";

export default function EmpDashboard() {
    const user = JSON.parse(localStorage.getItem("user"));

    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        totalItems: 0,
        avgOrderValue: 0,
    });

    const [dailySales, setDailySales] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [recentSales, setRecentSales] = useState([]);

    useEffect(() => {
        // Dummy sales data (past 7 days)
        const dummyDaily = [
            { date: "Oct 17", total: 520 },
            { date: "Oct 18", total: 690 },
            { date: "Oct 19", total: 480 },
            { date: "Oct 20", total: 850 },
            { date: "Oct 21", total: 780 },
            { date: "Oct 22", total: 950 },
            { date: "Oct 23", total: 1030 },
        ];

        // Dummy top-selling products
        const dummyTop = [
            { name: "Milk", sold: 120 },
            { name: "Bananas", sold: 95 },
            { name: "Bread", sold: 90 },
            { name: "Eggs", sold: 75 },
            { name: "Apples", sold: 65 },
        ];

        // Dummy recent transactions
        const dummySales = [
            { id: 5012, date: "2025-10-22", total: 54.25, items: 8 },
            { id: 5013, date: "2025-10-22", total: 86.90, items: 12 },
            { id: 5014, date: "2025-10-23", total: 42.60, items: 6 },
            { id: 5015, date: "2025-10-23", total: 71.80, items: 10 },
            { id: 5016, date: "2025-10-23", total: 97.50, items: 15 },
        ];

        // Calculate summary
        const totalSales = dummySales.reduce((a, b) => a + b.total, 0);
        const totalOrders = dummySales.length;
        const totalItems = dummySales.reduce((a, b) => a + b.items, 0);
        const avgOrderValue = totalSales / totalOrders;

        setStats({ totalSales, totalOrders, totalItems, avgOrderValue });
        setDailySales(dummyDaily);
        setTopProducts(dummyTop);
        setRecentSales(dummySales);
    }, []);

    return (
        <div className="emp-dashboard">
            <div className="emp-header">
                <h2>Welcome, {user?.name || "Employee"}</h2>
                <p>Role: {user?.role || "Cashier"}</p>
            </div>

            <div className="emp-stats">
                <div className="emp-card">
                    <h3>${stats.totalSales.toFixed(2)}</h3>
                    <p>Total Sales</p>
                </div>
                <div className="emp-card">
                    <h3>{stats.totalOrders}</h3>
                    <p>Total Orders</p>
                </div>
                <div className="emp-card">
                    <h3>{stats.totalItems}</h3>
                    <p>Items Sold</p>
                </div>
                <div className="emp-card">
                    <h3>${stats.avgOrderValue.toFixed(2)}</h3>
                    <p>Avg Transaction</p>
                </div>
            </div>

            <div className="charts-section">
                <div className="chart-card">
                    <h3>Daily Sales (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={dailySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="total" stroke="#27ae60" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Top Selling Products</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topProducts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="sold" fill="#2ecc71" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="recent-sales">
                <h3>Recent Transactions</h3>
                <table>
                    <thead>
                    <tr>
                        <th>Sale ID</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Items</th>
                    </tr>
                    </thead>
                    <tbody>
                    {recentSales.map((sale) => (
                        <tr key={sale.id}>
                            <td>#{sale.id}</td>
                            <td>{sale.date}</td>
                            <td>${sale.total.toFixed(2)}</td>
                            <td>{sale.items}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

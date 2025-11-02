import React, { useContext, useEffect, useState } from "react";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { FaDollarSign, FaShoppingCart, FaChartLine } from "react-icons/fa";
import { AuthContext } from "../AuthContext";
import api from "../utils/api"; // axios instance configured with baseURL
import "./EmpDashboard.css";

export default function EmpDashboard() {
    const { user } = useContext(AuthContext);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const res = await api.get(`/employees/${user?.id || 1}/dashboard`);
                setDashboardData(res.data);
            } catch (err) {
                console.error("Error fetching employee dashboard:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, [user]);

    if (loading) return <div className="emp-dashboard">Loading...</div>;
    if (!dashboardData) return <div className="emp-dashboard">No data available.</div>;

    const {
        todaySales,
        totalOrders,
        avgPerOrder,
        hourlySales,
        dailySales,
        monthlySales,
        recentOrders
    } = dashboardData;

    return (
        <div className="emp-dashboard">
            <div className="dashboard-header">
                <h1>Welcome, {user?.name || "Employee"}</h1>
                <p className="role-label">{user?.role || "Cashier"}</p>
            </div>

            <div className="kpi-row">
                <div className="kpi-card">
                    <div className="kpi-icon"><FaDollarSign /></div>
                    <div>
                        <h4>Today's Sales</h4>
                        <p>${todaySales.toFixed(2)}</p>
                        <span className="trend positive">+12%</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon"><FaShoppingCart /></div>
                    <div>
                        <h4>Total Orders</h4>
                        <p>{totalOrders}</p>
                        <span className="trend positive">+8%</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon"><FaChartLine /></div>
                    <div>
                        <h4>Avg. per Order</h4>
                        <p>${avgPerOrder.toFixed(2)}</p>
                        <span className="trend negative">-2%</span>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h4>Hourly Sales</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={hourlySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="sales" stroke="#2e7d32" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h4>Daily Sales</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dailySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="sales" fill="#4caf50" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-card">
                    <h4>Monthly Sales Growth</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="sales" stroke="#388e3c" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="recent-orders-card">
                <h4>Recent Orders</h4>
                <div className="table-wrapper">
                    <table>
                        <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Total ($)</th>
                            <th>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {recentOrders.map((order) => (
                            <tr key={order.id}>
                                <td>{order.id}</td>
                                <td>{order.date}</td>
                                <td>{order.total.toFixed(2)}</td>
                                <td>
                                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                                            {order.status}
                                        </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

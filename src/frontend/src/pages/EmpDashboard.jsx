import React, { useContext, useEffect, useState } from "react";
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label
} from "recharts";
import { FaDollarSign, FaShoppingCart, FaChartLine } from "react-icons/fa";
import { AuthContext } from "../AuthContext";
import api from "../utils/api";
import "./EmpDashboard.css";

export default function EmpDashboard() {
    const { user } = useContext(AuthContext);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboard() {
            if (!user?.id) return;
            try {
                const res = await api.get(`/admin/employees/${user.id}/dashboard`);
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
        todaySales = null,
        totalOrders = null,
        avgPerOrder = null,
        hourlySales = [],
        dailySales = [],
        monthlySales = [],
        recentOrders = []
    } = dashboardData;

    const sortedRecentOrders = [...recentOrders].sort((a, b) => {
        const ta = new Date(a.date).getTime();
        const tb = new Date(b.date).getTime();

        if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) {
            return tb - ta; 
        }
        return (b.id ?? 0) - (a.id ?? 0);
    });

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
                        <p>{todaySales !== null ? `$${Number(todaySales).toFixed(2)}` : "–"}</p>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon"><FaShoppingCart /></div>
                    <div>
                        <h4>Today's Total Orders</h4>
                        <p>{totalOrders !== null ? totalOrders : "–"}</p>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon"><FaChartLine /></div>
                    <div>
                        <h4>Today's Avg. per Order</h4>
                        <p>{avgPerOrder !== null ? `$${Number(avgPerOrder).toFixed(2)}` : "–"}</p>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h4>Hourly Sales</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={hourlySales.length ? hourlySales : [{ hour: "No Data", sales: 0 }]} margin={{ top: 10, right: 2, left: 2, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour">
                                <Label value="Hour" offset={-5} position="insideBottom" style={{textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }} />
                            </XAxis>
                            <YAxis>
                                <Label value="Sales ($)" angle={-90} position="insideLeft" style={{textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }} />
                            </YAxis>
                            <Tooltip />
                            <Line type="monotone" dataKey="sales" stroke="#2e7d32" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h4>Daily Sales</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dailySales.length ? dailySales : [{ day: "No Data", sales: 0 }]} margin={{ top: 10, right: 2, left: 2, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" >
                                <Label value="Day" offset={-7} position="insideBottom" style={{textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }} />
                            </XAxis>
                            <YAxis>
                                <Label value="Sales ($)" angle={-90} position="insideLeft" style={{textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }}/>
                            </YAxis>
                            <Tooltip />
                            <Bar dataKey="sales" fill="#4caf50" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h4>Monthly Sales Growth</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlySales.length ? monthlySales : [{ month: "No Data", sales: 0 }]}  margin={{ top: 10, right: 2, left: 2, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month">
                                <Label value="Month" offset={-5} position="insideBottom" style={{textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }} />
                            </XAxis>
                            <YAxis>
                                <Label value="Sales ($)" angle={-90} position="insideLeft" style={{textAnchor: "middle", fontSize: 12, fill: "#555", fontWeight: 600 }} />
                            </YAxis>
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
                        {sortedRecentOrders.length > 0 ? (
                            sortedRecentOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.id}</td>
                                    <td>{order.date}</td>
                                    <td>{Number(order.total).toFixed(2)}</td>
                                    <td>
                                        <span className={`status-badge ${order.status?.toLowerCase() || ""}`}>
                                            {order.status || "Unknown"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="no-orders">No recent orders</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
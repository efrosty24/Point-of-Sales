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
                // Fix hourly sales: convert UTC timestamps to local hours
                setHourlySales(
                    (res.data.hourly || []).map(h => {
                        const date = new Date(h.timestamp);
                        const localHour = (date.getUTCHours() + date.getTimezoneOffset() / -60 + 24) % 24;
                        return { hour: `${localHour}:00`, total: h.total };
                    })
                );

                // Fix daily sales: convert UTC date to local date
                setDailySales(
                    (res.data.daily || []).map(d => {
                        const date = new Date(d.date);
                        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
                        return { date: localDate.toISOString().split("T")[0], total: d.total };
                    })
                );

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

    const formatCurrency = (val) => {
        const n = Number(val);
        return Number.isFinite(n) ? n.toFixed(2) : "0.00";
    };

    // --- Compute Today's Sales Report ---
    const today = new Date();
    const isToday = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    };

    const todayOrders = recentSales.filter(order => isToday(order.DatePlaced));
    const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.Total || 0), 0);
    const todayOrdersCount = todayOrders.length;
    const avgSalePerOrder = todayOrdersCount > 0 ? todaySales / todayOrdersCount : 0;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
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
                            <Tooltip formatter={(value) => `$${formatCurrency(value)}`} />
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
                                return { date: d.toISOString().split("T")[0], total: 0 };
                            })}
                            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="4 4" stroke="#ddd"/>
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12, fill: "#555" }}
                                tickFormatter={(dateStr) => {
                                    const [year, month, day] = dateStr.split("-");
                                    return `${month}-${day}`;
                                }}
                            />
                            <YAxis tick={{ fontSize: 12, fill: "#555" }} />
                            <Tooltip
                                labelFormatter={(label) => label}
                                formatter={(value) => `$${formatCurrency(value)}`}
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
                            <Tooltip formatter={(value) => `$${formatCurrency(value)}`} />
                            <Line type="monotone" dataKey="total" stroke="#2e7d32" strokeWidth={2} dot={{ r:4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- SEARCH BAR, SEARCH RESULTS, RECENT ORDERS, NEW CUSTOMERS, MODAL --- */}
            {/* Keep all your existing code exactly as-is below */}
            <SearchBar onSearch={handleSearch} />

            {/* ... rest of your component remains unchanged ... */}
        </div>
    );
}

export default Dashboard;

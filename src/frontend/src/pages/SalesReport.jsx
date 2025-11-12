import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "./SalesReport.css";
import api from "../utils/api.js";

function Tabs({ value, onChange, children, idPrefix = "sr" }) {
    const btns = useRef([]);
    const tabs = useMemo(
        () =>
            children
                .filter((c) => c?.type?.displayName === "Tab")
                .map((c) => ({ id: c.props.id, label: c.props.label })),
        [children]
    );

    const onKeyDown = (e) => {
        const i = tabs.findIndex((t) => t.id === value);
        if (i < 0) return;
        let n = i;
        if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        if (n !== i) {
            onChange(tabs[n].id);
            btns.current[n]?.focus();
            e.preventDefault();
        }
    };

    return (
        <div className="tabs">
            <div
                className="tablist"
                role="tablist"
                aria-label="Sales report"
                onKeyDown={onKeyDown}
            >
                {tabs.map((t, idx) => {
                    const selected = value === t.id;
                    return (
                        <button
                            key={t.id}
                            ref={(el) => (btns.current[idx] = el)}
                            role="tab"
                            aria-selected={selected}
                            aria-controls={`${idPrefix}-panel-${t.id}`}
                            id={`${idPrefix}-tab-${t.id}`}
                            tabIndex={selected ? 0 : -1}
                            className={`tab ${selected ? "tab--active" : ""}`}
                            onClick={() => onChange(t.id)}
                            type="button"
                        >
                            {t.label}
                            {selected && <span className="tab-indicator" aria-hidden="true" />}
                        </button>
                    );
                })}
            </div>

            {children
                .filter((c) => c?.type?.displayName === "Tab")
                .map((child) => {
                    const selected = value === child.props.id;
                    return (
                        <section
                            key={child.props.id}
                            role="tabpanel"
                            id={`${idPrefix}-panel-${child.props.id}`}
                            aria-labelledby={`${idPrefix}-tab-${child.props.id}`}
                            hidden={!selected}
                            className="tabpanel"
                        >
                            {selected && child.props.children}
                        </section>
                    );
                })}
        </div>
    );
}

function Tab() { return null; }
Tab.displayName = "Tab";


function useDebounced(value, delay = 450) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}

function SalesReport() {
    const [summary, setSummary] = useState({});
    const [topProducts, setTopProducts] = useState([]);
    const [byCategory, setByCategory] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);

    
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [name, setName] = useState("");
    const debouncedName = useDebounced(name, 500);

    
    const [activeDateRange, setActiveDateRange] = useState("all");

    
    const [activeTab, setActiveTab] = useState("top");

    
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const formatCurrency = (val) =>
        val !== undefined && !isNaN(val) ? parseFloat(val).toFixed(2) : "0.00";

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const categoryRevenueArray = useMemo(() => {
        return Object.entries(
            byCategory.reduce((acc, c) => {
                const revenue = parseFloat(c.revenue) || 0;
                if (acc[c.CategoryName]) acc[c.CategoryName] += revenue;
                else acc[c.CategoryName] = revenue;
                return acc;
            }, {})
        ).map(([name, revenue]) => ({ CategoryName: name, Revenue: revenue }));
    }, [byCategory]);

    
    const filteredTopProducts = useMemo(() => {
        if (!name) return topProducts;
        return topProducts.filter((product) =>
            product.Name.toLowerCase().includes(name.toLowerCase())
        );
    }, [topProducts, name]);

    
    const filteredCategories = useMemo(() => {
        if (!name) return categoryRevenueArray;
        return categoryRevenueArray.filter((category) =>
            category.CategoryName.toLowerCase().includes(name.toLowerCase())
        );
    }, [categoryRevenueArray, name]);

    
    const filteredOrders = useMemo(() => {
        if (!name) return recentOrders;

        const searchLower = name.toLowerCase();

        return recentOrders.filter((order) => {
            
            const orderIdMatch = order.OrderID.toString().includes(searchLower);

            
            const customerName = order.FirstName
                ? `${order.FirstName} ${order.LastName || ''}`.trim().toLowerCase()
                : '';
            const customerMatch = customerName && customerName.includes(searchLower);

            return orderIdMatch || customerMatch;
        });
    }, [recentOrders, name]);

    const quickRange = useCallback((preset) => {
        const now = new Date();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let start = new Date(end);
        if (preset === "today") {
            
        } else if (preset === "7d") {
            start.setDate(end.getDate() - 6);
        } else if (preset === "month") {
            start = new Date(end.getFullYear(), end.getMonth(), 1);
        } else if (preset === "ytd") {
            start = new Date(end.getFullYear(), 0, 1);
        }
        setFromDate(start.toISOString().slice(0, 10));
        setToDate(end.toISOString().slice(0, 10));
        setActiveDateRange(preset);
    }, []);

    const clearFilters = useCallback(() => {
        setFromDate("");
        setToDate("");
        setName("");
        setActiveDateRange("all");
    }, []);

    const applyFilters = useCallback(() => {
        const params = {
            from: fromDate || undefined,
            to: toDate || undefined,
            name: debouncedName || undefined,
        };

        api
            .get("/admin/sales/summary", { params })
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                setSummary(data || {});
            })
            .catch((err) => console.error("Error fetching summary:", err));

        api
            .get("/admin/sales/top-products", { params: { ...params, limit: 10 } })
            .then((res) => setTopProducts(Array.isArray(res.data) ? res.data : []))
            .catch((err) => console.error("Error fetching top products:", err));

        api
            .get("/admin/sales/by-category", { params })
            .then((res) => setByCategory(Array.isArray(res.data) ? res.data : []))
            .catch((err) => console.error("Category revenue error:", err));
    }, [fromDate, toDate, debouncedName]);

    const fetchRecentOrders = useCallback(() => {
        api
            .get("/admin/sales/recent")
            .then((res) => {
                setRecentOrders(Array.isArray(res.data) ? res.data : []);
            })
            .catch((err) => console.error("Error fetching recent orders:", err));
    }, []);

    const openOrderDetails = (orderId) => {
        api
            .get(`/admin/orders/${orderId}`)
            .then((res) => {
                setSelectedOrder(res.data);
                setShowModal(true);
            })
            .catch(() => alert("Failed to fetch order details"));
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
    };

    useEffect(() => {
        applyFilters();
        fetchRecentOrders();
        
    }, []);

    useEffect(() => {
        applyFilters();
    }, [debouncedName, applyFilters]);

    
    const handleDateChange = (type, value) => {
        if (type === "from") {
            setFromDate(value);
        } else {
            setToDate(value);
        }
        setActiveDateRange("custom");
    };

    const hasActiveFilters = fromDate || toDate || name;

    return (
        <div className="sales-report-container">
            <div className="page-header">
                <h1>Reports</h1>
            </div>


            <div className="cards-container">
                <div className="card">
                    <div className="card-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <div className="card-content">
                        <h3>Total Sales</h3>
                        <p>${formatCurrency(summary.revenue)}</p>
                    </div>
                </div>
                <div className="card">
                    <div className="card-icon">
                        <svg width="24" height="24" viewBox="-1.28 -1.28 18.56 18.56" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="none">
                            <g id="SVGRepo_iconCarrier">
                                <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                    <g id="Dribbble-Light-Preview" transform="translate(-382.000000, -7721.000000)" fill="currentColor">
                                        <g id="icons" transform="translate(56.000000, 160.000000)">
                                            <path d="M332,7571 L336,7571 L336,7567 L332,7567 L332,7571 Z M342,7567 L342,7565 L338,7565 L338,7561 L336,7561 L336,7565 L332,7565 L332,7561 L330,7561 L330,7565 L326,7565 L326,7567 L330,7567 L330,7571 L326,7571 L326,7573 L330,7573 L330,7577 L332,7577 L332,7573 L336,7573 L336,7577 L338,7577 L338,7573 L342,7573 L342,7571 L338,7571 L338,7567 L342,7567 Z" id="number_sign-[#110]"></path>
                                        </g>
                                    </g>
                                </g>
                            </g>
                        </svg>
                    </div>
                    <div className="card-content">
                        <h3>Total Orders</h3>
                        <p>{summary.orders || 0}</p>
                    </div>
                </div>
                <div className="card">
                    <div className="card-icon">
                        <svg fill="currentColor" width="24" height="24" viewBox="-1.28 -1.28 18.56 18.56" xmlns="http://www.w3.org/2000/svg">
                            <g id="SVGRepo_iconCarrier">
                                <path d="M4,8.39l2,2.09L8.39,7.76l2.69,2.75,4.7-5.89L14.22,3.38l-3.3,4.11L8.29,4.81,6,7.52l-1.91-2L.29,9.29l1.42,1.42ZM0,12.3v1.4H16V12.3Z"></path>
                            </g>
                        </svg>
                    </div>
                    <div className="card-content">
                        <h3>Average Order Value</h3>
                        <p>${formatCurrency(summary.avg_ticket)}</p>
                    </div>
                </div>
            </div>


            <div className="filter-bar">
                <div className="filter-bar-content">
                    <div className="filter-bar-row">

                        <div className="quick-date-selector">
                            <button
                                className={`date-chip ${activeDateRange === 'all' ? 'date-chip--active' : ''}`}
                                onClick={() => {
                                    setFromDate("");
                                    setToDate("");
                                    setActiveDateRange("all");
                                }}
                            >
                                All Time
                            </button>
                            <button
                                className={`date-chip ${activeDateRange === 'today' ? 'date-chip--active' : ''}`}
                                onClick={() => quickRange("today")}
                            >
                                Today
                            </button>
                            <button
                                className={`date-chip ${activeDateRange === '7d' ? 'date-chip--active' : ''}`}
                                onClick={() => quickRange("7d")}
                            >
                                7D
                            </button>
                            <button
                                className={`date-chip ${activeDateRange === 'month' ? 'date-chip--active' : ''}`}
                                onClick={() => quickRange("month")}
                            >
                                MTD
                            </button>
                            <button
                                className={`date-chip ${activeDateRange === 'ytd' ? 'date-chip--active' : ''}`}
                                onClick={() => quickRange("ytd")}
                            >
                                YTD
                            </button>
                        </div>


                        <div className="date-range-group">
                            <div className="input-wrapper">
                                <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M10.6667 1.33333V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M5.33333 1.33333V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M2 6.66667H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => handleDateChange("from", e.target.value)}
                                    aria-label="Start date"
                                />
                            </div>
                            <span className="date-separator">→</span>
                            <div className="input-wrapper">
                                <svg className="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M10.6667 1.33333V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M5.33333 1.33333V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M2 6.66667H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => handleDateChange("to", e.target.value)}
                                    aria-label="End date"
                                />
                            </div>
                        </div>


                        <div className="search-wrapper">
                            <svg className="search-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M8.25 14.25C11.5637 14.25 14.25 11.5637 14.25 8.25C14.25 4.93629 11.5637 2.25 8.25 2.25C4.93629 2.25 2.25 4.93629 2.25 8.25C2.25 11.5637 4.93629 14.25 8.25 14.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M15.75 15.75L12.4875 12.4875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search Products, Categories, Order ID's"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                aria-label="Search"
                            />
                            {name && (
                                <button
                                    className="clear-search"
                                    onClick={() => setName("")}
                                    aria-label="Clear search"
                                >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                </button>
                            )}
                        </div>


                        {hasActiveFilters && (
                            <button className="btn-clear" onClick={clearFilters}>
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>


            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tab id="top" label="Top Products">
                    <div className="tab-content">
                        <h2>Top Products</h2>
                        <div className="table-wrapper">
                            <table className="sales-table">
                                <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Units Sold</th>
                                    <th>Revenue ($)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredTopProducts.length ? (
                                    filteredTopProducts.map((p) => (
                                        <tr key={p.ProductID}>
                                            <td>{p.Name}</td>
                                            <td>{p.units}</td>
                                            <td>${formatCurrency(p.revenue)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No products found</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Tab>

                <Tab id="category" label="By Category">
                    <div className="tab-content">
                        <h2>Revenue by Category</h2>
                        <div className="table-wrapper">
                            <table className="sales-table">
                                <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Revenue ($)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredCategories.length ? (
                                    filteredCategories.map((c, idx) => (
                                        <tr key={idx}>
                                            <td>{c.CategoryName}</td>
                                            <td>${formatCurrency(c.Revenue)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2">No categories found</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Tab>

                <Tab id="orders" label="Recent Orders">
                    <div className="tab-content">
                        <h2>Recent Orders</h2>
                        <div className="table-wrapper">
                            <table className="sales-table sales-table--clickable">
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
                                {filteredOrders.length ? (
                                    filteredOrders.map((order) => {
                                        const isPending = !order.Status || order.Status.toLowerCase() === 'pending';
                                        const customerName = order.FirstName
                                            ? `${order.FirstName} ${order.LastName || ''}`.trim()
                                            : 'Guest';

                                        return (
                                            <tr
                                                key={order.OrderID}
                                                onClick={() => openOrderDetails(order.OrderID)}
                                                className="clickable-row"
                                            >
                                                <td>#{order.OrderID}</td>
                                                <td>{customerName}</td>
                                                <td>${formatCurrency(order.Total)}</td>
                                                <td>{formatDate(order.DatePlaced)}</td>
                                                <td>
                                                    <span className={`badge ${isPending ? "pending" : "completed"}`}>
                                                        {order.Status || "N/A"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5">No orders found</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Tab>
            </Tabs>


            {showModal && selectedOrder && selectedOrder.header && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Order #{selectedOrder.header.OrderID}</h3>
                            <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="order-info">
                                <p>
                                    <strong>Customer:</strong> {
                                    selectedOrder.header.CustomerFirst
                                        ? `${selectedOrder.header.CustomerFirst} ${selectedOrder.header.CustomerLast || ''}`.trim()
                                        : 'Guest'
                                }
                                </p>
                                <p><strong>Date:</strong> {formatDate(selectedOrder.header.DatePlaced)}</p>
                            </div>

                            <h4>Order Items</h4>
                            <table className="modal-table">
                                <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Qty</th>
                                    <th>Price ($)</th>
                                    <th>Line Total ($)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                    selectedOrder.items.map((item, idx) => (
                                        <tr key={item.ProductID || idx}>
                                            <td>{item.Name}</td>
                                            <td>{item.Quantity}</td>
                                            <td>${formatCurrency(item.Price)}</td>
                                            <td>${formatCurrency(item.LineTotal)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4">No items found</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>

                            <div className="order-totals">
                                <div className="total-row">
                                    <span>Subtotal:</span>
                                    <span>${formatCurrency(selectedOrder.total)}</span>
                                </div>
                                <div className="total-row">
                                    <span>Tax:</span>
                                    <span>${formatCurrency(selectedOrder.header.Tax)}</span>
                                </div>
                                <div className="total-row total-row--grand">
                                    <span>Grand Total:</span>
                                    <span>${formatCurrency(selectedOrder.header.Total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SalesReport;

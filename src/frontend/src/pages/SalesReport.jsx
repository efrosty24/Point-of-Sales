import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "./SalesReport.css";
import api from "../utils/api.js";
import { useAlert } from '../AlertContext';


const exportToCSV = () => {
    let rows = [];
    let headers = [];
    let dataToExport = [];

    switch (activeTab) {
        case "products":
            headers = ["Product", "Brand", "Category", "Supplier", "Units Sold", "Revenue", "Avg Price", "Stock Status"];
            dataToExport = filteredProductPerformance;
            dataToExport.forEach(p => {
                rows.push([p.ProductName, p.Brand, p.CategoryName, p.SupplierName, p.UnitsSold, p.TotalRevenue, p.AvgPrice, p.StockStatus]);
            });
            break;
        case "customers":
            headers = ["Customer", "Email", "Orders", "Total Spent", "Avg Order", "Items Bought", "Loyalty Points", "Last Purchase"];
            dataToExport = filteredCustomerAnalytics;
            dataToExport.forEach(c => {
                rows.push([c.CustomerName, c.Email, c.TotalOrders, c.TotalSpent, c.AvgOrderValue, c.TotalItemsBought, c.LoyaltyPoints, c.LastPurchaseDate]);
            });
            break;
        case "categories":
            headers = ["Category", "Orders", "Products", "Units Sold", "Revenue", "Avg per Sale", "Employees", "Customers"];
            dataToExport = filteredCategoryPerformance;
            dataToExport.forEach(c => {
                rows.push([c.CategoryName, c.OrderCount, c.UniqueProducts, c.TotalUnitsSold, c.TotalRevenue, c.AvgRevenuePerSale, c.EmployeesInvolved, c.UniqueCustomers]);
            });
            break;
        case "trends":
            headers = ["Day", "Date", "Hour", "Orders", "Customers", "Revenue", "Avg Order", "Items/Order"];
            dataToExport = filteredSalesTrends;
            dataToExport.forEach(t => {
                rows.push([t.DayOfWeek, t.SaleDate, t.HourOfDay, t.OrderCount, t.UniqueCustomers, t.TotalRevenue, t.AvgOrderValue, t.AvgItemsPerOrder]);
            });
            break;
        case "orders":
            headers = ["Order ID", "Customer", "Total", "Date", "Status"];
            dataToExport = filteredOrders;
            dataToExport.forEach(o => {
                const customerName = o.FirstName ? `${o.FirstName} ${o.LastName || ''}` : 'Guest';
                rows.push([o.OrderID, customerName, o.Total, o.DatePlaced, o.Status]);
            });
            break;
        case "employees":
            headers = ["Employee", "Role", "Orders", "Items Sold", "Revenue", "Avg Order", "Products"];
            dataToExport = filteredEmployees;
            dataToExport.forEach(emp => {
                rows.push([`${emp.FirstName} ${emp.LastName}`, emp.Role, emp.TotalOrders, emp.TotalItemsSold, emp.TotalRevenue, emp.AvgOrderValue, emp.UniqueProducts]);
            });
            break;
        default:
            return;
    }

    let csvContent = [headers.join(",")].concat(rows.map(r => r.join(","))).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
};

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

    const { showSuccess, showError } = useAlert();
    const [summary, setSummary] = useState({});
    const [productPerformance, setProductPerformance] = useState([]);
    const [customerAnalytics, setCustomerAnalytics] = useState([]);
    const [categoryPerformance, setCategoryPerformance] = useState([]);
    const [salesTrends, setSalesTrends] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [name, setName] = useState("");
    const debouncedName = useDebounced(name, 500);

    const [activeDateRange, setActiveDateRange] = useState("all");
    const [activeTab, setActiveTab] = useState("products");

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeeOrders, setEmployeeOrders] = useState([]);

    
    const [productPage, setProductPage] = useState(1);
    const [customerPage, setCustomerPage] = useState(1);
    const [categoryPage, setCategoryPage] = useState(1);
    const [trendsPage, setTrendsPage] = useState(1);
    const [ordersPage, setOrdersPage] = useState(1);
    const [employeesPage, setEmployeesPage] = useState(1);

    const ITEMS_PER_PAGE = 10;

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

    
    const Pagination = ({ currentPage, setCurrentPage, totalItems }) => {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

        if (totalPages <= 1) return null;

        return (
            <div className="pagination">
                <button
                    className={`page-arrow ${currentPage === 1 ? "is-disabled" : ""}`}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                >
                    &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                        key={p}
                        className={`page-num ${p === currentPage ? "is-active" : ""}`}
                        onClick={() => setCurrentPage(p)}
                    >
                        {p}
                    </button>
                ))}
                <button
                    className={`page-arrow ${currentPage === totalPages ? "is-disabled" : ""}`}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    &gt;
                </button>
            </div>
        );
    };

    
    const filteredProductPerformance = useMemo(() => {
        if (!name) return productPerformance;
        const searchLower = name.toLowerCase();
        return productPerformance.filter((p) =>
            p.ProductName.toLowerCase().includes(searchLower) ||
            p.CategoryName.toLowerCase().includes(searchLower) ||
            p.Brand.toLowerCase().includes(searchLower)
        );
    }, [productPerformance, name]);

    const filteredCustomerAnalytics = useMemo(() => {
        if (!name) return customerAnalytics;
        const searchLower = name.toLowerCase();
        return customerAnalytics.filter((c) =>
            c.CustomerName.toLowerCase().includes(searchLower) ||
            (c.Email && c.Email.toLowerCase().includes(searchLower))
        );
    }, [customerAnalytics, name]);

    const filteredCategoryPerformance = useMemo(() => {
        if (!name) return categoryPerformance;
        return categoryPerformance.filter((c) =>
            c.CategoryName.toLowerCase().includes(name.toLowerCase())
        );
    }, [categoryPerformance, name]);

    const filteredSalesTrends = useMemo(() => {
        if (!name) return salesTrends;
        return salesTrends.filter((t) =>
            t.DayOfWeek.toLowerCase().includes(name.toLowerCase())
        );
    }, [salesTrends, name]);

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

    const filteredEmployees = useMemo(() => {
        if (!name) return employees;
        const searchLower = name.toLowerCase();
        return employees.filter((emp) => {
            const fullName = `${emp.FirstName} ${emp.LastName}`.toLowerCase();
            const roleMatch = emp.Role.toLowerCase().includes(searchLower);
            return fullName.includes(searchLower) || roleMatch;
        });
    }, [employees, name]);

    
    const paginatedProducts = useMemo(() => {
        const start = (productPage - 1) * ITEMS_PER_PAGE;
        return filteredProductPerformance.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProductPerformance, productPage]);

    const paginatedCustomers = useMemo(() => {
        const start = (customerPage - 1) * ITEMS_PER_PAGE;
        return filteredCustomerAnalytics.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCustomerAnalytics, customerPage]);

    const paginatedCategories = useMemo(() => {
        const start = (categoryPage - 1) * ITEMS_PER_PAGE;
        return filteredCategoryPerformance.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCategoryPerformance, categoryPage]);

    const paginatedTrends = useMemo(() => {
        const start = (trendsPage - 1) * ITEMS_PER_PAGE;
        return filteredSalesTrends.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredSalesTrends, trendsPage]);

    const paginatedOrders = useMemo(() => {
        const start = (ordersPage - 1) * ITEMS_PER_PAGE;
        return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredOrders, ordersPage]);

    const paginatedEmployees = useMemo(() => {
        const start = (employeesPage - 1) * ITEMS_PER_PAGE;
        return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEmployees, employeesPage]);

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
        
        setProductPage(1);
        setCustomerPage(1);
        setCategoryPage(1);
        setTrendsPage(1);
        setOrdersPage(1);
        setEmployeesPage(1);
    }, []);

    
    const applyFilters = useCallback(() => {
        const params = {
            from: fromDate || undefined,
            to: toDate || undefined,
            limit: 1000 
        };

        
        api.get("/admin/sales/summary", { params })
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data[0] : res.data;
                setSummary(data || {});
            })
            .catch((err) => console.error("Error fetching summary:", err));

        
        api.get("/admin/sales/product-performance", { params })
            .then((res) => {
                setProductPerformance(Array.isArray(res.data) ? res.data : []);
                setProductPage(1); 
            })
            .catch((err) => console.error("Error fetching product performance:", err));

        
        api.get("/admin/sales/customer-analytics", { params })
            .then((res) => {
                setCustomerAnalytics(Array.isArray(res.data) ? res.data : []);
                setCustomerPage(1);
            })
            .catch((err) => console.error("Error fetching customer analytics:", err));

        
        api.get("/admin/sales/category-performance", { params })
            .then((res) => {
                setCategoryPerformance(Array.isArray(res.data) ? res.data : []);
                setCategoryPage(1);
            })
            .catch((err) => console.error("Error fetching category performance:", err));

        
        api.get("/admin/sales/trends", { params })
            .then((res) => {
                setSalesTrends(Array.isArray(res.data) ? res.data : []);
                setTrendsPage(1);
            })
            .catch((err) => console.error("Error fetching sales trends:", err));


        api.get("/admin/employees/performance", { params })
            .then((res) => {
                setEmployees(Array.isArray(res.data) ? res.data : []);
                setEmployeesPage(1);
                console.log(res);
            })
            .catch((err) => console.error("Error fetching employee performance:", err));

    }, [fromDate, toDate]);

    const fetchRecentOrders = useCallback(() => {
        const params = {
            from: fromDate || undefined,
            to: toDate || undefined,
            limit: 1000
        };

        api.get("/admin/sales/recent", { params })
            .then((res) => {
                setRecentOrders(Array.isArray(res.data) ? res.data : []);
                setOrdersPage(1);
            })
            .catch((err) => console.error("Error fetching recent orders:", err));
    }, [fromDate, toDate]);

    const fetchEmployeePerformance = useCallback(() => {
        const params = {
            from: fromDate || undefined,
            to: toDate || undefined,
        };

        api.get("/admin/employees/performance", { params })
            .then((res) => {
                setEmployees(Array.isArray(res.data) ? res.data : []);
                setEmployeesPage(1);
                console.log(res);
            })
            .catch((err) => console.error("Error fetching employee performance:", err));
    }, [fromDate, toDate]);

    async function handleEmployeeClick(employee) {
        setSelectedProduct(null);
        setSelectedCustomer(null);
        setSelectedCategory(null);
        setSelectedTrendRow(null);

        if (selectedEmployee?.EmployeeID === employee.EmployeeID) {
            setSelectedEmployee(null);
            setEmployeeOrders([]);
            return;
        }

        setSelectedEmployee(employee);
        setEmployeeOrders([]);

        try {
            const from = fromDate || undefined;
            const to = toDate || undefined;
            const params = {
                employeeId: employee.EmployeeID
            };

            if (from) {
                params.from = from;
            }

            if (to) {
                params.to = to;
            }

            const res = await api.get("/admin/orders", { params });
            const data = res.data;

            setEmployeeOrders(data || []);
        } catch (err) {
            console.error("Failed to fetch employee orders:", err);
            setEmployeeOrders([]);
        }
    }

    const openOrderDetails = (orderId) => {
        api.get(`/admin/orders/${orderId}`)
            .then((res) => {
                setSelectedOrder(res.data);
                setShowModal(true);
            })
            .catch(() => showError("Failed to fetch order details"));
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
    };

    useEffect(() => {
        applyFilters();
        fetchRecentOrders();
        fetchEmployeePerformance();
        
    }, []);

    useEffect(() => {
        applyFilters();
    }, [debouncedName, applyFilters]);

    useEffect(() => {
        if (fromDate || toDate) {
            applyFilters();
            fetchRecentOrders();
            fetchEmployeePerformance();
        }
    }, [fromDate, toDate, applyFilters, fetchRecentOrders, fetchEmployeePerformance]);

    
    useEffect(() => {
        setProductPage(1);
        setCustomerPage(1);
        setCategoryPage(1);
        setTrendsPage(1);
        setOrdersPage(1);
        setEmployeesPage(1);
    }, [name]);

    const handleDateChange = (type, value) => {
        if (type === "from") {
            setFromDate(value);
        } else {
            setToDate(value);
        }
        setActiveDateRange("custom");
    };

    const hasActiveFilters = fromDate || toDate || name;

    const exportToCSV = (data, filename = "export.csv") => {
        if (!data || !data.length) return;

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(","), 
            ...data.map(row =>
                headers.map(field => {
                    const val = row[field] ?? "";
                    return `"${String(val).replace(/"/g, '""')}"`; 
                }).join(",")
            )
        ];

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productOrders, setProductOrders] = useState([]);

    const handleProductClick = (product) => {
        console.log("Clicked product:", product);


        if (selectedProduct?.ProductID === product.ProductID) {
            setSelectedProduct(null);
            setProductOrders([]);
            return;
        }
        setSelectedCustomer(null);
        setSelectedCategory(null);
        setSelectedTrendRow(null);
        setSelectedEmployee(null);

        setSelectedProduct(product);

        const from = fromDate || null;
        const to = toDate || null;

        const params = {};
        if (from) {
            params.from = from;
        }
        if (to) {
            params.to = to;
        }

        api.get(`/admin/orders/by-product/${product.ProductID}`, { params })
            .then(res => {
                console.log("Orders response:", res.data);
                setProductOrders(res.data);
            })
            .catch(err => {
                console.error("Failed to fetch orders by product:", err);
                setProductOrders([]);
            });
    };

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);

    async function handleCustomerClick(customer) {
        if (selectedCustomer?.CustomerID === customer.CustomerID) {
            setSelectedCustomer(null);
            setCustomerOrders([]);
            return;
        }

        setSelectedProduct(null);
        setSelectedCategory(null);
        setSelectedTrendRow(null);
        setSelectedEmployee(null);

        setSelectedCustomer(customer);

        try {
            const from = fromDate || null;
            const to = toDate || null;

            const params = {
            };
            if (from) {
                params.from = from;
            }
            if (to) {
                params.to = to;
            }

            const res = await api.get(`/admin/orders/by-customer/${customer.CustomerID}`, { params });
            setCustomerOrders(res.data);
        } catch (err) {
            console.error("Failed loading customer orders", err);
            setCustomerOrders([]);
        }
    }

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryTransactions, setCategoryTransactions] = useState([]);

    const categoryOrderItemCounts = useMemo(() => {
        const map = {};
        categoryTransactions.forEach((tx) => {
            const id = tx.OrderID;
            if (!id) return;
            const q = Number(tx.Quantity) || 0;
            map[id] = (map[id] || 0) + q;
        });
        return map;
    }, [categoryTransactions]);

    const [expandedCategoryOrders, setExpandedCategoryOrders] = useState(new Set());

    const groupedCategoryOrders = useMemo(() => {
        const map = {};
        categoryTransactions.forEach((tx) => {
            const id = tx.OrderID ?? `order-${Math.random()}`;
            if (!map[id]) {
                map[id] = {
                    OrderID: tx.OrderID,
                    DatePlaced: tx.DatePlaced,
                    CustomerName: tx.CustomerName,
                    EmployeeName: tx.EmployeeName,
                    Total: tx.Total ?? tx.Subtotal ?? 0,
                    Status: tx.Status,
                    items: [],
                    itemsCount: 0,
                };
            }
            map[id].items.push(tx);
            map[id].itemsCount += Number(tx.Quantity) || 0;
            // keep most recent DatePlaced and Total if present
            if (tx.DatePlaced && (!map[id].DatePlaced || new Date(tx.DatePlaced) > new Date(map[id].DatePlaced))) {
                map[id].DatePlaced = tx.DatePlaced;
            }
            if (tx.Total) map[id].Total = tx.Total;
        });

        // Return array sorted by date desc
        return Object.values(map).sort((a, b) => new Date(b.DatePlaced) - new Date(a.DatePlaced));
    }, [categoryTransactions]);

    const toggleCategoryOrder = (orderId) => {
        setExpandedCategoryOrders((prev) => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
            return next;
        });
    };

    const handleCategoryClick = async (category) => {
        console.log('handleCategoryClick called for', category);

        // 1. Toggle behavior: Close if the same category is clicked again
        if (selectedCategory?.CategoryID === category.CategoryID) {
            setSelectedCategory(null);
            setCategoryTransactions([]);
            return;
        }

        // 2. Clear all other drill-down selections
        setSelectedProduct(null);
        setSelectedCustomer(null);
        setSelectedTrendRow(null);
        setSelectedEmployee(null);

        // 3. Set the new selection
        setSelectedCategory(category);

        try {
            // 4. Construct parameters robustly from state
            // Use the latest state for filtering
            const from = fromDate || null;
            const to = toDate || null;

            const params = {};
            if (from) {
                params.from = from;
            }
            if (to) {
                params.to = to;
            }

            console.log('Calling category transactions API with params', params);

            // API Endpoint for Category Transactions
            const res = await api.get(
                `/admin/sales/category/${category.CategoryID}/transactions`,
                { params }
            );

            console.log('Category transactions response', res && res.data);
            setCategoryTransactions(Array.isArray(res.data) ? res.data : []);

            // You should now also add a rendering block for categoryTransactions,
            // similar to what you have for employeeOrders or productOrders,
            // inside the <Tab id="categories"> section of your JSX.
        } catch (err) {
            console.error("Failed loading category transactions", err);
            // showError("Failed to load category transactions."); // Assuming you have an alert context
            setCategoryTransactions([]);
        }
    };

    const [selectedTrendRow, setSelectedTrendRow] = useState(null);
    const [trendDetails, setTrendDetails] = useState([]);

    const trendOrderItemCounts = useMemo(() => {
        const map = {};
        trendDetails.forEach((d) => {
            const id = d.OrderID;
            if (!id) return;
            const q = Number(d.Quantity) || 0;
            map[id] = (map[id] || 0) + q;
        });
        return map;
    }, [trendDetails]);

    const [expandedTrendOrders, setExpandedTrendOrders] = useState(new Set());

    const groupedTrendOrders = useMemo(() => {
        const map = {};
        trendDetails.forEach((d) => {
            const id = d.OrderID ?? `order-${Math.random()}`;
            if (!map[id]) {
                map[id] = {
                    OrderID: d.OrderID,
                    DatePlaced: d.LocalDatePlaced || d.DatePlaced || d.SaleDate,
                    CustomerName: d.CustomerName,
                    EmployeeName: d.EmployeeName,
                    Total: d.Total ?? d.Subtotal ?? 0,
                    Status: d.Status,
                    CategoryName: d.CategoryName,
                    items: [],
                    itemsCount: 0,
                };
            }
            map[id].items.push(d);
            map[id].itemsCount += Number(d.Quantity) || 0;
            if (d.LocalDatePlaced && (!map[id].DatePlaced || new Date(d.LocalDatePlaced) > new Date(map[id].DatePlaced))) {
                map[id].DatePlaced = d.LocalDatePlaced;
            }
            if (d.Total) map[id].Total = d.Total;
        });

        return Object.values(map).sort((a, b) => new Date(b.DatePlaced) - new Date(a.DatePlaced));
    }, [trendDetails]);

    const toggleTrendOrder = (orderId) => {
        setExpandedTrendOrders((prev) => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
            return next;
        });
    };

    const handleTrendRowClick = async (row) => {
        console.log('handleTrendRowClick called for', row);
        setSelectedTrendRow(row);

        if (!row.SaleDate || row.HourOfDay === undefined) {
            // This might happen if the click target didn't contain valid data.
            console.error("Missing SaleDate or HourOfDay in clicked row.");
            return;
        }

        try {
            const params = {
                date: String(row.SaleDate).slice(0, 10),
                hour: row.HourOfDay,
                from: fromDate || undefined,
                to: toDate || undefined
            };
            console.log('Calling trend details API with params', params);
            const res = await api.get('/admin/sales/sales-trends/details', { params });
            console.log('Trend details response', res && res.data);
            setTrendDetails(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed loading trend details", err);
            setTrendDetails([]);
        }
    };
    const getToggleText = (type, currentItem) => {
        switch (type) {
            case 'product':
                return selectedProduct?.ProductID === currentItem.ProductID ? "Hide items" : "Show items";
            case 'customer':
                return selectedCustomer?.CustomerID === currentItem.CustomerID ? "Hide items" : "Show items";
            case 'employee':
                return selectedEmployee?.EmployeeID === currentItem.EmployeeID ? "Hide items" : "Show items";
            case 'category':
                return selectedCategory?.CategoryID === currentItem.CategoryID ? "Hide items" : "Show items";
            case 'trend':
                // For trend rows, compare the identifying fields (SaleDate and HourOfDay)
                 const isExpanded = selectedTrendRow?.SaleDate === currentItem.SaleDate && selectedTrendRow?.HourOfDay === currentItem.HourOfDay;
                return isExpanded ? "Hide items" : "Show items";
            default:
                return "Show items";
        }
    };

    const getDateRangeDisplay = (start, end) => {

        const format = (dateStr) => {
            if (!dateStr) return null;

            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        };

        const formattedStart = format(start);
        const formattedEnd = format(end);

        if (!start && !end) {
            return "All Time";
        }

        if (formattedStart && formattedEnd) {

            if (start === end) {
                return `On ${formattedStart}`;
            }
            return `From ${formattedStart} to ${formattedEnd}`;
        }
        if (formattedStart) return `From ${formattedStart} onwards`;
        if (formattedEnd) return `Up to ${formattedEnd}`;

        return "All Time";
    };

    return (
        <div className="sales-report-container">
            <div className="page-header">
                <h1>Reports</h1>
            </div>

            {}
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

            {}
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
                                placeholder="Search reports by the 1st Column"
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

            {}
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tab id="products" label="Product Performance">
                    <div className="tab-content">
                        <h2>Product Performance by Category & Supplier</h2>
                        <div className="table-wrapper">
                            <table className="sales-table">
                                <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Brand</th>
                                    <th>Category</th>
                                    <th>Supplier</th>
                                    <th>Units Sold</th>
                                    <th>Revenue ($)</th>
                                    <th>Avg Price ($)</th>
                                    <th>Stock Status</th>
                                    <th>Details</th>
                                </tr>
                                </thead>
                                <tbody>
                                    {paginatedProducts.length ? (
                                        paginatedProducts.map((p) => (
                                            <tr>
                                                <td>{p.ProductName}</td>
                                                <td>{p.Brand || 'N/A'}</td>
                                                <td>{p.CategoryName}</td>
                                                <td>{p.SupplierName || 'N/A'}</td>
                                                <td>{p.UnitsSold}</td>
                                                <td className="revenue-cell">${formatCurrency(p.TotalRevenue)}</td>
                                                <td>${formatCurrency(p.AvgPrice)}</td>
                                                <td>
                                                    <span className={`stock-badge ${
                                                        p.StockStatus === 'Low Stock' ? 'low-stock' : 'in-stock'
                                                    }`}>
                                                        {p.StockStatus}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className='btn-link'
                                                            key={p.ProductID}
                                                            onClick={() => handleProductClick(p)}
                                                    >
                                                    {getToggleText('product', p)}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9">No products found</td>
                                        </tr>
                                    )}
                            </tbody>
                            </table>
                            
                        </div>
                        <Pagination
                            currentPage={productPage}
                            setCurrentPage={setProductPage}
                            totalItems={filteredProductPerformance.length}
                        />

                        {selectedProduct && (
                        <div className="related-orders">
                            <h3>Orders Containing {selectedProduct.ProductName} ({getDateRangeDisplay(fromDate, toDate)})</h3>

                            {productOrders.length ? (
                            <table className="orders-table">
                                <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Quantity</th>
                                    <th>Product Total ($)</th>
                                    <th>Customer</th>
                                </tr>
                                </thead>
                                <tbody>
                                {productOrders.map(order => (
                                    <tr key={order.OrderID}>
                                    <td>{order.OrderID}</td>
                                    <td>{new Date(order.DatePlaced).toLocaleString()}</td>
                                    <td>{order.Status}</td>
                                    <td>{order.Quantity}</td>
                                    <td>${order.ProductTotal}</td>
                                    <td>{order.CustomerFirst || order.CustomerLast ? `${order.CustomerFirst} ${order.CustomerLast}` : 'Guest'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            ) : (
                            <p>No orders found for this product.</p>
                            )}
                        </div>
                        )}

                    </div>
                </Tab>
                
                <Tab id="customers" label="Customer Analytics">
                    <div className="tab-content">
                        <h2>Customer Purchase Analytics</h2>
                        <div className="table-wrapper">
                            <table className="sales-table">
                                <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Email</th>
                                    <th>Orders</th>
                                    <th>Total Spent ($)</th>
                                    <th>Avg Order ($)</th>
                                    <th>Items Bought</th>
                                    <th>Loyalty Points</th>
                                    <th>Last Purchase</th>
                                    <th>Details</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedCustomers.length ? (
                                    paginatedCustomers.map((c) => (
                                        <tr>
                                            <td>{c.CustomerName}</td>
                                            <td>{c.Email || 'N/A'}</td>
                                            <td>{c.TotalOrders}</td>
                                            <td className="revenue-cell">${formatCurrency(c.TotalSpent)}</td>
                                            <td>${formatCurrency(c.AvgOrderValue)}</td>
                                            <td>{c.TotalItemsBought}</td>
                                            <td>{c.LoyaltyPoints}</td>
                                            <td className="date-cell">{formatDate(c.LastPurchaseDate)}</td>
                                            <td>
                                                <button className='btn-link'
                                                        key={c.CustomerID}
                                                        onClick={() => handleCustomerClick(c)}
                                                >
                                                {getToggleText('customer', c)}
                                            </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9">No customers found</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={customerPage}
                            setCurrentPage={setCustomerPage}
                            totalItems={filteredCustomerAnalytics.length}
                        />

                        {selectedCustomer && (
                            <div className="customer-orders">
                                <h3>Orders for {selectedCustomer.CustomerName} ({getDateRangeDisplay(fromDate, toDate)})</h3>

                                {customerOrders.length ? (
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Items</th>
                                                <th>Total ($)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customerOrders.map(order => (
                                                <tr key={order.OrderID}>
                                                    <td>{order.OrderID}</td>
                                                    <td>{formatDate(order.DatePlaced)}</td>
                                                    <td>{order.Status}</td>
                                                    <td>{order.ItemCount}</td>
                                                    <td>${formatCurrency(order.Total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p>No orders found for this customer.</p>
                                )}
                            </div>
                        )}

                    </div>
                </Tab>

                <Tab id="categories" label="Category Performance">
                    <div className="tab-content">
                        <h2>Category Performance with Employee Distribution</h2>
                        <div className="table-wrapper">
                            <table className="sales-table">
                                <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Orders</th>
                                    <th>Products</th>
                                    <th>Units Sold</th>
                                    <th>Revenue ($)</th>
                                    <th>Avg per Sale ($)</th>
                                    <th>Employees</th>
                                    <th>Customers</th>
                                    <th>Details</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedCategories.length ? (
                                    paginatedCategories.map((c) => (
                                        <tr>
                                            <td>{c.CategoryName}</td>
                                            <td>{c.OrderCount}</td>
                                            <td>{c.UniqueProducts}</td>
                                            <td>{c.TotalUnitsSold}</td>
                                            <td className="revenue-cell">${formatCurrency(c.TotalRevenue)}</td>
                                            <td>${formatCurrency(c.AvgRevenuePerSale)}</td>
                                            <td>{c.EmployeesInvolved}</td>
                                            <td>{c.UniqueCustomers}</td>
                                            <td><button className='btn-link'
                                                        key={c.CategoryID}
                                                        onClick={() => handleCategoryClick(c)}>
                                                {getToggleText('category', c)}
                                            </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9">No categories found</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={categoryPage}
                            setCurrentPage={setCategoryPage}
                            totalItems={filteredCategoryPerformance.length}
                        />
                        {selectedCategory && (
                            <div className="category-transactions">
                                <h3>Transactions for {selectedCategory.CategoryName} ({getDateRangeDisplay(fromDate, toDate)})</h3>

                                {groupedCategoryOrders.length ? (
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Date</th>
                                                <th>Customer</th>
                                                <th>Employee</th>
                                                <th>Items</th>
                                                <th>Order Total ($)</th>
                                                <th>Status</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedCategoryOrders.map((order) => {
                                                const expanded = expandedCategoryOrders.has(order.OrderID);
                                                return (
                                                    <>
                                                        <tr key={order.OrderID} className="order-row">
                                                            <td>{order.OrderID}</td>
                                                            <td>{formatDate(order.DatePlaced)}</td>
                                                            <td>{order.CustomerName || 'Guest'}</td>
                                                            <td>{order.EmployeeName || 'N/A'}</td>
                                                            <td>{order.itemsCount}</td>
                                                            <td>${formatCurrency(order.Total)}</td>
                                                            <td>{order.Status || 'N/A'}</td>
                                                            <td>
                                                                <button type="button" className="btn-link" onClick={() => toggleCategoryOrder(order.OrderID)}>
                                                                    {expanded ? 'Hide items' : 'Show items'}
                                                                </button>
                                                            </td>
                                                        </tr>

                                                        {expanded && order.items.map((item, idx) => (
                                                            <tr key={item.OrderDetailID || `${order.OrderID}-line-${idx}`} className="order-line">
                                                                <td colSpan={2} />
                                                                <td>{item.ProductName || '-'}</td>
                                                                <td />
                                                                <td>{item.Quantity ?? '-'}</td>
                                                                <td>${formatCurrency(item.LineTotal ?? (item.Quantity * item.Price))}</td>
                                                                <td />
                                                                <td />
                                                            </tr>
                                                        ))}
                                                    </>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p>No transactions found for this category.</p>
                                )}
                            </div>
                        )}
                    </div>
                </Tab>

                <Tab id="trends" label="Sales Trends">
                    <div className="tab-content">
                        <h2>Sales Trends & Order Patterns</h2>
                        <div className="table-wrapper">
                            <table className="sales-table">
                                <thead>
                                <tr>
                                    <th>Day</th>
                                    <th>Date</th>
                                    <th>Hour</th>
                                    <th>Orders</th>
                                    <th>Customers</th>
                                    <th>Revenue ($)</th>
                                    <th>Avg Order ($)</th>
                                    <th>Items/Order</th>
                                    <th>Details</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedTrends.length ? (
                                    paginatedTrends.map((t, idx) => (
                                            <tr>
                                                <td>{t.DayOfWeek}</td>
                                                <td className="date-cell">{formatDate(t.SaleDate)}</td>
                                                <td>{t.HourOfDay}:00</td>
                                                <td>{t.OrderCount}</td>
                                                <td>{t.UniqueCustomers}</td>
                                                <td className="revenue-cell">${formatCurrency(t.TotalRevenue)}</td>
                                                <td>${formatCurrency(t.AvgOrderValue)}</td>
                                                <td>{parseFloat(t.AvgItemsPerOrder).toFixed(1)}</td>
                                                <td><button className='btn-link'
                                                            key={idx}
                                                            onClick={() => handleTrendRowClick(t)}>
                                                    {getToggleText('trend', t)}
                                                </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9">No trends data found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={trendsPage}
                            setCurrentPage={setTrendsPage}
                            totalItems={filteredSalesTrends.length}
                        />
                        {selectedTrendRow && (
                            <div className="trend-details">
                                <h3>
                                    Details for {selectedTrendRow.DayOfWeek} {String(selectedTrendRow.SaleDate).slice(0,10)} {selectedTrendRow.HourOfDay}:00
                                </h3>

                                {groupedTrendOrders.length ? (
                                    <table className="orders-table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Date</th>
                                                <th>Customer</th>
                                                <th>Employee</th>
                                                <th>Category</th>
                                                <th>Items</th>
                                                <th>Order Total ($)</th>
                                                <th>Status</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedTrendOrders.map((order) => {
                                                const expanded = expandedTrendOrders.has(order.OrderID);
                                                return (
                                                    <>
                                                        <tr key={order.OrderID} className="order-row">
                                                            <td>{order.OrderID}</td>
                                                            <td>{formatDate(order.DatePlaced)}</td>
                                                            <td>{order.CustomerName || 'Guest'}</td>
                                                            <td>{order.EmployeeName || 'N/A'}</td>
                                                            <td>{order.CategoryName || '-'}</td>
                                                            <td>{order.itemsCount}</td>
                                                            <td>${formatCurrency(order.Total)}</td>
                                                            <td>{order.Status || 'N/A'}</td>
                                                            <td>
                                                                <button type="button" className="btn-link" onClick={() => toggleTrendOrder(order.OrderID)}>
                                                                    {expanded ? 'Hide items' : 'Show items'}
                                                                </button>
                                                            </td>
                                                        </tr>

                                                        {expanded && order.items.map((item, idx) => (
                                                            <tr key={item.OrderDetailID || `${order.OrderID}-line-${idx}`} className="order-line">
                                                                <td colSpan={2} />
                                                                <td>{item.ProductName || '-'}</td>
                                                                <td>{item.EmployeeName || ''}</td>
                                                                <td>{item.CategoryName || ''}</td>
                                                                <td>{item.Quantity ?? '-'}</td>
                                                                <td>${formatCurrency(item.LineTotal ?? (item.Quantity * item.Price))}</td>
                                                                <td />
                                                                <td />
                                                            </tr>
                                                        ))}
                                                    </>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p>No details found for this trend row.</p>
                                )}
                            </div>
                        )}
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
                                    <th>Order Details</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedOrders.length ? (
                                    paginatedOrders.map((order) => {
                                        const isPending = !order.Status || order.Status.toLowerCase() === 'pending';
                                        const customerName = order.FirstName
                                            ? `${order.FirstName} ${order.LastName || ''}`.trim()
                                            : 'Guest';

                                        return (
                                            <tr>
                                                <td>#{order.OrderID}</td>
                                                <td>{customerName}</td>
                                                <td>${formatCurrency(order.Total)}</td>
                                                <td>{formatDate(order.DatePlaced)}</td>
                                                <td>
                                                    <span className={`badge ${isPending ? "pending" : "completed"}`}>
                                                        {order.Status || "N/A"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button key={order.OrderID}
                                                            onClick={() => openOrderDetails(order.OrderID)}
                                                            className="btn-link">View Details
                                                    </button>
                                                    </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6">No orders found</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            currentPage={ordersPage}
                            setCurrentPage={setOrdersPage}
                            totalItems={filteredOrders.length}
                        />
                    </div>
                </Tab>

                <Tab id="employees" label="Employee Performance">
                    <div className="tab-content">
                        <h2>Employee Performance</h2>
                        <div className="table-wrapper">
                            <table className="sales-table">
                                <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Role</th>
                                    <th>Orders</th>
                                    <th>Items Sold</th>
                                    <th>Revenue ($)</th>
                                    <th>Avg Order ($)</th>
                                    <th>Products</th>
                                    <th>Details</th>
                                </tr>
                                </thead>
                                <tbody>
                                {paginatedEmployees.length ? (
                                    paginatedEmployees.map((emp) => (
                                        <tr>
                                            <td>
                                                <div className="employee-cell">
                                                    <div className="employee-avatar">
                                                        {emp.FirstName.charAt(0)}{emp.LastName.charAt(0)}
                                                    </div>
                                                    <span>{emp.FirstName} {emp.LastName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`role-badge role-badge--${emp.Role.toLowerCase()}`}>
                                                    {emp.Role}
                                                </span>
                                            </td>
                                            <td>{emp.TotalOrders || 0}</td>
                                            <td>{emp.TotalItemsSold || 0}</td>
                                            <td className="revenue-cell">${formatCurrency(emp.TotalRevenue)}</td>
                                            <td>${formatCurrency(emp.AvgOrderValue)}</td>
                                            <td>{emp.UniqueProducts || 0}</td>
                                            <td><button className='btn-link'
                                                        key={emp.EmployeeID}
                                                        onClick={() => handleEmployeeClick(emp)}
                                                        >{getToggleText('employee', emp)}
                                            </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8">No employees found</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={employeesPage}
                            setCurrentPage={setEmployeesPage}
                            totalItems={filteredEmployees.length}
                        />
                    </div>
                    {selectedEmployee && (
                        <div className="related-orders">
                            <h3>Orders Processed by {selectedEmployee.FirstName} {selectedEmployee.LastName} ({getDateRangeDisplay(fromDate, toDate)})</h3>

                            {employeeOrders.length ? (
                                <table className="orders-table">
                                    <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Total ($)</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {employeeOrders.map(order => {
                                        const customerName = order.FirstName || order.LastName
                                            ? `${order.FirstName || ''} ${order.LastName || ''}`.trim()
                                            : 'Guest';
                                        return (
                                            <tr key={order.OrderID}>
                                                <td>{order.OrderID}</td>
                                                <td>{formatDate(order.DatePlaced)}</td>
                                                <td>{customerName}</td>
                                                <td className="revenue-cell">${formatCurrency(order.Total)}</td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No orders found for this employee matching the filter criteria.</p>
                            )}
                        </div>
                    )}
                </Tab>
            </Tabs>

            {}
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

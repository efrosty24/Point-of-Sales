import { useContext, useState, useRef, useEffect } from "react";
import "./Navbar.css";
import api from "../utils/api.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../AuthContext";
import { Bell, Check } from "lucide-react";

function Navbar({ user }) {
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef();

    const handleSignOut = () => {
        setUser(null);
        delete axios.defaults.headers.common["Authorization"];
        navigate("/", { replace: true });
    };

    const toggleDropdown = () => setShowDropdown(!showDropdown);
    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchRestockNotifications = async () => {
        if (!user?.isAdmin) return;
        try {
            const res = await api.get("/admin/inventory/restock-orders", {
                params: { status: "pending" },
            });
            const data = Array.isArray(res.data) ? res.data : [];

            const formatted = data.map(order => ({
                id: order.RestockOrderID,
                message: `${order.ProductName} (Restock: ${order.Quantity} units)`,
                read: order.Status === "read",
            }));

            setNotifications(formatted);
        } catch (err) {
            console.error("Error fetching restock notifications:", err);
        }
    };

    const markAsRead = async (id) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        try {
            await api.patch(`/admin/inventory/restock-orders/${id}`, { status: "read" });
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    useEffect(() => {
        if (user?.isAdmin) {
            fetchRestockNotifications();
            const interval = setInterval(fetchRestockNotifications, 300000); // 5 minutes
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="navbar-container">
            <div className="navbar-left">
                <h1 className="navbar-title">Grocery POS</h1>
            </div>

            <div className="navbar-right">
                {user?.isAdmin && (
                    <div className="notification-wrapper" ref={dropdownRef}>
                        <button
                            className="notification-btn"
                            onClick={toggleDropdown}
                            aria-label="Notifications"
                            title="Notifications"
                        >
                            <Bell size={22} />
                            {unreadCount > 0 && <span className="notification-dot" />}
                        </button>

                        {showDropdown && (
                            <div className="notification-dropdown">
                                <div className="dropdown-header">
                                    <span>Product Restock Notifications</span>
                                </div>
                                <ul className="notification-list">
                                    {notifications.length === 0 ? (
                                        <li className="empty">No pending restocks</li>
                                    ) : (
                                        notifications.map((n) => (
                                            <li
                                                key={n.id}
                                                className={!n.read ? "unread" : ""}
                                            >
                                                <span>{n.message}</span>
                                                {!n.read && (
                                                    <button
                                                        className="read-btn"
                                                        onClick={() => markAsRead(n.id)}
                                                        title="Mark as read"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                )}
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="navbar-user">
                    <div className="user-info">
                        <div className="user-name">{user?.name || "User"}</div>
                        <div className="user-role">{user?.role || "Employee"}</div>
                    </div>

                    <button
                        className="user-avatar hover-signout"
                        type="button"
                        onClick={handleSignOut}
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <svg
                            className="avatar-icon"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="8" r="4" stroke="#2e7d32" strokeWidth="2" />
                            <path
                                d="M4 20c1.8-3.2 5-5 8-5s6.2 1.8 8 5"
                                stroke="#2e7d32"
                                strokeWidth="2"
                                fill="none"
                            />
                        </svg>
                        <span className="avatar-text">Sign Out</span>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Navbar;

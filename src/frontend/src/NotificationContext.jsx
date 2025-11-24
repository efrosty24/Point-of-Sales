import { createContext, useContext, useState, useCallback } from 'react';
import api from './utils/api.js';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children, user }) => {
    const [notifications, setNotifications] = useState([]);

    const fetchRestockNotifications = useCallback(async () => {
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
    }, [user]);

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

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                fetchRestockNotifications,
                markAsRead,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

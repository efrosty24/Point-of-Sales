import { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);

    const showAlert = useCallback((message, type = 'success', duration = 4000) => {
        const id = Date.now() + Math.random();
        const newAlert = { id, message, type };

        setAlerts(prev => [...prev, newAlert]);

        if (duration > 0) {
            setTimeout(() => {
                removeAlert(id);
            }, duration);
        }
    }, []);

    const removeAlert = useCallback((id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, []);

    const showSuccess = useCallback((message, duration) => {
        showAlert(message, 'success', duration);
    }, [showAlert]);

    const showError = useCallback((message, duration) => {
        showAlert(message, 'error', duration);
    }, [showAlert]);

    const showInfo = useCallback((message, duration) => {
        showAlert(message, 'info', duration);
    }, [showAlert]);

    const showWarning = useCallback((message, duration) => {
        showAlert(message, 'warning', duration);
    }, [showAlert]);

    return (
        <AlertContext.Provider
            value={{
                alerts,
                showAlert,
                showSuccess,
                showError,
                showInfo,
                showWarning,
                removeAlert,
            }}
        >
            {children}
        </AlertContext.Provider>
    );
};

import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext();

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return context;
};

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: null,
        onCancel: null,
    });

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title: options.title || 'Confirm Action',
                message: options.message || 'Are you sure?',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                onConfirm: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                },
            });
        });
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm, confirmState }}>
            {children}
        </ConfirmContext.Provider>
    );
};

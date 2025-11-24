import { useAlert } from '../AlertContext';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import './Alert.css';

function Alert() {
    const { alerts, removeAlert } = useAlert();

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <XCircle size={20} />;
            case 'warning':
                return <AlertCircle size={20} />;
            case 'info':
                return <Info size={20} />;
            default:
                return <Info size={20} />;
        }
    };

    return (
        <div className="alert-container">
            {alerts.map((alert) => (
                <div key={alert.id} className={`alert alert-${alert.type}`}>
                    <div className="alert-icon">
                        {getIcon(alert.type)}
                    </div>
                    <div className="alert-message">
                        {alert.message}
                    </div>
                    <button
                        className="alert-close"
                        onClick={() => removeAlert(alert.id)}
                        aria-label="Close alert"
                    >
                        <X size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
}

export default Alert;

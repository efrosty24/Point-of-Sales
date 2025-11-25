import { useConfirm } from '../ConfirmContext';
import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css';

function ConfirmDialog() {
    const { confirmState } = useConfirm();

    if (!confirmState.isOpen) return null;

    return (
        <div className="confirm-overlay" onClick={confirmState.onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-header">
                    <div className="confirm-icon">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="confirm-title">{confirmState.title}</h3>
                </div>

                <div className="confirm-body">
                    <p className="confirm-message">{confirmState.message}</p>
                </div>

                <div className="confirm-footer">
                    <button
                        className="confirm-btn confirm-btn-cancel"
                        onClick={confirmState.onCancel}
                    >
                        {confirmState.cancelText}
                    </button>
                    <button
                        className="confirm-btn confirm-btn-confirm"
                        onClick={confirmState.onConfirm}
                        autoFocus
                    >
                        {confirmState.confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;

import React from "react";
import "./ConfirmDialog.css";

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-header">
                    <h3>{title || "Confirm Action"}</h3>
                </div>
                <div className="confirm-body">
                    <p>{message || "Are you sure you want to proceed?"}</p>
                </div>
                <div className="confirm-footer">
                    <button className="confirm-cancel-btn" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="confirm-delete-btn" onClick={onConfirm}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

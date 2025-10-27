import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, onClose, title = "Dialog", describedById, children }) {
    const overlayRef = useRef(null);
    const dialogRef = useRef(null);
    const lastFocusedRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        lastFocusedRef.current = document.activeElement;

        const onKeyDown = (e) => {
            if (e.key === "Escape") { e.stopPropagation(); onClose(); }
            if (e.key === "Tab") {
                const f = dialogRef.current?.querySelectorAll(
                    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
                );
                if (!f?.length) return;
                const first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        const onClickOverlay = (e) => { if (e.target === overlayRef.current) onClose(); };

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown, true);
        overlayRef.current?.addEventListener("click", onClickOverlay);

        setTimeout(() => {
            const first = dialogRef.current?.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            (first || dialogRef.current)?.focus?.();
        }, 0);

        return () => {
            document.removeEventListener("keydown", onKeyDown, true);
            overlayRef.current?.removeEventListener("click", onClickOverlay);
            document.body.style.overflow = prevOverflow;
            lastFocusedRef.current?.focus?.();
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div ref={overlayRef} role="presentation" className="modal-overlay">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby={describedById || undefined}
                tabIndex={-1}
                className="modal-dialog"
            >
                <header className="modal-header">
                    <h3 id="modal-title" className="modal-title">{title}</h3>
                </header>
                <div className="modal-body">{children}</div>
            </div>
        </div>,
        document.body
    );
}

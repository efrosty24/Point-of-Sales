// ReceiptView.jsx
import { useMemo } from "react";

export default function ReceiptView({ data, currency = "USD" }) {
    const items = Array.isArray(data?.Items) ? data.Items : [];
    console.log(data);

    const fmt = (n) =>
        new Intl.NumberFormat(navigator.language, { style: "currency", currency })
            .format(Number(n) || 0);

    const totals = useMemo(() => {
        const subtotal = Number(data?.Subtotal) || items.reduce((s, it) => {
            const qty = Number(it.Qty) || 0;
            const unit = Number(it.UnitPrice) || 0;
            const lt = Number(it.LineTotal);
            return s + (Number.isFinite(lt) ? lt : qty * unit);
        }, 0);
        const discount = Number(data?.Discount) || 0;
        const tax = Number(data?.Tax) || 0;
        const total = Number(data?.Total) || Math.round((subtotal - discount + tax) * 100) / 100;
        return { subtotal, discount, tax, total };
    }, [data, items]);

    const placedAt = new Date(data?.Date || Date.now()).toLocaleString();

    const cashPaid = Number(data?.CashPaid);
    const changeDue = Number.isFinite(Number(data?.Change)) ? Number(data.Change)
        : Number.isFinite(cashPaid) ? Math.max(0, cashPaid - totals.total) : null;

    return (
        <section className="rx-root" aria-label="Receipt">
            <article className="rx-paper" id="print-receipt">
                <header className="rx-header">
                    <div className="rx-brand">#7 GROCERY POS</div>
                    <div className="rx-small rx-addr">1234 POS St</div>
                    <div className="rx-small rx-addr">Houston, TX 77000</div>
                    <div className="rx-small rx-addr">Tel.: (555)‑555‑5555</div>
                </header>

                <div className="rx-dots" aria-hidden="true" />
                <section className="rx-grid2">
                    <div className="rx-row">
                        <span className="rx-label">Cashier:</span>
                        <span className="rx-value">{data?.CashierName ?? "—"}</span>
                    </div>
                    <div className="rx-row rx-right">
            <span className="rx-value">
              {""}
            </span>
                    </div>
                    <div className="rx-row">
                        <span className="rx-label">Customer:</span>
                        <span className="rx-value">{data?.CustomerName || "Guest"}</span>
                    </div>
                    <div className="rx-row rx-right">
                        <span className="rx-value">{data?.Status || "Placed"}</span>
                    </div>
                </section>

                <div className="rx-dots" aria-hidden="true" />

                <div className="rx-table-head">
                    <span className="th-name">Name</span>
                    <span className="th-qty">Qty</span>
                    <span className="th-price">Price</span>
                </div>

                <div className="rx-dotline" aria-hidden="true" />

                <ul className="rx-items" aria-label="Line items">
                    {items.map((it) => {
                        const qty = Number(it.Qty) || 0;
                        const unit = Number(it.UnitPrice) || 0;
                        const lineAmount = Number.isFinite(Number(it.LineTotal)) ? Number(it.LineTotal) : qty * unit;

                        const priceCell = unit;

                        const compare = it.OriginalPrice != null && Number(it.OriginalPrice) > unit
                            ? Number(it.OriginalPrice) : null;
                        const discountNote =
                            it.DiscountType
                                ? it.DiscountType === "percentage" && it.DiscountValue != null
                                    ? `${it.DiscountValue}% off`
                                    : it.DiscountType === "fixed" && it.DiscountValue != null
                                        ? `${fmt(it.DiscountValue)} off`
                                        : String(it.DiscountType).toUpperCase()
                                : null;
                        const saved = Number(it.SavedAmount) || 0;

                        return (
                            <li key={`${it.ProductID}-${it.Name}`} className="rx-item">
                                <div className="it-row">
                                    <span className="it-name" title={it.Name}>{it.Name}</span>
                                    <span className="it-qty">{qty}</span>
                                    <span className="it-price">{fmt(priceCell)}</span>
                                </div>
                                {(compare || discountNote || saved > 0) && (
                                    <div className="it-sub">
                                        {compare && <span className="it-compare">Was {fmt(compare)}</span>}
                                        {discountNote && <span className="it-disc">{discountNote}</span>}
                                        {saved > 0 && <span className="it-saved">Saved {fmt(saved)}</span>}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>

                <div className="rx-dots" aria-hidden="true" />

                <section className="rx-totals">
                    <div className="tx-row tx-strong">
                        <span className="tx-label">Sub Total</span>
                        <span className="tx-num">{fmt(totals.subtotal)}</span>
                    </div>
                    <div className="tx-row">
                        <span className="tx-label">Discount</span>
                        <span className="tx-num">-{fmt(totals.discount)}</span>
                    </div>
                    <div className="tx-row">
                        <span className="tx-label">Tax</span>
                        <span className="tx-num">{fmt(totals.tax)}</span>
                    </div>
                    <div className="tx-row tx-grand">
                        <span className="tx-label">Total</span>
                        <span className="tx-num">{fmt(totals.total)}</span>
                    </div>

                    {Number.isFinite(cashPaid) && (
                        <>
                            <div className="tx-row">
                                <span className="tx-label">CASH</span>
                                <span className="tx-num">{fmt(cashPaid)}</span>
                            </div>
                            {Number.isFinite(changeDue) && (
                                <div className="tx-row">
                                    <span className="tx-label">CHANGE</span>
                                    <span className="tx-num">{fmt(changeDue)}</span>
                                </div>
                            )}
                        </>
                    )}
                </section>

                <div className="rx-dash" aria-hidden="true" />

                <div className="rx-barcode">
                    <div className="rx-bar" aria-hidden="true" />
                </div>

                <footer className="rx-footer" role="contentinfo">
                    <div className="rx-center rx-ty">THANK YOU!</div>
                    <div className="rx-center rx-muted">Glad to see you again!</div>
                    <div className="rx-center rx-meta">{placedAt}</div>
                    {data?.CustomerID != null && (
                        <div className="rx-center rx-muted">CustomerID: {Number(data.CustomerID)}</div>
                    )}
                    {data?.GuestID != null && (
                        <div className="rx-center rx-muted">
                            <span>
                                GuestID:{' '}
                                {(() => {
                                    const idStr = String(data.GuestID || '');
                                    const visibleCount = Math.ceil(idStr.length * 0.25);
                                    const hiddenCount = idStr.length - visibleCount;
                                    return 'x'.repeat(hiddenCount) + idStr.slice(-visibleCount);
                                })()}
                            </span>
                        </div>
                    )}
                    {data?.Status && (
                        <div className="rx-center rx-muted">Status: {data.Status}</div>
                    )}
                </footer>
            </article>
        </section>
    );
}

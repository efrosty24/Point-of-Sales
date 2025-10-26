import { useMemo, useRef, useState } from "react";
import "./Cashier.css";

const formatCurrency = (value, locale = navigator.language, currency = "USD") =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);

function QtyStepper({ value, onSet, labelId }) {
    const min = 0;
    const max = 999;

    const clamp = (n) => Math.min(max, Math.max(min, n));
    const parseDigits = (str) => {
        const digits = String(str).replace(/[^\d]/g, "");
        return digits === "" ? NaN : Number(digits);
    };

    const onChange = (e) => {
        const n = parseDigits(e.target.value);
        if (Number.isNaN(n)) {
            // allow empty while editing
            onSet("");
            return;
        }
        onSet(clamp(n));
    };

    const onBlur = (e) => {
        const n = parseDigits(e.target.value);
        const next = Number.isNaN(n) ? (Number.isFinite(Number(value)) ? clamp(Number(value)) : min) : clamp(n);
        onSet(next);
    };

    const onKeyDown = (e) => {
        const cur = Number.isFinite(Number(value)) ? Number(value) : 0;
        if (e.key === "ArrowUp") { e.preventDefault(); onSet(clamp(cur + 1)); }
        else if (e.key === "ArrowDown") { e.preventDefault(); onSet(clamp(cur - 1)); }
        else if (e.key === "Home") { e.preventDefault(); onSet(min); }
        else if (e.key === "End") { e.preventDefault(); onSet(max); }
    };

    const display = value === "" ? "" : String(value);
    const curVal = Number.isFinite(Number(value)) ? Number(value) : 0;

    return (
        <div className="qty-controls" role="group" aria-labelledby={labelId}>
            <button
                type="button"
                onClick={() => onSet(clamp(curVal - 1))}
                aria-label="Decrease quantity"
                title="Decrease quantity"
                disabled={curVal <= min}
            >
                −
            </button>

            <input
                type="text"
                className="qty-input"
                value={display}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                inputMode="numeric"
                role="spinbutton"
                aria-label="Quantity"
                aria-valuenow={curVal}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-labelledby={labelId}
                aria-invalid={curVal < min || curVal > max ? "true" : "false"}
            />

            <button
                type="button"
                onClick={() => onSet(clamp(curVal + 1))}
                aria-label="Increase quantity"
                title="Increase quantity"
                disabled={curVal >= max}
            >
                +
            </button>
        </div>
    );
}

export default function Cashier() {
    const allProducts = useMemo(
        () =>
            Array.from({ length: 40 }, (_, i) => ({
                ProductID: i + 1,
                Name: `Product ${i + 1}`,
                Brand: ["FreshCo", "GoodFarm", "DailyMart"][i % 3],
                Category: ["Fruits", "Vegetables", "Dairy", "Snacks"][i % 4],
                Price: Number((Math.random() * 10 + 1).toFixed(2)),
                QuantityValue: (i % 3) + 1,
                QuantityUnit: ["kg", "L", "pcs"][i % 3],
                ImgPath: `https://placehold.co/300x200`,
            })),
        []
    );

    const customers = [
        { phone: "1234567890", name: "Ash" },
        { phone: "9998887777", name: "Maria" },
        { phone: "5554443333", name: "John" },
    ];

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [cart, setCart] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [customerName, setCustomerName] = useState("Guest");
    const [phone, setPhone] = useState("");
    const [notFound, setNotFound] = useState(false);

    const itemsPerPage = 15;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return allProducts.filter(
            (p) =>
                (category === "All" || p.Category === category) &&
                (p.Name.toLowerCase().includes(q) || p.ProductID.toString().includes(q))
        );
    }, [allProducts, category, search]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const visible = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const addToCart = (product) => {
        setCart((prev) => {
            const exists = prev.find((c) => c.ProductID === product.ProductID);
            if (exists) {
                return prev.map((c) =>
                    c.ProductID === product.ProductID
                        ? { ...c, qty: Math.min(Number(c.qty || 0) + 1, 999) }
                        : c
                );
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const setCartQty = (productID, next) => {
        setCart((prev) => {
            const n = next === "" ? "" : Number(next);
            return prev
                .map((c) => (c.ProductID === productID ? { ...c, qty: n } : c))
                .filter((c) => c.qty !== 0 && c.qty !== "0"); // drop zeros
        });
    };

    const decreaseQty = (id) => {
        setCart((prev) =>
            prev
                .map((c) => (c.ProductID === id ? { ...c, qty: Number(c.qty || 0) - 1 } : c))
                .filter((c) => Number(c.qty || 0) > 0)
        );
    };

    const removeFromCart = (id) => setCart((prev) => prev.filter((c) => c.ProductID !== id));

    const getQty = (id) => cart.find((c) => c.ProductID === id)?.qty ?? 0;

    const normalizeQty = (q) => (q === "" || !Number.isFinite(Number(q)) ? 0 : Number(q));
    const subtotal = cart.reduce((sum, item) => sum + normalizeQty(item.qty) * item.Price, 0);
    const discount = subtotal * 0.1;
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * 0.0825;
    const total = taxable + tax;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    const handlePhoneSearch = () => {
        const found = customers.find((c) => c.phone === phone.trim());
        if (found) {
            setCustomerName(found.name);
            setNotFound(false);
        } else {
            setCustomerName("Guest");
            setNotFound(true);
        }
    };

    return (
        <div className="cashier-container">
            <div className="cashier-left">
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search by Name or ID..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                    <select
                        value={category}
                        onChange={(e) => {
                            setCategory(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option>All</option>
                        <option>Fruits</option>
                        <option>Vegetables</option>
                        <option>Dairy</option>
                        <option>Snacks</option>
                    </select>
                </div>

                <div className="product-scroll">
                    <div className="product-grid">
                        {visible.map((p) => {
                            const qty = getQty(p.ProductID);
                            const labelId = `prod-${p.ProductID}-label`;
                            return (
                                <div key={p.ProductID} className={`product-card ${qty > 0 ? "in-cart" : ""}`}>
                                    <img src={p.ImgPath} alt={`${p.Name} by ${p.Brand}`} />
                                    <div className="product-info">
                                        <h3 id={labelId}>{p.Name}</h3>
                                        <p className="brand">{p.Brand}</p>
                                        <p className="unit">
                                            {p.QuantityValue} {p.QuantityUnit}
                                        </p>
                                        <p className="price">{formatCurrency(p.Price)}</p>
                                    </div>

                                    {qty > 0 ? (
                                        <QtyStepper
                                            value={qty}
                                            onSet={(next) => setCartQty(p.ProductID, next)}
                                            labelId={labelId}
                                        />
                                    ) : (
                                        <button
                                            className="btn-primary"
                                            onClick={() => addToCart(p)}
                                            aria-label={`Add ${p.Name} to cart`}
                                        >
                                            Add
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pagination" role="navigation" aria-label="Pagination">
                    <button
                        className={`page-arrow ${currentPage === 1 ? "is-disabled" : ""}`}
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                    >
                        &lt;
                    </button>

                    {pages.map((p) => (
                        <button
                            key={p}
                            className={`page-num ${p === currentPage ? "is-active" : ""}`}
                            onClick={() => setCurrentPage(p)}
                            aria-current={p === currentPage ? "page" : undefined}
                            aria-label={`Page ${p}`}
                        >
                            {p}
                        </button>
                    ))}

                    <button
                        className={`page-arrow ${currentPage === totalPages ? "is-disabled" : ""}`}
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        aria-label="Next page"
                    >
                        &gt;
                    </button>
                </div>
            </div>

            <div className="cashier-right">
                <div className="cart-header">
                    <h2>Cart ({customerName})</h2>
                    <div className="cart-phone">
                        <input
                            type="tel"
                            placeholder="Phone No."
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={notFound ? "error" : ""}
                            aria-invalid={notFound ? "true" : "false"}
                            aria-describedby={notFound ? "cust-not-found" : undefined}
                        />
                        <button onClick={handlePhoneSearch}>Find</button>
                    </div>
                </div>

                {notFound && (
                    <div id="cust-not-found" className="inline-error" role="alert">
                        Customer not found
                    </div>
                )}

                <div className="cart-scroll">
                    {cart.length === 0 ? (
                        <p className="empty-cart">No items in cart</p>
                    ) : (
                        <ul>
                            {cart.map((item) => {
                                const line = normalizeQty(item.qty) * item.Price;
                                const labelId = `cart-${item.ProductID}-label`;
                                return (
                                    <li key={item.ProductID} className="cart-item">
                                        <div className="cart-item-left">
                                            <img src={item.ImgPath} alt={`${item.Name} thumbnail`} />
                                            <div className="cart-item-info">
                                                <span id={labelId}>{item.Name}</span>
                                                <span className="cart-subtotal">{formatCurrency(line)}</span>
                                            </div>
                                        </div>
                                        <div className="cart-item-right">
                                            <QtyStepper
                                                value={item.qty}
                                                onSet={(next) => setCartQty(item.ProductID, next)}
                                                labelId={labelId}
                                            />
                                            <button
                                                className="btn-remove"
                                                onClick={() => removeFromCart(item.ProductID)}
                                                aria-label={`Remove ${item.Name} from cart`}
                                                title="Remove item"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="cart-summary">
                    <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Discount (10%):</span>
                        <span>-{formatCurrency(discount)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Tax (8.25%):</span>
                        <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="summary-row total">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                    <button className="checkout-btn">Checkout</button>
                </div>
            </div>
        </div>
    );
}

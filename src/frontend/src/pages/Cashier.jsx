import { useState } from "react";
import "./Cashier.css";

export default function Cashier() {
    const allProducts = Array.from({ length: 20 }, (_, i) => ({
        ProductID: i + 1,
        Name: `Product ${i + 1}`,
        Brand: ["FreshCo", "GoodFarm", "DailyMart"][i % 3],
        CategoryID: (i % 4) + 1,
        Category: ["Fruits", "Vegetables", "Dairy", "Snacks"][i % 4],
        Price: (Math.random() * 10 + 1).toFixed(2),
        Stock: Math.floor(Math.random() * 100),
        QuantityValue: (i % 3) + 1,
        QuantityUnit: ["kg", "L", "pcs"][i % 3],
        ImgPath: `https://picsum.photos/100?random=${i + 1}`,
    }));

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [cart, setCart] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const filtered = allProducts.filter(
        (p) =>
            (category === "All" || p.Category === category) &&
            (p.Name.toLowerCase().includes(search.toLowerCase()) ||
                p.ProductID.toString().includes(search))
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const visible = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const addToCart = (product) => {
        const exists = cart.find((c) => c.ProductID === product.ProductID);
        if (exists) {
            setCart(
                cart.map((c) =>
                    c.ProductID === product.ProductID ? { ...c, qty: c.qty + 1 } : c
                )
            );
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const decreaseQty = (id) => {
        setCart((prev) =>
            prev
                .map((c) =>
                    c.ProductID === id ? { ...c, qty: c.qty - 1 } : c
                )
                .filter((c) => c.qty > 0)
        );
    };

    const removeFromCart = (id) => {
        setCart(cart.filter((c) => c.ProductID !== id));
    };

    const getQty = (id) => {
        const item = cart.find((c) => c.ProductID === id);
        return item ? item.qty : 0;
    };

    const total = cart
        .reduce((sum, item) => sum + item.qty * parseFloat(item.Price), 0)
        .toFixed(2);

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="cashier-container">
            {/* Product area */}
            <div className="cashier-left">
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
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
                            return (
                                <div key={p.ProductID} className="product-card">
                                    <img src={p.ImgPath} alt={p.Name} />
                                    <div className="product-info">
                                        <h3>{p.Name}</h3>
                                        <p className="brand">{p.Brand}</p>
                                        <p className="unit">
                                            {p.QuantityValue} {p.QuantityUnit}
                                        </p>
                                        <p className="price">${p.Price}</p>
                                    </div>
                                    {qty > 0 ? (
                                        <div className="qty-controls">
                                            <button onClick={() => decreaseQty(p.ProductID)}>-</button>
                                            <span>{qty}</span>
                                            <button onClick={() => addToCart(p)}>+</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => addToCart(p)}>Add to Cart</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pagination">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Prev
                    </button>
                    {pages.map((p) => (
                        <button
                            key={p}
                            className={p === currentPage ? "active-page" : ""}
                            onClick={() => setCurrentPage(p)}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Cart panel */}
            <div className="cashier-right">
                <h2>Cart</h2>
                <div className="cart-scroll">
                    {cart.length === 0 ? (
                        <p className="empty-cart">No items in cart</p>
                    ) : (
                        <ul>
                            {cart.map((item) => (
                                <li key={item.ProductID}>
                                    <div className="cart-item-left">
                                        <img src={item.ImgPath} alt={item.Name} />
                                        <div className="cart-item-info">
                                            <span>{item.Name}</span>
                                            <span className="cart-subtotal">
                        ${(+item.Price * item.qty).toFixed(2)}
                      </span>
                                        </div>
                                    </div>
                                    <div className="cart-item-right">
                                        <button onClick={() => decreaseQty(item.ProductID)}>-</button>
                                        <span>{item.qty}</span>
                                        <button onClick={() => addToCart(item)}>+</button>
                                        <button onClick={() => removeFromCart(item.ProductID)}>×</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="cart-total-sticky">
                    <span>Total:</span>
                    <span>${total}</span>
                </div>
            </div>
        </div>
    );
}

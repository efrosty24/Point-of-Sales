import { useEffect, useMemo, useState, useCallback, useRef, useContext } from "react";
import { useSearchParams, useNavigate } from 'react-router-dom';
import "./Cashier.css";
import ReceiptView from "../components/ReceiptView.jsx";
import Modal from "../components/Modal.jsx";
import api from "../utils/api.js";
import { Info } from "lucide-react";
import { AuthContext } from "../AuthContext";
import { useNotifications } from "../NotificationContext";
import { useAlert } from '../AlertContext';


const GUEST_KEY = "cashierGuest";

const safeParse = (str, fallback) => { try { return str ? JSON.parse(str) : fallback; } catch { return fallback; } };
const loadGuest = () => safeParse(localStorage.getItem(GUEST_KEY), { customerId: null, sessionId: null, lastRegisterListId: null });
const saveGuest = (g) => { try { localStorage.setItem(GUEST_KEY, JSON.stringify(g)); } catch {} };

const randomInt53 = () => {
    if (globalThis.crypto && crypto.getRandomValues) {
        const buf = new Uint32Array(2);
        crypto.getRandomValues(buf);
        const high = buf[0] & 0x001FFFFF;
        const low = buf[1];
        return high * 0x100000000 + low;
    }
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
};

const ensureSessionId = (g) => {
    if (g.customerId) return { ...g, sessionId: null };
    if (typeof g.sessionId === "number" && Number.isFinite(g.sessionId)) return g;
    return { ...g, sessionId: randomInt53() };
};

const formatCurrency = (value, locale = navigator.language, currency = "USD") =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).format(Number(value));
const round2 = (n) => Math.round(n * 100) / 100;

const computeSaved = (qty, originalPrice, unitPrice, discountType) => {
    const q = Number(qty) || 0;
    const orig = Number(originalPrice) || 0;
    const unit = Number(unitPrice) || 0;
    const t = (discountType || "").toLowerCase();
    if (!q || !Number.isFinite(orig) || !Number.isFinite(unit)) return 0;
    if (t === "bogo") {
        const freeUnits = Math.floor(q / 2);
        return round2(freeUnits * orig);
    }
    const perUnitSave = Math.max(0, orig - unit);
    return round2(perUnitSave * q);
};

function QtyStepper({ value, onSet, labelId, disablePlusVisual = false }) {
    const min = 0, max = 999;
    const clamp = (n) => Math.min(max, Math.max(min, n));
    const parseDigits = (str) => {
        const digits = String(str).replace(/[^\d]/g, "");
        return digits === "" ? NaN : Number(digits);
    };
    const onChange = (e) => {
        const n = parseDigits(e.target.value);
        onSet(Number.isNaN(n) ? "" : clamp(n));
    };
    const onBlur = () => {
        const n = parseDigits(value);
        onSet(Number.isNaN(n) ? min : clamp(n));
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
        <div className={`qty-controls ${disablePlusVisual ? "disable-plus" : ""}`} role="group" aria-labelledby={labelId}>
            <button type="button" className="btn-minus" onClick={() => onSet(clamp(curVal - 1))} disabled={curVal <= min}>−</button>
            <input
                type="text"
                className="qty-input"
                value={display}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                inputMode="numeric"
                role="spinbutton"
                aria-valuenow={curVal}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-labelledby={labelId}
            />
            <button
                type="button"
                className="btn-plus"
                onClick={() => onSet(clamp(curVal + 1))}
                disabled={curVal >= max}
                aria-disabled={disablePlusVisual || undefined}
            >+</button>
        </div>
    );
}

export default function Cashier() {
    const { user, setUser } = useContext(AuthContext);
    const { showSuccess, showError } = useAlert();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [guest, setGuest] = useState(() => ensureSessionId(loadGuest()));
    const hasRealCustomer = guest.customerId != null;
    const [points, setPoints] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();

    const [customerName, setCustomerName] = useState("Guest");
    const [email, setEmail] = useState("");  
    const [cart, setCart] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(false);
    const itemsPerPage = 15;

    const [showReceipt, setShowReceipt] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [receiptLoading, setReceiptLoading] = useState(false);
    const [receiptError, setReceiptError] = useState("");

    const [insufficient, setInsufficient] = useState(() => new Map());
    const [outOfStock, setOutOfStock] = useState(() => new Map());
    const lastChangeRef = useRef({ productId: null, delta: 0 });

    
    const isCustomerRole = user?.role?.toLowerCase() === "customer";
    const isGuestCustomer = isCustomerRole && Number(user?.id) === 1000;

    const { fetchRestockNotifications } = useNotifications();

    const employeeId = isCustomerRole ? 1000 : user?.id || 3;

    const isInsufficient = (id) => insufficient.has(id);
    const isOOS = (id) => outOfStock.has(id);

    const markInsufficient = useCallback((productID, disabled) => {
        setInsufficient(prev => {
            const next = new Map(prev);
            if (disabled) next.set(productID, true); else next.delete(productID);
            return next;
        });
    }, []);

    const setOutOfStockFlag = useCallback((productID, flag) => {
        setOutOfStock(prev => {
            const next = new Map(prev);
            if (flag) next.set(productID, true); else next.delete(productID);
            return next;
        });
    }, []);

    
    useEffect(() => {
        if (isCustomerRole && !isGuestCustomer) {
            
            setGuest(prev => ({
                ...prev,
                customerId: Number(user.id),
                sessionId: null
            }));
            setCustomerName(user.name || "Customer");
            
            setPoints(Number(user.points) || 0);
        } else if (isGuestCustomer) {
            
            const ensured = ensureSessionId({ customerId: null, sessionId: null, lastRegisterListId: null });
            setGuest(ensured);
            setCustomerName("Guest");
            setPoints(0);
        }
    }, [isCustomerRole, isGuestCustomer, user]);

    useEffect(() => { saveGuest(guest); }, [guest]);

    const handlePrintReceipt = () => window.print();

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("user");
        navigate("/");
    };

    useEffect(() => {
        const s = searchParams.get('search') || '';
        const c = searchParams.get('category') || 'All';
        setSearch(s);
        setCategory(c);
        setCurrentPage(1);
    }, []);

    const onSearchChange = (e) => {
        const s = e.target.value;
        setSearch(s);
        setCurrentPage(1);
        const next = new URLSearchParams(searchParams);
        if (s) next.set('search', s); else next.delete('search');
        if (category) next.set('category', category);
        setSearchParams(next);
    };

    const onCategoryChange = (e) => {
        const c = e.target.value;
        setCategory(c);
        setCurrentPage(1);
        const next = new URLSearchParams(searchParams);
        if (search) next.set('search', search); else next.delete('search');
        if (c) next.set('category', c);
        setSearchParams(next);
    };

    useEffect(() => {
        if (!guest.lastRegisterListId) return;
        const id = guest.lastRegisterListId;
        (async () => {
            try {
                const res = await api.get(`/cashier/registerList/${id}`);
                const data = res.data;
                const items = (data.items || []).map(r => {
                    const saved = r.SavedAmount != null ? Number(r.SavedAmount) : computeSaved(r.Qty, r.OriginalPrice, r.Price, r.DiscountType);
                    return {
                        ProductID: r.ProductID,
                        Name: r.Name,
                        Qty: Number(r.Qty),
                        Price: Number(r.Price),
                        OriginalPrice: Number(r.OriginalPrice ?? r.Price ?? 0),
                        LineTotal: Number(r.LineTotal),
                        SavedAmount: Number.isFinite(saved) ? saved : 0,
                        DiscountType: r.DiscountType || null,
                        DiscountValue: r.DiscountValue != null ? Number(r.DiscountValue) : null,
                        DiscountLabel: r.DiscountLabel || null,
                        ImgPath: r.ImgPath && r.ImgPath.endsWith("/") ? (r.ImgPath + (r.ImgName || "placeholder.jpg")) : (r.ImgPath || "/products/placeholder.jpg"),
                    };
                });
                setCart(items);
            } catch {}
        })();
    }, [guest.lastRegisterListId]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get(`/admin/inventory/categories`);
                const data = res.data;
                if (Array.isArray(data)) setCategories(data);
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            }
        };
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;
            if (category !== "All") params.category = category;

            const res = await api.get(`/cashier/products`, { params });
            const data = res.data;
            if (Array.isArray(data)) {
                setProducts(
                    data.map((p) => ({
                        ...p,
                        OriginalPrice: Number(p.OriginalPrice),
                        FinalPrice: Number(p.FinalPrice),
                        Stock: Number(p.Stock),
                        DiscountType: p.DiscountType || null,
                        DiscountValue: p.DiscountValue != null ? Number(p.DiscountValue) : null,
                        ImgPath:
                            p.ImgPath && p.ImgPath.endsWith("/")
                                ? (p.ImgPath || "/products/") + (p.ImgName || "placeholder.jpg")
                                : p.ImgPath || "/products/placeholder.jpg",
                    }))
                );
                setOutOfStock(() => {
                    const m = new Map();
                    for (const p of data) {
                        const s = Number(p.Stock);
                        if (Number.isFinite(s) && s <= 0) m.set(p.ProductID, true);
                    }
                    return m;
                });
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [search, category]);

    const totalPages = Math.ceil(products.length / itemsPerPage);
    const visible = useMemo(() => products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [products, currentPage]);

    const normalizeQty = (q) => (q === "" || !Number.isFinite(Number(q)) ? 0 : Number(q));
    const getQty = (id) => cart.find((c) => c.ProductID === id)?.Qty ?? 0;

    const ensureRegister = useCallback(async () => {
        if (guest.lastRegisterListId) return Number(guest.lastRegisterListId);

        let customerId = null;
        let guestId = null;

        if (isCustomerRole && !isGuestCustomer) {
            customerId = Number(user.id);
        } else if (isGuestCustomer) {
            guestId = Number(guest.sessionId);
        } else {
            customerId = hasRealCustomer ? Number(guest.customerId) : null;
            guestId = hasRealCustomer ? null : Number(guest.sessionId);
        }

        const payload = {
            customerId,
            guestId,
            employeeId,
            items: [],
            taxRate: 0.0825,
        };

        const res = await api.post(`/cashier/registerList`, payload);
        const data = res.data || {};
        if (!data.RegisterListID) {
            throw new Error((data && (data.error || data.message)) || 'OPEN_REGISTER_FAILED');
        }
        const newId = Number(data.RegisterListID);
        setGuest(prev => ({ ...prev, lastRegisterListId: newId }));
        return newId;
    }, [guest.lastRegisterListId, hasRealCustomer, guest.customerId, guest.sessionId, isCustomerRole, isGuestCustomer, user, employeeId]);

    const updateRegisterSnapshot = async (nextCart) => {
        try {
            let customerId = null;
            let guestId = null;

            if (isCustomerRole && !isGuestCustomer) {
                customerId = Number(user.id);
            } else if (isGuestCustomer) {
                guestId = Number(guest.sessionId);
            } else {
                customerId = hasRealCustomer ? Number(guest.customerId) : null;
                guestId = hasRealCustomer ? null : Number(guest.sessionId);
            }

            const payload = {
                customerId,
                guestId,
                employeeId,
                items: nextCart.map((c) => ({
                    ProductID: Number(c.ProductID),
                    Qty: normalizeQty(c.Qty),
                })),
                taxRate: 0.0825,
            };

            const okIds =
                (payload.customerId != null && Number.isFinite(payload.customerId)) ||
                (payload.guestId != null && Number.isFinite(payload.guestId));
            if (!okIds) throw new Error('BAD_CUSTOMER_OR_GUEST');

            const badItems = !payload.items.every(
                (i) => Number.isFinite(i.ProductID) && Number.isFinite(i.Qty) && i.Qty > 0
            );
            if (badItems) throw new Error('BAD_ITEMS');

            const res = await api.post(`/cashier/registerList`, payload);
            const data = res.data || {};

            const merged = nextCart.map((c) => {
                const line = (data.items || []).find(
                    (i) => i.ProductID === Number(c.ProductID)
                );
                if (!line) return c;

                const saved =
                    line.SavedAmount != null
                        ? Number(line.SavedAmount)
                        : computeSaved(
                            line.Qty,
                            line.OriginalPrice,
                            line.Price,
                            line.DiscountType
                        );

                return {
                    ...c,
                    Price: Number(line.Price),
                    OriginalPrice: Number(line.OriginalPrice ?? c.OriginalPrice ?? line.Price),
                    LineTotal: Number(line.LineTotal),
                    SavedAmount: Number.isFinite(saved) ? saved : 0,
                    DiscountType: line.DiscountType || c.DiscountType || null,
                    DiscountValue:
                        line.DiscountValue != null
                            ? Number(line.DiscountValue)
                            : c.DiscountValue != null
                                ? Number(c.DiscountValue)
                                : null,
                    DiscountLabel: line.DiscountLabel || c.DiscountLabel || null,
                };
            });

            setCart(merged);

            if (data.RegisterListID) {
                setGuest((prev) => ({ ...prev, lastRegisterListId: data.RegisterListID }));
            }

        } catch (err) {
            const be = err?.response?.data?.error || err?.message || "";
            if (be === "INSUFFICIENT_STOCK") {
                const pidRaw =
                    err?.response?.data?.ProductID ??
                    lastChangeRef.current?.productId ??
                    (Array.isArray(nextCart) && nextCart.length ? nextCart[nextCart.length - 1].ProductID : null);

                const pid = Number(pidRaw);

                if (Number.isFinite(pid)) {
                    markInsufficient(pid, true);
                    setOutOfStockFlag(pid, true);
                }

                return;
            }

            console.error('updateRegisterSnapshot error:', err);
        }
    };

    const deleteItemFromServer = async (productID) => {
        if (!guest.lastRegisterListId) return;
        try {
            const res = await api.delete(`/cashier/registerList/${guest.lastRegisterListId}/items/${productID}`);
            const data = res.data;
            const items = (data.items || []).map(r => {
                const saved = r.SavedAmount != null ? Number(r.SavedAmount) : computeSaved(r.Qty, r.OriginalPrice, r.Price, r.DiscountType);
                return {
                    ProductID: r.ProductID,
                    Name: r.Name,
                    Qty: Number(r.Qty),
                    Price: Number(r.Price),
                    OriginalPrice: Number(r.OriginalPrice ?? r.Price ?? 0),
                    LineTotal: Number(r.LineTotal),
                    SavedAmount: Number.isFinite(saved) ? saved : 0,
                    DiscountType: r.DiscountType || null,
                    DiscountValue: r.DiscountValue != null ? Number(r.DiscountValue) : null,
                    DiscountLabel: r.DiscountLabel || null,
                    ImgPath: r.ImgPath && r.ImgPath.endsWith("/") ? (r.ImgPath + (r.ImgName || "placeholder.jpg")) : (r.ImgPath || "/products/placeholder.jpg"),
                };
            });
            setCart(items);
            if (data.RegisterListID) {
                setGuest((prev) => ({ ...prev, lastRegisterListId: data.RegisterListID }));
            }
            markInsufficient(productID, false);
            setOutOfStockFlag(productID, false);
        } catch (e) {
            console.error('deleteItemFromServer error:', e);
        }
    };

    const updateRegisterIdentity = async ({ customerId, guestId }) => {
        try {
            const id = await ensureRegister();
            const res = await api.patch(`/cashier/registerList/${id}/identity`, { customerId, guestId });
            const data = res.data;
            const items = (data.items || []).map(r => {
                const saved = r.SavedAmount != null ? Number(r.SavedAmount) : computeSaved(r.Qty, r.OriginalPrice, r.Price, r.DiscountType);
                return {
                    ProductID: r.ProductID,
                    Name: r.Name,
                    Qty: Number(r.Qty),
                    Price: Number(r.Price),
                    OriginalPrice: Number(r.OriginalPrice ?? r.Price ?? 0),
                    LineTotal: Number(r.LineTotal),
                    SavedAmount: Number.isFinite(saved) ? saved : 0,
                    DiscountType: r.DiscountType || null,
                    DiscountValue: r.DiscountValue != null ? Number(r.DiscountValue) : null,
                    DiscountLabel: r.DiscountLabel || null,
                    ImgPath: r.ImgPath && r.ImgPath.endsWith("/") ? (r.ImgPath + (r.ImgName || "placeholder.jpg")) : (r.ImgPath || "/products/placeholder.jpg"),
                };
            });
            setCart(items);
            if (customerId != null) {
                setGuest(prev => ({ ...prev, customerId: Number(customerId), sessionId: null }));
                setCustomerName((data.CustomerName) || "Customer");
                setPoints(data.CustomerPoints || 0);
            } else if (guestId != null) {
                const ensured = ensureSessionId({ customerId: null, sessionId: Number(guestId), lastRegisterListId: id });
                setGuest(ensured);
                setCustomerName("Guest");
                setPoints(0);
            }
        } catch (e) {
            console.error('updateRegisterIdentity error:', e);
        }
    };

    const addToCart = (product) => {
        const nextCart = [...cart];
        const idx = nextCart.findIndex((c) => c.ProductID === product.ProductID);
        if (idx >= 0) nextCart[idx].Qty = normalizeQty(nextCart[idx].Qty) + 1;
        else nextCart.push({ ...product, Qty: 1 });
        updateRegisterSnapshot(nextCart).then(() => {
            markInsufficient(product.ProductID, false);
        }).catch(() => {});
    };

    const setCartQty = (productID, next) => {
        const cur = Number(getQty(productID)) || 0;
        const n = next === "" ? "" : Number(next);
        const delta = n === "" ? -cur : (Number(n) - cur);

        lastChangeRef.current = { productId: Number(productID), delta };

        const nextCart = cart
            .map((c) => (c.ProductID === productID ? { ...c, Qty: n } : c))
            .filter((c) => normalizeQty(c.Qty) > 0 || c.Qty === "");

        const qtyVal = normalizeQty(n);
        if (qtyVal <= 0) {
            deleteItemFromServer(productID).then(() => {
                markInsufficient(productID, false);
                setOutOfStockFlag(productID, false);
            });
        } else {
            updateRegisterSnapshot(nextCart).then(() => {
                if (delta <= 0) {
                    markInsufficient(productID, false);
                    setOutOfStockFlag(productID, false);
                }
            }).catch(() => {
            });
        }
    };

    const subtotal = cart.reduce((sum, item) => {
        const lt = Number(item.LineTotal);
        return sum + (Number.isFinite(lt) ? lt : normalizeQty(item.Qty) * Number(item.Price ?? item.FinalPrice ?? 0));
    }, 0);
    const discount = cart.reduce((sum, item) => {
        const saved = Number(item.SavedAmount);
        return sum + (Number.isFinite(saved) ? saved : 0);
    }, 0);
    const taxRate = 0.0825;
    const tax = round2(subtotal * taxRate);
    const total = round2(subtotal + tax);

    const effectiveHasRealCustomer = isCustomerRole && !isGuestCustomer ? true : hasRealCustomer;
    const redeemPointsApplicable = effectiveHasRealCustomer && points >= 500 && subtotal >= 5;
    const redeemDiscount = redeemPointsApplicable ? 5 : 0;
    const effectiveDiscount = discount + redeemDiscount;
    const effectiveTotal = round2(subtotal + tax - redeemDiscount);

    const fetchReceipt = useCallback(async (orderId) => {
        try {
            setReceiptLoading(true);
            setReceiptError("");

            const res = await api.get(`/cashier/orders/${orderId}/receipt`);
            const data = res.data;

            
            const updatedReceipt = {
                ...data,
                RedeemingPoints: redeemPointsApplicable  
            };

            setReceipt(updatedReceipt);
        } catch (err) {
            if (err?.response?.status === 404) {
                setReceipt(null);
                setReceiptError("Receipt not found.");
            } else {
                setReceiptError("Failed to load receipt.");
            }
        } finally {
            setReceiptLoading(false);
        }
    }, [redeemPointsApplicable]);

    
    const handleEmailSearch = async () => {
        if (cart.length > 0) {
            try {
                const res = await api.get(`/cashier/customers/lookup`, {
                    params: { email: email.trim() }  
                });
                const data = res.data;
                if (Array.isArray(data) && data.length > 0) {
                    const found = data[0];
                    await updateRegisterIdentity({ customerId: Number(found.CustomerID), guestId: null });
                    setPoints(found.Points || 0);
                    setCustomerName(`${found.FirstName} ${found.LastName}`);
                    setNotFound(false);
                } else {
                    setNotFound(true);
                    setCustomerName("Guest");
                    setPoints(0);
                }
            } catch {
                setNotFound(true);
                setCustomerName("Guest");
                setPoints(0);
            }
        } else {
            showError("Add items to cart to lookup customer");
        }
    };

    const handleChangeCustomer = async () => {
        const trimmed = email.trim();
        if (!trimmed) {
            const ensured = ensureSessionId({ customerId: null, sessionId: guest.sessionId, lastRegisterListId: guest.lastRegisterListId });
            setGuest(ensured);
            await updateRegisterIdentity({ customerId: null, guestId: Number(ensured.sessionId) });
            setCustomerName("Guest");
            setPoints(0);
            setNotFound(false);
        } else {
            await handleEmailSearch();
        }
    };

    const handleCheckout = async () => {
        if (!cart.length) return showError("Cart is empty!");
        try {
            const id = await ensureRegister();

            let customerId = null;
            let guestId = null;

            if (isCustomerRole && !isGuestCustomer) {
                customerId = Number(user.id);
            } else if (isGuestCustomer) {
                guestId = Number(guest.sessionId);
            } else {
                customerId = hasRealCustomer ? Number(guest.customerId) : null;
                guestId = hasRealCustomer ? null : Number(guest.sessionId);
            }

            const payload = {
                registerListId: Number(id),
                email: email.trim() || null,  
                customerId,
                guestId,
                employeeId,
                items: cart.map((c) => ({ ProductID: Number(c.ProductID), Qty: normalizeQty(c.Qty) })),
                taxRate,
            };

            const res = await api.post(`/cashier/register`, payload);
            if (res.status === 201) {
                const body = res.data || {};
                const orderId = body && body.orderId ? Number(body.orderId) : null;

                setCart([]);

                if (!isCustomerRole || isGuestCustomer) {
                    setCustomerName("Guest");
                    setPoints(0);
                    setEmail("");  
                    setGuest(() => {
                        const fresh = ensureSessionId({ customerId: null, sessionId: null, lastRegisterListId: null });
                        saveGuest(fresh);
                        return fresh;
                    });
                } else {
                    setGuest(prev => ({ ...prev, lastRegisterListId: null }));
                }

                setInsufficient(new Map());
                setOutOfStock(new Map());
                await fetchProducts();
                setShowReceipt(true);
                await fetchRestockNotifications();
                if (orderId) {
                    fetchReceipt(orderId);
                }
                return;
            }

            const errMsg = (res.data && (res.data.message || res.data.error)) || 'Checkout failed';
            showError(errMsg);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || String(err);
            showError("Checkout failed: " + msg);
        }
    };

    return (
        <div className="cashier-container">
            <div className="cashier-left">
                <div className="filters">
                    <input type="text" placeholder="Search by Name or ID..." value={search} onChange={onSearchChange}/>
                    <select value={category} onChange={onCategoryChange}>
                        <option value="All">All</option>
                        {categories.map((cat) => (<option key={cat.CategoryID} value={cat.CategoryID}>{cat.CategoryName}</option>))}
                    </select>
                </div>

                <div className="product-scroll">
                    {loading ? (
                        <p className="loading">Loading products...</p>
                    ) : (
                        <div className="product-grid">
                            {visible.map((p) => {
                                const qty = getQty(p.ProductID);
                                const labelId = `prod-${p.ProductID}-label`;
                                const type = (p.DiscountType || "").toLowerCase();
                                const val = p.DiscountValue != null ? Number(p.DiscountValue) : null;
                                const hasDiscount = Number(p.OriginalPrice) > Number(p.FinalPrice) || type === "bogo";
                                let badgeText = "";
                                if (type === "percentage" && val != null) badgeText = `${val}% off`;
                                else if (type === "fixed" && val != null) badgeText = `${formatCurrency(val)} off`;
                                else if (type === "bogo") badgeText = "BOGO";
                                else if (Number(p.OriginalPrice) > Number(p.FinalPrice)) {
                                    const pct = Math.round((1 - Number(p.FinalPrice) / Number(p.OriginalPrice)) * 100);
                                    badgeText = `${pct}% off`;
                                }
                                const showInlinePrices = type !== "bogo" && Number(p.OriginalPrice) > Number(p.FinalPrice);

                                const id = p.ProductID;
                                const disablePlus = isInsufficient(id.toString()) || isOOS(id.toString());
                                const hideQtyControls = isOOS(id);

                                return (
                                    <div key={id} className={`product-card ${qty > 0 ? "in-cart" : ""} ${hideQtyControls ? "is-out" : ""}`}>
                                        {hasDiscount && (<span className="discount-badge" aria-label={`Discount ${badgeText}`}>{badgeText}</span>)}
                                        <img src={p.ImgPath} alt={p.Name}
                                             onError={(e) => { const el = e.currentTarget; el.onerror = null; el.src = "/products/placeholder.jpg"; }}/>
                                        <div className="product-info">
                                            <h3 id={labelId}>{p.Name}</h3>
                                            <p className="brand">{p.Brand}</p>
                                            <p className="unit">{p.QuantityValue} {p.QuantityUnit}</p>

                                            {!showInlinePrices && <p className="price">{formatCurrency(p.FinalPrice)}</p>}

                                            {showInlinePrices && (
                                                <div className="price-box-inline" aria-label="Current discounted price and original price">
                                                    <span className="new-price" aria-label="Current price">{formatCurrency(p.FinalPrice)}</span>
                                                    <span className="old-price" aria-label="Original price">{formatCurrency(p.OriginalPrice)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {hideQtyControls ? (
                                            <div className="oos-pill" role="note" aria-label="Out of Stock">Out of Stock</div>
                                        ) : qty > 0 ? (
                                            <QtyStepper value={qty} onSet={(next) => setCartQty(id, next)} labelId={labelId} />
                                        ) : (
                                            <button
                                                className={`btn-primary ${disablePlus ? "plus-disabled" : ""}`}
                                                onClick={() => addToCart(p)}
                                                disabled={disablePlus}
                                                aria-disabled={disablePlus}
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pagination">
                    <button className={`page-arrow ${currentPage === 1 ? "is-disabled" : ""}`}
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>&lt;</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button key={p} className={`page-num ${p === currentPage ? "is-active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                    ))}
                    <button className={`page-arrow ${currentPage === totalPages ? "is-disabled" : ""}`}
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}>&gt;</button>
                </div>
            </div>

            <div className="cashier-right">
                <div className="cart-header">
                    <div className="cart-title">
                        <h2>
                            Cart {effectiveHasRealCustomer ? customerName : "Guest"}
                        </h2>

                        {effectiveHasRealCustomer && (
                            <div className="cart-points">
                                <span className="points-value">{points} pts</span>
                                <div className="points-tooltip-wrapper">
                                    <Info size={16} className="points-icon" />
                                    <span className="points-tooltip">
                                        5 pts per $1 spent. Greater than 500 pts = $5 off on next order.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {}
                    {!isCustomerRole && (
                        <div className="cart-phone">
                            <input
                                type="email"  
                                placeholder="Email"  
                                value={email}  
                                onChange={(e) => setEmail(e.target.value)}  
                                className={notFound ? "error" : ""}
                            />
                            {hasRealCustomer ? (
                                <button onClick={handleChangeCustomer}>Change</button>
                            ) : (
                                <button onClick={handleEmailSearch}>Find</button>  
                            )}
                        </div>
                    )}
                </div>

                {notFound && <div className="inline-error">Customer not found</div>}

                <div className="cart-scroll">
                    {cart.length === 0 ? (
                        <p className="empty-cart">No items in cart</p>
                    ) : (
                        <ul>
                            {cart.map((item) => {
                                const line = Number.isFinite(Number(item.LineTotal))
                                    ? Number(item.LineTotal)
                                    : normalizeQty(item.Qty) * Number(item.Price ?? item.FinalPrice ?? 0);
                                const labelId = `cart-${item.ProductID}-label`;
                                const type = (item.DiscountType || "").toLowerCase();
                                const val = item.DiscountValue != null ? Number(item.DiscountValue) : null;
                                const label = item.DiscountLabel
                                    || (type === "percentage" && val != null ? `${val}% off`
                                        : type === "fixed" && val != null ? `${formatCurrency(val)} off`
                                            : type === "bogo" ? "BOGO" : null);

                                const isBogo = type === "bogo";
                                const freeUnits = isBogo ? Math.floor(normalizeQty(item.Qty) / 2) : 0;

                                const id = item.ProductID;
                                const disablePlus = isInsufficient(id) || isOOS(id);

                                const onCartQtySet = (next) => {
                                    const cur = Number(item.Qty) || 0;
                                    const n = next === "" ? "" : Number(next);
                                    if (n !== "" && n > cur && disablePlus) return;
                                    setCartQty(id, next);
                                };

                                return (
                                    <li key={id} className="cart-item">
                                        <div className="cart-item-left">
                                            <img src={item.ImgPath} alt={item.Name}
                                                 onError={(e) => { const el = e.currentTarget; el.onerror = null; el.src = "/products/placeholder.jpg"; }}/>
                                            <div className="cart-item-info">
                                                <span id={labelId}>{item.Name}</span>
                                                <span className="cart-subtotal">{formatCurrency(line)}</span>
                                                {label && (<span className="cart-discount-note" aria-label={`Discount ${label}`}>{label}</span>)}
                                                {isBogo && freeUnits > 0 && (<span className="cart-discount-note">+ {freeUnits} free</span>)}
                                            </div>
                                        </div>
                                        <div className="cart-item-right">
                                            <QtyStepper
                                                value={item.Qty}
                                                onSet={onCartQtySet}
                                                labelId={labelId}
                                                disablePlusVisual={disablePlus}
                                            />
                                            <button className="btn-remove" onClick={() => deleteItemFromServer(id)}>×</button>
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
                        <span>Discount{redeemPointsApplicable && <span className="redeeming-note">(redeeming 500 points)</span>}: </span>
                        <span>
                            -{formatCurrency(effectiveDiscount)}
                        </span>
                    </div>

                    <div className="summary-row">
                        <span>Tax (8.25%):</span>
                        <span>{formatCurrency(tax)}</span>
                    </div>

                    <div className="summary-row total">
                        <span>Total:</span>
                        <span>{formatCurrency(effectiveTotal)}</span>
                    </div>

                    <button className="checkout-btn" onClick={handleCheckout}>Checkout</button>
                </div>
            </div>

            <Modal
                open={showReceipt}
                onClose={() => {
                    setShowReceipt(false);
                    setReceipt(null);
                    setReceiptError("");
                    if (isCustomerRole) {
                        handleLogout();
                    }
                }}
                title="Receipt"
                describedById="receipt-desc"
            >
                <div className="rx-toolbar" id="receipt-desc" aria-live="polite">
                    <button
                        type="button"
                        className="rx-icon rx-left"
                        aria-label="Print receipt"
                        title="Print"
                        onClick={handlePrintReceipt}
                    >
                        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
                            <path d="M6 9V2h12v7h1a3 3 0 0 1 3 3v6h-4v3H6v-3H2v-6a3 3 0 0 1 3-3h1zm2-5v5h8V4H8zm8 14H8v3h8v-3zm5-2v-4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v4h3v-3h12v3h3z" fill="currentColor"/>
                        </svg>
                    </button>

                    <div className="rx-title">
                        <span className="rx-ttl">POS Receipt</span>
                        {receipt?.OrderID != null && <span className="rx-sub">Order #{receipt.OrderID}</span>}
                    </div>

                    <button
                        type="button"
                        className="rx-icon rx-right"
                        aria-label="Close dialog"
                        title="Close"
                        onClick={() => {
                            setShowReceipt(false);
                            setReceipt(null);
                            setReceiptError("");
                            if (isCustomerRole) {
                                handleLogout();
                            }
                        }}
                    >
                        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
                            <path d="M18.3 5.71 12 12.01l-6.3-6.3L4.29 7.1l6.3 6.3-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>

                {receiptLoading && <p className="receipt-loading">Loading receipt…</p>}
                {!receiptLoading && receiptError && <div className="receipt-error" role="alert">{receiptError}</div>}
                {!receiptLoading && !receiptError && receipt && (
                    <div className="receipt-body">
                        <ReceiptView data={receipt} />

                        {isCustomerRole && (
                            <div style={{ marginTop: "20px", textAlign: "center" }}>
                                <button
                                    className="checkout-btn"
                                    onClick={handleLogout}
                                    style={{ width: "100%" }}
                                >
                                    Thank you for shopping with Grocery7
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}

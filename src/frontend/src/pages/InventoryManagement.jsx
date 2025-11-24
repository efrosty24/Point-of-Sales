import React, { useEffect, useState } from "react";
import "./InventoryManagement.css";
import api from "../utils/api.js";
import ConfirmDialog from "../components/ConfirmDialog";

export default function InventoryManagement() {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [supplierFilter, setSupplierFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [restock, setRestock] = useState({});
    const [message, setMessage] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [showSupplierCreate, setShowSupplierCreate] = useState(false);
    const [showCategoryCreate, setShowCategoryCreate] = useState(false);
    const [showCategoryEdit, setShowCategoryEdit] = useState(false);
    const [showCategoryManage, setShowCategoryManage] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [showProductEdit, setShowProductEdit] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteType, setDeleteType] = useState(null); // 'product' or 'category'
    const [newProduct, setNewProduct] = useState({Name: "", Brand: "", Price: "", Stock: "", SupplierID: "", CategoryID: "", ReorderThreshold: "", ImgPath: ""});
    const [newSupplier, setNewSupplier] = useState({ Name: '', Phone: '', Email: '', Address: '' });
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        fetchSuppliers();
        fetchCategories();
        fetchProducts();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [search, supplierFilter, categoryFilter]);

    async function fetchCategories() {
        try {
            const res = await api.get("/admin/inventory/categories");
            setCategories(Array.isArray(res.data) ? res.data : []);
        } catch {
            setCategories([]);
        }
    }

    async function fetchSuppliers() {
        try {
            const res = await api.get("/admin/inventory/suppliers");
            setSuppliers(Array.isArray(res.data) ? res.data : []);
        } catch {
            setSuppliers([]);
        }
    }

    async function fetchProducts() {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (supplierFilter) params.supplier = supplierFilter;
            if (categoryFilter) params.category = categoryFilter;
            const res = await api.get("/admin/inventory/products", { params });
            setProducts(Array.isArray(res.data) ? res.data : []);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }

    function updateQty(id, val) {
        setRestock((s) => ({ ...s, [id]: val }));
    }

    async function handleRestock() {
        if (!supplierFilter) {
            setMessage("Select a supplier before restocking");
            return;
        }

        const itemsToRestock = [];
        for (const [productId, qty] of Object.entries(restock)) {
            const quantity = Number(qty);
            if (quantity > 0) {
                const product = products.find(p => p.ProductID === Number(productId));

                if (!product) {
                    console.log(`Skipping ProductID ${productId} - not in current view`);
                    continue;
                }

                const minQuantity = product ? Math.ceil(product.ReorderThreshold * 1.1) : 0;

                console.log("Product to restock:", {
                    productId,
                    quantity,
                    product: {
                        ProductID: product.ProductID,
                        Name: product.Name,
                        SupplierID: product.SupplierID,
                        SupplierName: product.SupplierName
                    }
                });

                if (quantity < minQuantity) {
                    setMessage(`${product.Name} needs at least ${minQuantity} units (10% above threshold)`);
                    return;
                }

                itemsToRestock.push({ ProductID: Number(productId), Qty: quantity });
            }
        }

        if (itemsToRestock.length === 0) {
            setMessage("Enter quantities to restock");
            return;
        }

        try {
            const payload = {
                SupplierID: Number(supplierFilter),
                items: itemsToRestock,
            };
            console.log("Restock payload:", payload);

            const res = await api.post("/admin/inventory/restock", payload);

            if (res.data && res.data.ok) {
                setMessage(`Restocked ${res.data.itemsUpdated || itemsToRestock.length} item(s) successfully`);
                setRestock({});
                fetchProducts();
            } else {
                setMessage("Restock completed");
            }
        } catch (err) {
            const errorMsg = err?.response?.data?.error || err?.message || "Restock failed";
            console.error("Restock error:", err?.response?.data || err);
            setMessage(`Error: ${errorMsg}`);
        }
    }

    function confirmDeleteCategory(id) {
        setDeleteId(id);
        setDeleteType('category');
        setShowDeleteConfirm(true);
    }

    async function handleDeleteCategory() {
        if (!deleteId) return;
        try {
            await api.delete(`/admin/inventory/categories/${deleteId}`);
            setMessage("Category deleted");
            fetchCategories();
        } catch (err) {
            setMessage(err?.response?.data?.error || "Failed to delete category");
        } finally {
            setShowDeleteConfirm(false);
            setDeleteId(null);
            setDeleteType(null);
        }
    }

    async function handleUpdateCategory(e) {
        e.preventDefault();
        if (!editingCategory || !editingCategory.CategoryName) {
            setMessage("Category name is required");
            return;
        }
        try {
            setLoading(true);
            await api.patch(`/admin/inventory/categories/${editingCategory.CategoryID}`, {
                CategoryName: editingCategory.CategoryName,
            });
            setMessage("Category updated");
            setShowCategoryEdit(false);
            setEditingCategory(null);
            fetchCategories();
        } catch (err) {
            setMessage(err?.response?.data?.error || "Failed to update category");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateProduct(e) {
        e.preventDefault();
        if (!editingProduct) return;
        try {
            setLoading(true);
            const body = {
                Name: editingProduct.Name,
                Brand: editingProduct.Brand,
                Price: Number(editingProduct.Price || 0),
                Stock: Number(editingProduct.Stock || 0),
                SupplierID: editingProduct.SupplierID ? Number(editingProduct.SupplierID) : null,
                CategoryID: editingProduct.CategoryID ? Number(editingProduct.CategoryID) : null,
                ReorderThreshold: Number(editingProduct.ReorderThreshold || 0),
                ImgPath: editingProduct.ImgPath,
                ImgName: editingProduct.ImgPath ? editingProduct.ImgPath.substring(editingProduct.ImgPath.lastIndexOf('/') + 1) : null
            };
            await api.patch(`/admin/inventory/products/${editingProduct.ProductID}`, body);
            setMessage("Product updated");
            setShowProductEdit(false);
            setEditingProduct(null);
            fetchProducts();
        } catch (err) {
            setMessage(err?.response?.data?.error || "Failed to update product");
        } finally {
            setLoading(false);
        }
    }

    function confirmDeleteProduct(id) {
        setDeleteId(id);
        setDeleteType('product');
        setShowDeleteConfirm(true);
    }

    async function handleDeleteProduct() {
        if (!deleteId) return;
        try {
            setLoading(true);
            const res = await api.delete(`/admin/inventory/products/${deleteId}`);
            setMessage(res.data?.message || "Product deleted");
            await fetchProducts();
        } catch (err) {
            setMessage(err?.response?.data?.error || err?.response?.data?.message || "Failed to delete product");
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
            setDeleteId(null);
            setDeleteType(null);
        }
    }

    function cancelDelete() {
        setShowDeleteConfirm(false);
        setDeleteId(null);
        setDeleteType(null);
    }

    return (
        <div className="page-wrap">
            <div className="page-card">
                <div className="page-header">
                    <h1 className="page-title">Inventory Management</h1>
                    <div className="page-actions">
                        <button className="btn primary" onClick={() => setShowCreate(true)}>+ Add New</button>
                    </div>
                </div>

                <div className="controls-row">
                    <input
                        className="input"
                        placeholder="Search by name or brand"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        className="select"
                        value={supplierFilter}
                        onChange={(e) => {
                            setSupplierFilter(e.target.value);
                            setRestock({});
                        }}
                    >
                        <option value="">All suppliers</option>
                        {suppliers.map((s) => (
                            <option key={s.SupplierID} value={s.SupplierID}>{s.Name}</option>
                        ))}
                    </select>

                    <select className="select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">All categories</option>
                        {categories.map(c => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
                    </select>

                    <button className="btn" onClick={() => setShowCategoryManage(true)}>Manage Categories</button>

                    <button className="btn" onClick={() => setShowSupplierCreate(true)}>+ Supplier</button>

                    <button className="btn" onClick={fetchProducts} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
                </div>

                {message && <div className="message">{message}</div>}

                <div className="table-wrap" role="region" aria-label="Products table">
                    {loading ? (
                        <div className="loading">Loading products…</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Image</th>
                                <th>Product</th>
                                <th>Brand</th>
                                <th className="align-right">Stock</th>
                                <th className="align-right">Reorder</th>
                                <th className="align-right">Price</th>
                                <th>Supplier</th>
                                <th className="align-center">Restock</th>
                                <th className="align-center">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {products.map((p) => (
                                <tr key={p.ProductID}>
                                    <td>{p.ProductID}</td>
                                    <td>
                                        {p.ImgPath ? (
                                            <img
                                                src={p.ImgPath}
                                                alt={p.Name}
                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '0.85em', color: '#999' }}>—</span>
                                        )}
                                    </td>
                                    <td className="product-cell">
                                        <div className="product-name">{p.Name}</div>
                                    </td>
                                    <td>{p.Brand}</td>
                                    <td className={`align-right ${p.Stock < p.ReorderThreshold ? 'low-stock' : ''}`}>{p.Stock}</td>
                                    <td className="align-right">{p.ReorderThreshold}</td>
                                    <td className="align-right">${Number(p.Price || 0).toFixed(2)}</td>
                                    <td>{p.SupplierName || '—'}</td>
                                    <td className="align-center">
                                        <input
                                            className="input-number"
                                            type="number"
                                            min={Math.ceil(p.ReorderThreshold * 1.1)}
                                            value={restock[p.ProductID] || ''}
                                            onChange={(e) => updateQty(p.ProductID, e.target.value)}
                                            aria-label={`Restock quantity for ${p.Name}`}
                                            placeholder={`Min: ${Math.ceil(p.ReorderThreshold * 1.1)}`}
                                        />
                                    </td>
                                    <td className="align-center">
                                        <button
                                            className="btn"
                                            onClick={() => {
                                                setEditingProduct(p);
                                                setShowProductEdit(true);
                                            }}
                                            style={{ marginRight: '4px' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn"
                                            onClick={() => confirmDeleteProduct(p.ProductID)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="no-data">No products found.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="actions-footer">
                    <button className="btn primary" onClick={handleRestock} disabled={!supplierFilter}>Restock Selected</button>
                    <button className="btn" onClick={() => setRestock({})}>Reset Quantities</button>
                    {!supplierFilter && (
                        <span style={{ color: '#d85534ff', fontSize: '20px', marginLeft: '30px' }}>
                            Select a supplier above to enable restocking
                        </span>
                    )}
                </div>

                {/* CREATE PRODUCT MODAL */}
                {showCreate && (
                    <div className="overlay">
                        <form
                            className="modal"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const body = {
                                    Name: newProduct.Name,
                                    Brand: newProduct.Brand,
                                    Price: Number(newProduct.Price || 0),
                                    Stock: Number(newProduct.Stock || 0),
                                    SupplierID: newProduct.SupplierID ? Number(newProduct.SupplierID) : null,
                                    CategoryID: newProduct.CategoryID ? Number(newProduct.CategoryID) : null,
                                    ReorderThreshold: Number(newProduct.ReorderThreshold || 0),
                                    IsPricePerQty: false,
                                    QuantityValue: 1,
                                    QuantityUnit: "unit",
                                    ImgPath: newProduct.ImgPath,
                                    ImgName: newProduct.ImgPath ? newProduct.ImgPath.substring(newProduct.ImgPath.lastIndexOf('/') + 1) : null,
                                };

                                if (body.SupplierID === null || body.CategoryID === null) {
                                    setMessage("SupplierID and CategoryID are required.");
                                    return;
                                }

                                console.log("Creating product with data:", body);
                                try {
                                    setLoading(true);
                                    const res = await api.post("/admin/inventory/products", body);
                                    setMessage(res.data?.message || "Product created");
                                    setShowCreate(false);
                                    setNewProduct({ Name: "", Brand: "", Price: "", Stock: "", SupplierID: "", CategoryID: "", ReorderThreshold: ""});
                                    fetchProducts();
                                } catch (err) {
                                    console.error("Create product error:", err?.response?.data || err);
                                    setMessage(err?.response?.data?.error || "Failed to create product");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            <h3>Create Product</h3>
                            <div className="form-grid">
                                <input className="input" placeholder="Name" value={newProduct.Name} onChange={(e) => setNewProduct({ ...newProduct, Name: e.target.value })} required />
                                <input className="input" placeholder="Brand" value={newProduct.Brand} onChange={(e) => setNewProduct({ ...newProduct, Brand: e.target.value })} />
                                <input className="input" placeholder="Price" type="number" step="0.01" value={newProduct.Price} onChange={(e) => setNewProduct({ ...newProduct, Price: e.target.value })} />
                                <input className="input" placeholder="Stock" type="number" value={newProduct.Stock} onChange={(e) => setNewProduct({ ...newProduct, Stock: e.target.value })} />
                                <input className="input" placeholder="Image URL (ImgPath)"  value={newProduct.ImgPath} onChange={(e) => setNewProduct({ ...newProduct, ImgPath: e.target.value })}/>
                                <select
                                    className="select"
                                    value={newProduct.SupplierID}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewProduct({ ...newProduct, SupplierID: val === "" ? "" : Number(val) });
                                    }}
                                    required
                                >
                                    <option value="">Select supplier</option>
                                    {suppliers.map((s) => (
                                        <option key={s.SupplierID} value={s.SupplierID}>{s.Name}</option>
                                    ))}
                                </select>
                                <select
                                    className="select"
                                    value={newProduct.CategoryID || ""}
                                    onChange={(e) => setNewProduct({ ...newProduct, CategoryID: e.target.value === "" ? "" : Number(e.target.value) })}
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map(c => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
                                </select>
                                <input className="input" placeholder="Reorder threshold" type="number" value={newProduct.ReorderThreshold} onChange={(e) => setNewProduct({ ...newProduct, ReorderThreshold: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button className="btn" type="button" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button
                                    className="btn primary"
                                    type="submit"
                                    onClick={(e) => {
                                        if (newProduct.SupplierID === "" || newProduct.SupplierID == null) {
                                            e.preventDefault();
                                            setMessage("Please select a supplier before creating the product.");
                                        }
                                    }}
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* SUPPLIER CREATE MODAL */}
                {showSupplierCreate && (
                    <div className="overlay">
                        <form
                            className="modal"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!newSupplier.Name) {
                                    setMessage('Supplier name is required');
                                    return;
                                }
                                try {
                                    setLoading(true);
                                    const body = { Name: newSupplier.Name, Phone: newSupplier.Phone || null, Email: newSupplier.Email || null, Address: newSupplier.Address || null };
                                    const res = await api.post("/admin/inventory/suppliers", body);
                                    const id = res.data?.SupplierID || res.data?.supplier?.SupplierID || res.data?.insertId || null;
                                    const created = { SupplierID: id || Date.now() * -1, Name: newSupplier.Name, Phone: newSupplier.Phone || null, Email: newSupplier.Email || null, Address: newSupplier.Address || null };
                                    setSuppliers((s) => [...s, created]);
                                    if (id) {
                                        setSupplierFilter(id);
                                        setNewProduct({ ...newProduct, SupplierID: id });
                                        setMessage('Supplier created');
                                    } else {
                                        setMessage('Supplier created (no id returned)');
                                    }
                                    setShowSupplierCreate(false);
                                    setNewSupplier({ Name: '', Phone: '', Email: '', Address: '' });
                                } catch (err) {
                                    setMessage(err?.response?.data?.message || err?.response?.data?.error || 'Failed to create supplier');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            <h3>Create Supplier</h3>
                            <div className="form-grid">
                                <input className="input" placeholder="Name" value={newSupplier.Name} onChange={(e) => setNewSupplier({ ...newSupplier, Name: e.target.value })} required />
                                <input className="input" placeholder="Phone" value={newSupplier.Phone} onChange={(e) => setNewSupplier({ ...newSupplier, Phone: e.target.value })} />
                                <input className="input" placeholder="Email" value={newSupplier.Email} onChange={(e) => setNewSupplier({ ...newSupplier, Email: e.target.value })} />
                                <input className="input" placeholder="Address" value={newSupplier.Address} onChange={(e) => setNewSupplier({ ...newSupplier, Address: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button className="btn" type="button" onClick={() => setShowSupplierCreate(false)}>Cancel</button>
                                <button className="btn primary" type="submit">Create</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* CATEGORY CREATE MODAL */}
                {showCategoryCreate && (
                    <div className="overlay">
                        <form
                            className="modal"
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!newCategoryName) {
                                    setMessage('Category name is required');
                                    return;
                                }
                                try {
                                    setLoading(true);
                                    const body = { CategoryName: newCategoryName };
                                    const res = await api.post("/admin/inventory/categories", body);
                                    const id = res.data?.CategoryID || res.data?.insertId || null;
                                    const created = { CategoryID: id || Date.now() * -1, CategoryName: newCategoryName };
                                    setCategories((c) => [...c, created]);
                                    if (id) {
                                        setNewProduct({ ...newProduct, CategoryID: id });
                                        setMessage('Category created');
                                    } else {
                                        setMessage('Category created (no id returned)');
                                    }
                                    setShowCategoryCreate(false);
                                    setNewCategoryName('');
                                } catch (err) {
                                    setMessage(err?.response?.data?.message || err?.response?.data?.error || 'Failed to create category');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            <h3>Create Category</h3>
                            <div className="form-grid">
                                <input className="input" placeholder="Category name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required />
                            </div>
                            <div className="modal-actions">
                                <button className="btn" type="button" onClick={() => setShowCategoryCreate(false)}>Cancel</button>
                                <button className="btn primary" type="submit">Create</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* CATEGORY EDIT MODAL */}
                {showCategoryEdit && editingCategory && (
                    <div className="overlay">
                        <form className="modal" onSubmit={handleUpdateCategory}>
                            <h3>Edit Category</h3>
                            <div className="form-grid">
                                <input
                                    className="input"
                                    placeholder="Category name"
                                    value={editingCategory.CategoryName}
                                    onChange={(e) =>
                                        setEditingCategory({ ...editingCategory, CategoryName: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="btn"
                                    type="button"
                                    onClick={() => {
                                        setShowCategoryEdit(false);
                                        setEditingCategory(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button className="btn primary" type="submit">
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* PRODUCT EDIT MODAL */}
                {showProductEdit && editingProduct && (
                    <div className="overlay">
                        <form className="modal" onSubmit={handleUpdateProduct}>
                            <h3>Edit Product</h3>
                            <div className="form-grid">
                                <input
                                    className="input"
                                    placeholder="Name"
                                    value={editingProduct.Name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, Name: e.target.value })}
                                    required
                                />
                                <input
                                    className="input"
                                    placeholder="Brand"
                                    value={editingProduct.Brand || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, Brand: e.target.value })}
                                />
                                <input
                                    className="input"
                                    placeholder="Price"
                                    type="number"
                                    step="0.01"
                                    value={editingProduct.Price}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, Price: e.target.value })}
                                />
                                <input
                                    className="input"
                                    placeholder="Stock"
                                    type="number"
                                    value={editingProduct.Stock}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, Stock: e.target.value })}
                                />
                                <div className="grid-span-2">
                                    <input
                                        className="input"
                                        placeholder="Image URL (ImgPath)"
                                        value={editingProduct.ImgPath || ''}
                                        onChange={(e) => setEditingProduct({
                                            ...editingProduct,
                                            ImgPath: e.target.value,
                                            // Also update ImgName based on URL for consistency
                                            ImgName: e.target.value ? e.target.value.substring(e.target.value.lastIndexOf('/') + 1) : null
                                        })}
                                    />
                                    <p className="url-helper-text">Current URL: {editingProduct.ImgPath || 'None'}</p>

                                <select
                                    className="select"
                                    value={editingProduct.SupplierID || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, SupplierID: e.target.value === "" ? "" : Number(e.target.value) })}
                                    required
                                >
                                    <option value="">Select supplier</option>
                                    {suppliers.map((s) => (
                                        <option key={s.SupplierID} value={s.SupplierID}>{s.Name}</option>
                                    ))}
                                </select>
                                <select
                                    className="select"
                                    value={editingProduct.CategoryID || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, CategoryID: e.target.value === "" ? "" : Number(e.target.value) })}
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map(c => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
                                </select>
                                <input
                                    className="input"
                                    placeholder="Reorder threshold"
                                    type="number"
                                    value={editingProduct.ReorderThreshold}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, ReorderThreshold: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="btn"
                                    type="button"
                                    onClick={() => {
                                        setShowProductEdit(false);
                                        setEditingProduct(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button className="btn primary" type="submit">
                                    Update
                                </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* CATEGORY MANAGE MODAL */}
                {showCategoryManage && (
                    <div className="overlay">
                        <div className="modal" style={{ maxWidth: '700px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                            <h3>Manage Categories</h3>
                            <div style={{ marginBottom: '20px' }}>
                                <button className="btn primary" onClick={() => { setShowCategoryCreate(true); setShowCategoryManage(false); }}>+ Add Category</button>
                            </div>
                            <div className="table-wrap" style={{ overflowY: 'auto', flex: 1, overflowX: 'visible' }}>
                                <table className="data-table" style={{ width: '100%', tableLayout: 'auto' }}>
                                    <thead>
                                    <tr>
                                        <th style={{ width: '50%' }}>Category Name</th>
                                        <th style={{ width: '50%' }} className="align-center">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {categories.map((c) => (
                                        <tr key={c.CategoryID}>
                                            <td>{c.CategoryName}</td>
                                            <td className="align-center">
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button
                                                        className="btn"
                                                        onClick={() => {
                                                            setEditingCategory(c);
                                                            setShowCategoryEdit(true);
                                                            setShowCategoryManage(false);
                                                        }}
                                                        style={{ padding: '6px 12px', fontSize: '14px', whiteSpace: 'nowrap' }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn"
                                                        onClick={() => {
                                                            confirmDeleteCategory(c.CategoryID);
                                                            setShowCategoryManage(false);
                                                        }}
                                                        style={{ padding: '6px 12px', fontSize: '14px', background: '#fee', color: '#c00', whiteSpace: 'nowrap' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {categories.length === 0 && (
                                        <tr>
                                            <td colSpan={2} className="no-data">No categories found.</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal-actions">
                                <button
                                    className="btn"
                                    type="button"
                                    onClick={() => setShowCategoryManage(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title={deleteType === 'category' ? 'Delete Category' : 'Delete Product'}
                message={
                    deleteType === 'category' 
                        ? 'Delete this category? Products using it may be affected.' 
                        : 'Are you sure you want to delete this product? This action cannot be undone.'
                }
                onConfirm={deleteType === 'category' ? handleDeleteCategory : handleDeleteProduct}
                onCancel={cancelDelete}
            />
        </div>
    );
}

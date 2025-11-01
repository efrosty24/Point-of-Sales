import React, { useEffect, useState } from "react";
import "./InventoryManagement.css";
import api from "../utils/api.js"; 

export default function InventoryManagement() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [restock, setRestock] = useState({});
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showSupplierCreate, setShowSupplierCreate] = useState(false);
  const [showCategoryCreate, setShowCategoryCreate] = useState(false);
  const [newProduct, setNewProduct] = useState({ Name: "", Brand: "", Price: "", Stock: "", SupplierID: "", ReorderThreshold: "" });
  const [newSupplier, setNewSupplier] = useState({ Name: '', Phone: '', Email: '', Address: '' });
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchSuppliers();
    fetchCategories();
    fetchProducts();
  }, []);

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
    const items = Object.entries(restock)
      .map(([ProductID, Qty]) => ({ ProductID: Number(ProductID), Qty: Number(Qty) }))
      .filter((it) => it.Qty > 0);
    if (!items.length) {
      setMessage("Enter quantities to restock");
      return;
    }
    if (!supplierFilter) {
      setMessage("Select a supplier before restocking");
      return;
    }
    try {
      const res = await api.post("/admin/inventory/restock", {
        SupplierID: Number(supplierFilter),
        items,
      });
      if (res.data && res.data.ok) {
        setMessage(`Restocked ${res.data.itemsUpdated || items.length} items`);
        setRestock({});
        fetchProducts();
      } else {
        setMessage("Restock completed");
      }
    } catch {
      setMessage("Restock failed");
    }
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

          <select className="select" value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s.SupplierID} value={s.SupplierID}>{s.Name}</option>
            ))}
          </select>

          <select className="select" value={""} onChange={() => {}}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>)}
          </select>

          <button className="btn" onClick={() => setShowCategoryCreate(true)}>+ Category</button>

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
                  <th>Product</th>
                  <th>Brand</th>
                  <th className="align-right">Stock</th>
                  <th className="align-right">Reorder</th>
                  <th className="align-right">Price</th>
                  <th>Supplier</th>
                  <th className="align-center">Restock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.ProductID}>
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
                        min="0"
                        value={restock[p.ProductID] || ''}
                        onChange={(e) => updateQty(p.ProductID, e.target.value)}
                        aria-label={`Restock quantity for ${p.Name}`}
                      />
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="no-data">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="actions-footer">
          <button className="btn primary" onClick={handleRestock}>Restock Selected</button>
          <button className="btn" onClick={() => setRestock({})}>Reset Quantities</button>
        </div>

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
                };
                try {
                  setLoading(true);
                  const res = await api.post("/admin/inventory/products", body);
                  setMessage(res.data?.message || "Product created");
                  setShowCreate(false);
                  setNewProduct({ Name: "", Brand: "", Price: "", Stock: "", SupplierID: "", ReorderThreshold: "" });
                  fetchProducts();
                } catch (err) {
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
      </div>
    </div>
  );
}
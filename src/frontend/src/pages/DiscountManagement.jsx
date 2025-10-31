import React, { useEffect, useState, useRef } from "react";
import "./DiscountManagement.css";
import api from "../utils/api.js"; 

export default function DiscountManagement() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState("");
  const eventNameRef = useRef(null);

  useEffect(() => {
    fetchEvents();
    fetchProducts();
  }, []);

  async function fetchEvents() {
    try {
      const res = await api.get("/admin/sale-events");
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch {
      setEvents([]);
    }
  }

  async function fetchProducts() {
    try {
      const res = await api.get("/admin/inventory/products");
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setProducts([]);
    }
  }

  async function fetchDiscounts(evId) {
    if (!evId) return setDiscounts([]);
    try {
      const res = await api.get(`/admin/sale-events/${evId}/discounts`);
      setDiscounts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDiscounts([]);
    }
  }

  async function createEvent(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      const body = {
        Name: form.get("name"),
        Description: form.get("description"),
        StartDate: form.get("start"),
        EndDate: form.get("end"),
      };
      const res = await api.post("/admin/sale-events", body);
      if (res.status === 201 || (res.data && res.data.ok)) {
        setMsg(res.data?.message || "Event created");
        fetchEvents();
      } else {
        setMsg(res.data?.message || `Unexpected response: ${res.status}`);
      }
    } catch (err) {
      setMsg(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create event"
      );
    }
  }

  async function createDiscount(e) {
    e.preventDefault();
    if (!selectedEventId) return setMsg("Select an event");
    const form = new FormData(e.target);
    try {
      const body = {
        ProductID: Number(form.get("product")),
        DiscountType: form.get("type"),
        DiscountValue: Number(form.get("value")),
        Conditions: form.get("conditions"),
      };
      const res = await api.post(
        `/admin/sale-events/${selectedEventId}/discounts`,
        body
      );
      if (res.status === 201 || (res.data && res.data.ok)) {
        setMsg(res.data?.message || "Discount created");
        fetchDiscounts(selectedEventId);
      } else {
        setMsg(res.data?.message || `Unexpected response: ${res.status}`);
      }
    } catch (err) {
      setMsg(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to create discount"
      );
    }
  }

  async function deleteDiscount(id) {
    if (!window.confirm("Delete discount?")) return;
    try {
      const res = await api.delete(`/admin/discounts/${id}`);
      if (res.data && res.data.ok) {
        setMsg("Deleted");
        fetchDiscounts(selectedEventId);
      }
    } catch {
      setMsg("Failed to delete");
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-card">
        <div className="page-header">
          <h1 className="page-title">Discount Management</h1>
          <div className="page-actions">
            <button className="btn primary" onClick={() => eventNameRef.current?.focus()}>+ Add New</button>
          </div>
        </div>

        <section className="card-section">
          <h3 className="section-title">Create Sale Event</h3>
          <form onSubmit={createEvent} className="form-row">
            <input ref={eventNameRef} name="name" className="input" placeholder="Name" required />
            <input name="start" type="date" className="input" required />
            <input name="end" type="date" className="input" required />
            <input name="description" className="input" placeholder="Description" />
            <button type="submit" className="btn">Create</button>
          </form>
        </section>

        <section className="card-section">
          <h3 className="section-title">Events</h3>
          <div className="form-row">
            <select className="select" onChange={(e) => { const id = Number(e.target.value) || null; setSelectedEventId(id); fetchDiscounts(id); }}>
              <option value="">-- select event --</option>
              {events.map(ev => <option key={ev.SaleEventID} value={ev.SaleEventID}>{ev.Name} ({ev.StartDate}→{ev.EndDate})</option>)}
            </select>
            <button className="btn" onClick={fetchEvents}>Refresh</button>
          </div>
        </section>

        <section className="card-section">
          <h3 className="section-title">Create Discount</h3>
          <form onSubmit={createDiscount} className="form-row wrap">
            <select name="product" className="select" required>
              <option value="">-- select product --</option>
              {products.map(p => <option key={p.ProductID} value={p.ProductID}>{p.Name}</option>)}
            </select>
            <select name="type" className="select" defaultValue="percentage">
              <option value="percentage">percentage</option>
              <option value="fixed">fixed</option>
              <option value="bogo">bogo</option>
            </select>
            <input name="value" className="input" type="number" step="0.01" placeholder="Value" required />
            <input name="conditions" className="input" placeholder="Conditions" />
            <button type="submit" className="btn primary">Add</button>
          </form>
        </section>

        <section className="card-section">
          <h3 className="section-title">Discounts</h3>
          {msg && <div className="message">{msg}</div>}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th className="align-right">Value</th>
                  <th>Conditions</th>
                  <th className="align-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map(d => (
                  <tr key={d.DiscountID}>
                    <td>{d.ProductName}</td>
                    <td>{d.DiscountType}</td>
                    <td className="align-right">{d.DiscountValue}</td>
                    <td>{d.Conditions}</td>
                    <td className="align-center"><button className="btn" onClick={() => deleteDiscount(d.DiscountID)}>Delete</button></td>
                  </tr>
                ))}
                {discounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="no-data">No discounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
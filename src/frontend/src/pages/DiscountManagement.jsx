import React, { useEffect, useState, useRef } from "react";
import "./DiscountManagement.css";
import api from "../utils/api.js";
import { useConfirm } from '../ConfirmContext';

export default function DiscountManagement() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState("");
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEditDiscount, setShowEditDiscount] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const eventNameRef = useRef(null);
  const { confirm } = useConfirm();

  useEffect(() => {
    fetchEvents();
    fetchProducts();
    fetchAllDiscounts();
  }, []);

  async function fetchEvents() {
    try {
      const res = await api.get("/admin/sale-events");
      const eventList = Array.isArray(res.data) ? res.data : [];
      setEvents(eventList);

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

  async function fetchAllDiscounts() {
    try {
      const eventsRes = await api.get("/admin/sale-events");
      const eventList = Array.isArray(eventsRes.data) ? eventsRes.data : [];
      
      const allDiscounts = [];
      for (const event of eventList) {
        try {
          const res = await api.get(`/admin/sale-events/${event.SaleEventID}/discounts`);
          const discountsFromThisEvent = Array.isArray(res.data) ? res.data : [];
          
          for (const discount of discountsFromThisEvent) {
            discount.EventName = event.Name;
            allDiscounts.push(discount);
          }
        } catch {
        }
      }
      
      setDiscounts(allDiscounts);
    } catch {
      setDiscounts([]);
    }
  }

  async function fetchDiscounts(evId) {
    if (!evId) {
      fetchAllDiscounts();
      return;
    }
    
    try {
      const res = await api.get(`/admin/sale-events/${evId}/discounts`);
      const eventDiscounts = Array.isArray(res.data) ? res.data : [];
      
      const selectedEvent = events.find(e => e.SaleEventID === evId);
      
      for (const discount of eventDiscounts) {
        discount.EventName = selectedEvent?.Name || '—';
      }
      
      setDiscounts(eventDiscounts);
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
        await fetchEvents();
        e.target.reset();
        if (selectedEventId) {
          fetchDiscounts(selectedEventId);
        } else {
          fetchAllDiscounts();
        }
      } else {
        setMsg("Failed to create event");
      }
    } catch (err) {
      setMsg(err?.response?.data?.error || err?.message || "Failed");
    }
  }  async function createDiscount(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    if (!selectedEventId) {
      setMsg("Select an event first");
      return;
    }
    try {
      const body = {
        ProductID: Number(form.get("product")),
        DiscountType: form.get("type"),
        DiscountValue: Number(form.get("value")),
        Conditions: form.get("conditions") || null,
      };
      const res = await api.post(
        `/admin/sale-events/${selectedEventId}/discounts`,
        body
      );
      if (res.status === 201 || (res.data && res.data.ok)) {
        setMsg("Discount created");
        e.target.reset();
        if (selectedEventId) {
          fetchDiscounts(selectedEventId);
        } else {
          fetchAllDiscounts();
        }
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
      const isConfirmed = await confirm({
          title: 'Delete discount',
          message: 'Are you sure you want to delete this discount?',
          confirmText: 'Delete',
          cancelText: 'Cancel'
      });

      if (!isConfirmed) return;
    try {
      const res = await api.delete(`/admin/discounts/${id}`);
      if (res.status === 200 || (res.data && res.data.ok)) {
        setMsg("Deleted");
        if (selectedEventId) {
          fetchDiscounts(selectedEventId);
        } else {
          fetchAllDiscounts();
        }
      } else {
        setMsg("Failed to delete");
      }
    } catch (err) {
      setMsg(err?.response?.data?.error || "Failed to delete");
    }
  }

  async function updateDiscount(e) {
    e.preventDefault();
    if (!editingDiscount) return;
    try {
      const body = {
        ProductID: Number(editingDiscount.ProductID),
        DiscountType: editingDiscount.DiscountType,
        DiscountValue: Number(editingDiscount.DiscountValue),
        Conditions: editingDiscount.Conditions || null,
      };
      await api.patch(`/admin/discounts/${editingDiscount.DiscountID}`, body);
      setMsg("Discount updated");
      if (selectedEventId) {
        await fetchDiscounts(selectedEventId);
      } else {
        await fetchAllDiscounts();
      }
      setShowEditDiscount(false);
      setEditingDiscount(null);
    } catch (err) {
      setMsg(err?.response?.data?.error || "Failed to update discount");
    }
  }

  async function updateEvent(e) {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      const body = {
        Name: editingEvent.Name,
        Description: editingEvent.Description || null,
        StartDate: editingEvent.StartDate,
        EndDate: editingEvent.EndDate,
      };
      await api.patch(`/admin/sale-events/${editingEvent.SaleEventID}`, body);
      setMsg("Event updated");
      await fetchEvents();
      if (selectedEventId) {
        await fetchDiscounts(selectedEventId);
      } else {
        await fetchAllDiscounts();
      }
      setShowEditEvent(false);
      setEditingEvent(null);
    } catch (err) {
      setMsg(err?.response?.data?.error || "Failed to update event");
    }
  }

  async function deleteEvent(id) {
      const isConfirmed = await confirm({
          title: 'Delete Event',
          message: 'Are you sure you want to delete this Event? All its discounts will also be deleted.',
          confirmText: 'Delete',
          cancelText: 'Cancel'
      });

      if (!isConfirmed) return;
      try {
          await api.delete(`/admin/sale-events/${id}`);
          setMsg("Event deleted");
          if (selectedEventId === id) {
            setSelectedEventId(null);
          }
          await fetchEvents();
          fetchAllDiscounts();
      } catch (err) {
          setMsg(err?.response?.data?.error || "Failed to delete event");
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
            <select className="select" value={selectedEventId || ""} onChange={(e) => { const id = Number(e.target.value) || null; setSelectedEventId(id); fetchDiscounts(id); }}>
              <option value="">-- select event --</option>
              {events.map(ev => <option key={ev.SaleEventID} value={ev.SaleEventID}>{ev.Name} ({ev.StartDate}→{ev.EndDate})</option>)}
            </select>
            <button className="btn" onClick={fetchEvents}>Refresh</button>
            {selectedEventId && (
              <>
                <button className="btn" onClick={() => { const event = events.find(e => e.SaleEventID === selectedEventId); setEditingEvent(event); setShowEditEvent(true); }}>Edit Event</button>
                <button className="btn" onClick={() => deleteEvent(selectedEventId)} style={{ background: '#fee', color: '#c00' }}>Delete Event</button>
              </>
            )}
          </div>
        </section>

        <section className="card-section">
          <h3 className="section-title">Create Discount</h3>
          <form onSubmit={createDiscount} className="form-row wrap">
            <select name="product" className="select" required>
              <option value="">-- select product --</option>
              {products.map(p => <option key={p.ProductID} value={p.ProductID}>{p.Name}</option>)}
            </select>
            <select name="type" className="select" defaultValue="percentage" required>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
              <option value="bogo">BOGO</option>
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
                  <th>Event</th>
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
                    <td>{d.EventName || '—'}</td>
                    <td>{d.ProductName}</td>
                    <td>{d.DiscountType}</td>
                    <td className="align-right">{d.DiscountValue}</td>
                    <td>{d.Conditions}</td>
                    <td className="align-center">
                      <button className="btn" onClick={() => { setEditingDiscount(d); setShowEditDiscount(true); }} style={{ marginRight: '4px' }}>Edit</button>
                      <button className="btn" onClick={() => deleteDiscount(d.DiscountID)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {discounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="no-data">No discounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showEditEvent && editingEvent && (
          <div className="overlay">
            <form className="modal" onSubmit={updateEvent}>
              <h3>Edit Sale Event</h3>
              <div className="form-grid">
                <input className="input" placeholder="Name" value={editingEvent.Name || ''} onChange={(e) => setEditingEvent({...editingEvent, Name: e.target.value})} required />
                <input className="input" placeholder="Description" value={editingEvent.Description || ''} onChange={(e) => setEditingEvent({...editingEvent, Description: e.target.value})} />
                <input type="date" className="input" value={editingEvent.StartDate || ''} onChange={(e) => setEditingEvent({...editingEvent, StartDate: e.target.value})} required />
                <input type="date" className="input" value={editingEvent.EndDate || ''} onChange={(e) => setEditingEvent({...editingEvent, EndDate: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => { setShowEditEvent(false); setEditingEvent(null); }}>Cancel</button>
                <button type="submit" className="btn primary">Update</button>
              </div>
            </form>
          </div>
        )}

        {showEditDiscount && editingDiscount && (
          <div className="overlay">
            <form className="modal" onSubmit={updateDiscount}>
              <h3>Edit Discount</h3>
              <div className="form-grid">
                <select className="select" value={editingDiscount.ProductID || ''} onChange={(e) => setEditingDiscount({...editingDiscount, ProductID: Number(e.target.value)})} required>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.ProductID} value={p.ProductID}>{p.Name}</option>)}
                </select>
                <select className="select" value={editingDiscount.DiscountType || 'percentage'} onChange={(e) => setEditingDiscount({...editingDiscount, DiscountType: e.target.value})} required>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                  <option value="bogo">BOGO</option>
                </select>
                <input type="number" step="0.01" className="input" placeholder="Value" value={editingDiscount.DiscountValue || ''} onChange={(e) => setEditingDiscount({...editingDiscount, DiscountValue: e.target.value})} required />
                <input className="input" placeholder="Conditions" value={editingDiscount.Conditions || ''} onChange={(e) => setEditingDiscount({...editingDiscount, Conditions: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => { setShowEditDiscount(false); setEditingDiscount(null); }}>Cancel</button>
                <button type="submit" className="btn primary">Update</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
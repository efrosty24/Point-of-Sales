import React, { useEffect, useState } from "react";
import "./Employees.css";
import api from "../utils/api.js"; 

export default function Employees() {
  const [employees, setEmployees] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [form, setForm] = useState({
    FirstName: "", LastName: "", Email: "", Phone: "", Role: "Cashier", UserPassword: ""
  });

  useEffect(() => { attemptFetch(); }, []);

  async function attemptFetch() {
    setLoading(true);
    try {
      const res = await api.get("/admin/employees");
      if (Array.isArray(res.data)) setEmployees(res.data);
      else if (Array.isArray(res.data?.employees)) setEmployees(res.data.employees);
      else if (Array.isArray(res.data?.data)) setEmployees(res.data.data);
      else setEmployees([]);
      setMessage("");
    } catch {
      setEmployees(null);
      setMessage("Employee endpoints not available");
    } finally {
      setLoading(false);
    }
  }

  async function createEmployee(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const body = {
        FirstName: form.FirstName,
        LastName: form.LastName,
        Email: form.Email,
        Phone: form.Phone,
        Role: form.Role,
        UserPassword: form.UserPassword || "changeme",
      };
      const res = await api.post("/admin/employees", body);
      if (res.data && (res.data.ok || res.status === 201)) {
        setMessage("Employee created");
        setShowCreate(false);
        setForm({ FirstName: "", LastName: "", Email: "", Phone: "", Role: "Cashier", UserPassword: "" });
        attemptFetch();
      } else {
        setMessage("Failed to create employee");
      }
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  }

  async function startEdit(emp) {
    setShowEdit(emp.EmployeeID);
    setForm({
      FirstName: emp.FirstName || "",
      LastName: emp.LastName || "",
      Email: emp.Email || "",
      Phone: emp.Phone || "",
      Role: emp.Role || "Cashier",
      UserPassword: "",
    });
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!showEdit) return;
    try {
      setLoading(true);
      const id = showEdit;
      const body = { FirstName: form.FirstName, LastName: form.LastName, Email: form.Email, Phone: form.Phone, Role: form.Role };
      const res = await api.patch(`/admin/employees/${id}`, body); 
      if (res.data && res.data.ok) {
        setMessage("Employee updated");
        setShowEdit(null);
        attemptFetch();
      } else {
        setMessage("Failed to update employee");
      }
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to update employee");
    } finally {
      setLoading(false);
    }
  }

  async function deactivateEmployee(id) {
    if (!window.confirm("Deactivate this employee?")) return;
    try {
      setLoading(true);
      const res = await api.delete(`/admin/employees/${id}`);
      if (res.data && res.data.ok) {
        setMessage("Employee deactivated");
        attemptFetch();
      } else {
        setMessage("Failed to deactivate");
      }
    } catch (err) {
      setMessage(err?.response?.data?.error || "Failed to deactivate");
    } finally {
      setLoading(false);
    }
  }

  const addDemo = async () => {
    setMessage("Demo create removed; use the real API to add employees.");
  };

  return (
    <div className="page-wrap">
      <div className="page-card">
        <div className="page-header">
          <h1 className="page-title">Employee Management</h1>
          <div className="page-actions">
            <button className="btn" onClick={attemptFetch}>Refresh</button>
            <button className="btn primary" onClick={() => setShowCreate(true)}>+ Add Employee</button>
          </div>
        </div>

        {loading && <div className="loading">Loading…</div>}
        {message && <div className="message">{message}</div>}

        {employees === null ? (
          <div className="no-backend">
            <p>The backend does not expose employee management endpoints.</p>
            <div className="form-row">
              <button className="btn" onClick={attemptFetch}>Retry</button>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="align-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.EmployeeID}>
                    <td>{e.EmployeeID}</td>
                    <td>{e.FirstName} {e.LastName}</td>
                    <td>{e.Email}</td>
                    <td>{e.Role}</td>
                    <td className="align-center">
                      <button className="btn" onClick={() => startEdit(e)}>Edit</button>
                      <button className="btn" onClick={() => deactivateEmployee(e.EmployeeID)}>Deactivate</button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="no-data">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Create modal/form */}
        {showCreate && (
          <div className="overlay">
            <form className="modal" onSubmit={createEmployee}>
              <h3>Create Employee</h3>
              <div className="form-grid">
                <input className="input" placeholder="First name" value={form.FirstName} onChange={(e) => setForm({ ...form, FirstName: e.target.value })} required />
                <input className="input" placeholder="Last name" value={form.LastName} onChange={(e) => setForm({ ...form, LastName: e.target.value })} required />
                <input className="input" placeholder="Email" type="email" value={form.Email} onChange={(e) => setForm({ ...form, Email: e.target.value })} required />
                <input className="input" placeholder="Phone" value={form.Phone} onChange={(e) => setForm({ ...form, Phone: e.target.value })} />
                <select className="select" value={form.Role} onChange={(e) => setForm({ ...form, Role: e.target.value })}>
                  <option value="Cashier">Cashier</option>
                  <option value="Admin">Admin</option>
                </select>
                <input className="input" placeholder="Password (temporary)" type="password" value={form.UserPassword} onChange={(e) => setForm({ ...form, UserPassword: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button className="btn" type="button" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn primary" type="submit">Create</button>
              </div>
            </form>
          </div>
        )}

        {/* Edit modal/form */}
        {showEdit && (
          <div className="overlay">
            <form className="modal" onSubmit={saveEdit}>
              <h3>Edit Employee</h3>
              <div className="form-grid">
                <input className="input" placeholder="First name" value={form.FirstName} onChange={(e) => setForm({ ...form, FirstName: e.target.value })} required />
                <input className="input" placeholder="Last name" value={form.LastName} onChange={(e) => setForm({ ...form, LastName: e.target.value })} required />
                <input className="input" placeholder="Email" type="email" value={form.Email} onChange={(e) => setForm({ ...form, Email: e.target.value })} required />
                <input className="input" placeholder="Phone" value={form.Phone} onChange={(e) => setForm({ ...form, Phone: e.target.value })} />
                <select className="select" value={form.Role} onChange={(e) => setForm({ ...form, Role: e.target.value })}>
                  <option value="Cashier">Cashier</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button className="btn" type="button" onClick={() => setShowEdit(null)}>Cancel</button>
                <button className="btn primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
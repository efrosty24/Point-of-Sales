import React, { useState, useMemo, useEffect } from "react";
import { Plus, Search, Edit, Ban, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import "./CustomerList.css";
import api from "../utils/api.js"; 
export default function CustomerList() {
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editCustomer, setEditCustomer] = useState(null);
    const [formData, setFormData] = useState({
        FirstName: "",
        LastName: "",
        Phone: "",
        Email: "",
        Address: "",
        City: "",
        State: "",
        Zip: "",
        Country: "",
    });

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    const fetchCustomers = async (search = "") => {
        const params = {};
        if (search) params.name = search; 
        const res = await api.get("/admin/customers", { params });
        const data = res.data;
        const mapped = (data.customers || []).map((c) => ({
            id: c.CustomerID,
            name: `${c.FirstName || ""} ${c.LastName || ""}`.trim(),
            phone: c.Phone || "",
            email: c.Email || "",
            isActive: c.isActive !== undefined ? Number(c.isActive) !== 0 : true,
            _raw: c,
        }));
        setCustomers(mapped);
    };

    useEffect(() => {
        fetchCustomers().catch(console.error);
    }, []);

    const totalPages = Math.max(1, Math.ceil(customers.length / pageSize));

    const filteredCustomers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return customers;
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(term) ||
                c.email.toLowerCase().includes(term) ||
                c.phone.toLowerCase().includes(term)
        );
    }, [customers, searchTerm]);

    const displayedCustomers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCustomers.slice(start, start + pageSize);
    }, [filteredCustomers, currentPage]);

    const openModal = (customer = null) => {
        setEditCustomer(customer);
        if (customer && customer._raw) {
            const r = customer._raw;
            setFormData({
                FirstName: r.FirstName || "",
                LastName: r.LastName || "",
                Phone: r.Phone || "",
                Email: r.Email || "",
                Address: r.Address || "",
                City: r.City || "",
                State: r.State || "",
                Zip: r.Zip || "",
                Country: r.Country || "",
            });
        } else {
            setFormData({
                FirstName: "",
                LastName: "",
                Phone: "",
                Email: "",
                Address: "",
                City: "",
                State: "",
                Zip: "",
                Country: "",
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditCustomer(null);
        setFormData({
            FirstName: "",
            LastName: "",
            Phone: "",
            Email: "",
            Address: "",
            City: "",
            State: "",
            Zip: "",
            Country: "",
        });
    };

    const handleSave = async () => {
        const payload = { ...formData };

        if (editCustomer) {
            const id = editCustomer.id;
            const res = await api.put(`/admin/customers/${id}`, payload);
            if (res.status < 200 || res.status >= 300) {
                console.error("Update failed");
                return;
            }
            await fetchCustomers(searchTerm).catch(console.error);
        } else {
            const res = await api.post(`/admin/customers`, payload);
            if (res.status < 200 || res.status >= 300) {
                console.error("Create failed");
                return;
            }
            await fetchCustomers(searchTerm).catch(console.error);
        }
        closeModal();
    };

    const handleDelete = async (id) => {
        const res = await api.delete(`/admin/customers/${id}`);
        if (res.status !== 200 && res.status !== 204) {
            console.error(res);
            console.error("Delete failed");
            return;
        }
        await fetchCustomers(searchTerm).catch(console.error);
    };

    const handleReactivate = async (id) => {
        const res = await api.put(`/admin/customers/${id}/reactivate`, { isActive: 1 });
        if (res.status < 200 || res.status >= 300) {
            console.error(res);
            console.error("Reactivate failed");
            return;
        }
        await fetchCustomers(searchTerm).catch(console.error);
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage((p) => p + 1);
    };

    const prevPage = () => {
        if (currentPage > 1) setCurrentPage((p) => p - 1);
    };

    return (
        <div className="appcl-container">
            <div className="customer-management-card">
                <div className="card-header">
                    <h2 className="card-title">Customer Management</h2>
                    <button className="add-btn" onClick={() => openModal()}>
                        <Plus />
                    </button>
                </div>

                <div className="search-add-row">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search by name or email or phone..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <button onClick={() => fetchCustomers(searchTerm).catch(console.error)}>
                            <Search />
                        </button>
                    </div>
                </div>

                <table className="customer-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {displayedCustomers.length > 0 ? (
                        displayedCustomers.map((c) => (
                            <tr key={c.id} className={!c.isActive ? "row-inactive" : undefined}>
                                <td>{c.id}</td>
                                <td>{c.name}</td>
                                <td>{c.phone}</td>
                                <td>{c.email}</td>
                                <td>
                                    <div className="action-btns">
                                        {!c.isActive ? (
                                            <button
                                                className="reactivate-btn"
                                                onClick={() => handleReactivate(c.id)}
                                                title="Reactivate"
                                            >
                                                <RefreshCw />
                                            </button>
                                        ) : (
                                            <>
                                                <button className="edit-btn" onClick={() => openModal(c)} title="Edit">
                                                    <Edit />
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(c.id)}
                                                    title="Deactivate"
                                                >
                                                    <Ban />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>
                                No customers found.
                            </td>
                        </tr>
                    )}
                    </tbody>

                </table>

                <div className="pagination">
                    <button onClick={prevPage} disabled={currentPage === 1}>
                        <ChevronLeft />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            className={currentPage === i + 1 ? "active" : ""}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button onClick={nextPage} disabled={currentPage === totalPages}>
                        <ChevronRight />
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-left">
                            <h2>{editCustomer ? "Edit Customer" : "Add Customer"}</h2>
                        </div>

                        <div className="modal-right">
                            <div className="form-body">
                                {/* FirstName */}
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder=" "
                                        value={formData.FirstName}
                                        onChange={(e) => setFormData({ ...formData, FirstName: e.target.value })}
                                        onFocus={(e) => e.target.classList.add("focused")}
                                        onBlur={(e) => e.target.classList.remove("focused")}
                                    />
                                    <label>First Name</label>
                                </div>

                                {/* LastName */}
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder=" "
                                        value={formData.LastName}
                                        onChange={(e) => setFormData({ ...formData, LastName: e.target.value })}
                                        onFocus={(e) => e.target.classList.add("focused")}
                                        onBlur={(e) => e.target.classList.remove("focused")}
                                    />
                                    <label>Last Name</label>
                                </div>

                                {/* Phone */}
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder=" "
                                        value={formData.Phone}
                                        onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                                        onFocus={(e) => e.target.classList.add("focused")}
                                        onBlur={(e) => e.target.classList.remove("focused")}
                                    />
                                    <label>Phone</label>
                                </div>

                                {/* Email */}
                                <div className="input-group">
                                    <input
                                        type="email"
                                        placeholder=" "
                                        value={formData.Email}
                                        onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                                        onFocus={(e) => e.target.classList.add("focused")}
                                        onBlur={(e) => e.target.classList.remove("focused")}
                                    />
                                    <label>Email</label>
                                </div>

                                {/* Address */}
                                <div className="input-group full">
                                    <input
                                        type="text"
                                        placeholder=" "
                                        value={formData.Address}
                                        onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                                        onFocus={(e) => e.target.classList.add("focused")}
                                        onBlur={(e) => e.target.classList.remove("focused")}
                                    />
                                    <label>Address</label>
                                </div>

                                {/* City + State */}
                                <div className="grid-two">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            placeholder=" "
                                            value={formData.City}
                                            onChange={(e) => setFormData({ ...formData, City: e.target.value })}
                                            onFocus={(e) => e.target.classList.add("focused")}
                                            onBlur={(e) => e.target.classList.remove("focused")}
                                        />
                                        <label>City</label>
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            placeholder=" "
                                            value={formData.State}
                                            onChange={(e) => setFormData({ ...formData, State: e.target.value })}
                                            onFocus={(e) => e.target.classList.add("focused")}
                                            onBlur={(e) => e.target.classList.remove("focused")}
                                        />
                                        <label>State</label>
                                    </div>
                                </div>

                                {/* Zip + Country */}
                                <div className="grid-two">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            pattern="[0-9]*"
                                            inputMode="numeric"
                                            placeholder=" "
                                            value={formData.Zip}
                                            onChange={(e) => setFormData({ ...formData, Zip: e.target.value })}
                                            onFocus={(e) => e.target.classList.add("focused")}
                                            onBlur={(e) => e.target.classList.remove("focused")}
                                        />
                                        <label>Zip</label>
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            placeholder=" "
                                            value={formData.Country}
                                            onChange={(e) => setFormData({ ...formData, Country: e.target.value })}
                                            onFocus={(e) => e.target.classList.add("focused")}
                                            onBlur={(e) => e.target.classList.remove("focused")}
                                        />
                                        <label>Country</label>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="cancel-btn" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button className="save-btn" onClick={handleSave}>
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

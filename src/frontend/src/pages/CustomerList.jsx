import React, { useState, useMemo } from "react";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X
} from "lucide-react";
import "./CustomerList.css";

export default function CustomerList() {
    const DUMMY_CUSTOMERS = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Customer ${i + 1}`,
        phone: `+1 (555) 00${i.toString().padStart(2, "0")}`,
        email: `customer${i + 1}@example.com`
    }));

    const [customers, setCustomers] = useState(DUMMY_CUSTOMERS);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editCustomer, setEditCustomer] = useState(null);
    const [formData, setFormData] = useState({ name: "", phone: "", email: "" });

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;
    const totalPages = Math.ceil(customers.length / pageSize);

    const filteredCustomers = useMemo(() => {
        return customers.filter(
            (c) =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customers, searchTerm]);

    const displayedCustomers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredCustomers.slice(start, start + pageSize);
    }, [filteredCustomers, currentPage]);

    const openModal = (customer = null) => {
        setEditCustomer(customer);
        setFormData(customer || { name: "", phone: "", email: "" });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditCustomer(null);
        setFormData({ name: "", phone: "", email: "" });
    };

    const handleSave = () => {
        if (!formData.name.trim()) return;
        if (editCustomer) {
            setCustomers((prev) =>
                prev.map((c) => (c.id === editCustomer.id ? { ...c, ...formData } : c))
            );
        } else {
            const newCustomer = {
                id: customers.length + 1,
                ...formData
            };
            setCustomers((prev) => [newCustomer, ...prev]);
        }
        closeModal();
    };

    const handleDelete = (id) => {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const prevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    return (
        <div className="app-container">
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
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <button>
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
                            <tr key={c.id}>
                                <td>{c.id}</td>
                                <td>{c.name}</td>
                                <td>{c.phone}</td>
                                <td>{c.email}</td>
                                <td>
                                    <div className="action-btns">
                                        <button
                                            className="edit-btn"
                                            onClick={() => openModal(c)}
                                        >
                                            <Edit />
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(c.id)}
                                        >
                                            <Trash2 />
                                        </button>
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
                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder=" "
                                        value={formData.FirstName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, FirstName: e.target.value })
                                        }
                                        onFocus={(e) => e.target.classList.add("focused")}
                                        onBlur={(e) => e.target.classList.remove("focused")}
                                    />
                                    <label>First Name</label>
                                </div>

                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder=" "
                                        value={formData.LastName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, LastName: e.target.value })
                                        }
                                        onFocus={(e) => e.target.classList.add("focused")}
                                        onBlur={(e) => e.target.classList.remove("focused")}
                                    />
                                    <label>Last Name</label>
                                </div>

                                <div className="input-group">
                                    <input
                                        type="text"
                                        placeholder=" "
                                        value={formData.Phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, Phone: e.target.value })
                                        }
                                        onFocus={(e) => e.target.classList.add("focused")}
                                        onBlur={(e) => e.target.classList.remove("focused")}
                                    />
                                    <label>Phone</label>
                                </div>

                                <div className="input-group">
                                    <input
                                        type="email"
                                        placeholder=" "
                                        value={formData.Email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, Email: e.target.value })
                                        }
                                        onFocus={(e) => e.target.classList.add("focused")}
                                        onBlur={(e) => e.target.classList.remove("focused")}
                                    />
                                    <label>Email</label>
                                </div>

                                <div className="input-group full">
                                    <input
                                        type="text"
                                        placeholder=" "
                                        value={formData.Address}
                                        onChange={(e) =>
                                            setFormData({ ...formData, Address: e.target.value })
                                        }
                                        onFocus={(e) => e.target.classList.add("focused")}
                                        onBlur={(e) => e.target.classList.remove("focused")}
                                    />
                                    <label>Address</label>
                                </div>

                                <div className="grid-two">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            placeholder=" "
                                            value={formData.City}
                                            onChange={(e) =>
                                                setFormData({ ...formData, City: e.target.value })
                                            }
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
                                            onChange={(e) =>
                                                setFormData({ ...formData, State: e.target.value })
                                            }
                                            onFocus={(e) => e.target.classList.add("focused")}
                                            onBlur={(e) => e.target.classList.remove("focused")}
                                        />
                                        <label>State</label>
                                    </div>
                                </div>

                                <div className="grid-two">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            pattern="[0-9]*"
                                            inputMode="numeric"
                                            placeholder=" "
                                            value={formData.Zip}
                                            onChange={(e) =>
                                                setFormData({ ...formData, Zip: e.target.value })
                                            }
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
                                            onChange={(e) =>
                                                setFormData({ ...formData, Country: e.target.value })
                                            }
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

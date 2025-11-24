import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X } from "lucide-react";
import "./SupplierList.css";
import api from "../utils/api";
import { useConfirm } from '../ConfirmContext';
import { useAlert } from '../AlertContext';

export default function Suppliers() {
    const { confirm } = useConfirm();
    const { showSuccess, showError } = useAlert();
    const [suppliers, setSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const [formData, setFormData] = useState({
        Name: "",
        Phone: "",
        Email: ""
    });

    const [currentPage, setCurrentPage] = useState(1);
    const suppliersPerPage = 8;

    useEffect(() => {
        loadSuppliers();
    }, []);

    useEffect(() => {
        const results = suppliers.filter(
            (s) =>
                s.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.Phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.Email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredSuppliers(results);
    }, [searchTerm, suppliers]);

    async function loadSuppliers() {
        try {
            const res = await api.get("/admin/inventory/suppliers");
            setSuppliers(res.data);
        } catch (err) {
            console.error("Error loading suppliers:", err);
            showError("Failed to load suppliers. Please try again.");
        }
    }

    
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return phoneRegex.test(phone);
    };

    const validateForm = () => {
        
        if (!formData.Name.trim()) {
            showError("Supplier name is required");
            return false;
        }
        if (formData.Name.trim().length < 2) {
            showError("Supplier name must be at least 2 characters");
            return false;
        }
        if (formData.Name.trim().length > 100) {
            showError("Supplier name must not exceed 100 characters");
            return false;
        }

        
        if (!formData.Phone.trim()) {
            showError("Phone number is reqired");
            return false;
        }
        if (!validatePhone(formData.Phone)) {
            showError("Please enter a valid phone number");
            return false;
        }

        
        if (!formData.Email.trim()) {
            showError("Email is required");
            return false;
        }
        if (!validateEmail(formData.Email)) {
            showError("Please enter a valid email address");
            return false;
        }

        return true;
    };

    function openModal(supplier = null) {
        if (supplier) {
            setFormData({
                Name: supplier.Name,
                Phone: supplier.Phone,
                Email: supplier.Email
            });
            setCurrentSupplier(supplier);
        } else {
            setFormData({ Name: "", Phone: "", Email: "" });
            setCurrentSupplier(null);
        }
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
    }

    async function saveSupplier(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            if (currentSupplier) {
                await api.patch(`/admin/inventory/suppliers/${currentSupplier.SupplierID}`, formData);
                showSuccess("Supplier updated successfully!");
            } else {
                await api.post("/admin/inventory/suppliers", formData);
                showSuccess("Supplier added successfully!");
            }
            loadSuppliers();
            closeModal();
        } catch (err) {
            console.error("Save error:", err);
            showError(currentSupplier
                ? "Failed to update supplier. Please try again."
                : "Failed to add supplier. Please try again.");
        }
    }

    async function deleteSupplier(id) {
        const isConfirmed = await confirm({
            title: 'Delete Supplier',
            message: 'Are you sure you want to delete this supplier? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!isConfirmed) return;

        try {
            await api.delete(`/admin/inventory/suppliers/${id}`);
            showSuccess("Supplier deleted successfully!");
            loadSuppliers();
        } catch (err) {
            if(err.response.data.error === "SUPPLIER_IN_USE") {
                showError("You cannot delete this supplier yet. To proceed, please remove all products currently associated with them.");
            } else {
                console.error("Delete error:", err);
                showError("Failed to delete supplier. Please try again.");
            }
        }
    }

    const indexOfLast = currentPage * suppliersPerPage;
    const indexOfFirst = indexOfLast - suppliersPerPage;
    const currentSuppliers = filteredSuppliers.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredSuppliers.length / suppliersPerPage);

    return (
        <div className="appcl-container">
            <div className="customer-management-card">
                <div className="card-header">
                    <h2 className="card-title">Supplier Management</h2>
                </div>

                <div className="search-add-row">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search by name or email or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button><Search size={18} /></button>
                    </div>
                    <button className="add-btn" onClick={() => openModal()}>
                        <Plus size={20} />
                    </button>
                </div>

                <table className="customer-table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Supplier Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentSuppliers.map((s, idx) => (
                        <tr key={s.SupplierID}>
                            <td>{indexOfFirst + idx + 1}</td>
                            <td>{s.Name}</td>
                            <td>{s.Phone}</td>
                            <td>{s.Email}</td>
                            <td>
                                <div className="action-btns">
                                    <button onClick={() => openModal(s)}>
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => deleteSupplier(s.SupplierID)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {filteredSuppliers.length > suppliersPerPage && (
                    <div className="pagination">
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                className={currentPage === i + 1 ? "active" : ""}
                                onClick={() => setCurrentPage(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-left">
                            <h2>{currentSupplier ? "Edit Supplier" : "Add Supplier"}</h2>
                            <p>
                                {currentSupplier
                                    ? "Update supplier details below."
                                    : "Enter the details of the new supplier."}
                            </p>
                        </div>
                        <div className="modal-right">
                            <form onSubmit={saveSupplier} className="form-body">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        required
                                        value={formData.Name}
                                        onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                                        placeholder=" "
                                    />
                                    <label>Supplier Name *</label>
                                </div>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        required
                                        value={formData.Phone}
                                        onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                                        placeholder=" "
                                    />
                                    <label>Phone *</label>
                                </div>
                                <div className="input-group">
                                    <input
                                        type="email"
                                        required
                                        value={formData.Email}
                                        onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                                        placeholder=" "
                                    />
                                    <label>Email *</label>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="cancel-btn" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="save-btn">
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useEffect, useState } from "react";
import { Plus, Search, Edit, Ban, RefreshCw } from "lucide-react";
import "./Employees.css";
import api from "../utils/api";
import { useAlert } from '../AlertContext';

export default function Employees() {
    const { showSuccess, showError } = useAlert();
    const [employees, setEmployees] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [form, setForm] = useState({
        FirstName: "",
        LastName: "",
        Email: "",
        Phone: "",
        Role: "Cashier",
        UserPassword: "",
    });

    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 8;

    useEffect(() => {
        attemptFetch();
    }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        const res = (employees || []).filter((e) =>
            [e.FirstName, e.LastName, e.Email, e.Phone, e.City, e.State, e.Country, e.Role]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
        setFiltered(res);
        setCurrentPage(1);
    }, [search, employees]);

    async function attemptFetch() {
        setLoading(true);
        try {
            const res = await api.get("/admin/employees");
            let employeeData = [];
            if (Array.isArray(res.data)) employeeData = res.data;
            else if (Array.isArray(res.data?.employees)) employeeData = res.data.employees;
            else if (Array.isArray(res.data?.data)) employeeData = res.data.data;

            
            const mapped = employeeData.map((emp) => ({
                ...emp,
                isActive: emp.isActive !== undefined ? Number(emp.isActive) !== 0 : true,
            }));

            setEmployees(mapped);
        } catch {
            setEmployees(null);
            showError("Employee endpoints not available");
        } finally {
            setLoading(false);
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

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        return passwordRegex.test(password);
    };

    const validateForm = (isCreate) => {
        if (!form.FirstName.trim()) {
            showError("First name is required");
            return false;
        }
        if (form.FirstName.trim().length < 2) {
            showError("First name must be at least 2 characters");
            return false;
        }
        if (form.FirstName.trim().length > 50) {
            showError("First name must not exceed 50 characters");
            return false;
        }

        if (!form.LastName.trim()) {
            showError("Last name is required");
            return false;
        }
        if (form.LastName.trim().length < 2) {
            showError("Last name must be at least 2 characters");
            return false;
        }
        if (form.LastName.trim().length > 50) {
            showError("Last name must not exceed 50 characters");
            return false;
        }

        if (!form.Email.trim()) {
            showError("Email is required");
            return false;
        }
        if (!validateEmail(form.Email)) {
            showError("Please enter a valid email address");
            return false;
        }

        if (form.Phone.trim() && !validatePhone(form.Phone)) {
            showError("Please enter a valid phone number");
            return false;
        }

        if (isCreate) {
            if (!form.UserPassword.trim()) {
                showError("Password is required");
                return false;
            }
            if (!validatePassword(form.UserPassword)) {
                showError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
                return false;
            }
        }

        if (!isCreate && form.UserPassword.trim()) {
            if (!validatePassword(form.UserPassword)) {
                showError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
                return false;
            }
        }

        return true;
    };

    async function createEmployee(e) {
        e.preventDefault();

        if (!validateForm(true)) {
            return;
        }

        try {
            setLoading(true);
            const body = {
                FirstName: form.FirstName,
                LastName: form.LastName,
                Email: form.Email,
                Phone: form.Phone,
                Role: form.Role,
                UserPassword: form.UserPassword,
            };
            const res = await api.post("/admin/employees", body);
            if (res.data && (res.statusText === "OK" || res.status === 201)) {
                const employeeId = res.data.employee?.EmployeeID;
                showSuccess(employeeId
                    ? `Employee created with ID: ${employeeId}`
                    : "Employee created successfully"
                );
                setShowCreate(false);
                setForm({ FirstName: "", LastName: "", Email: "", Phone: "", Role: "Cashier", UserPassword: "" });
                setShowPassword(false);
                await attemptFetch();
            } else {
                showError("Failed to create employee");
            }
        } catch (err) {
            showError(err?.response?.data?.error || "Failed to create employee");
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
        setShowNewPassword(false);
    }

    async function saveEdit(e) {
        e.preventDefault();
        if (!showEdit) return;

        if (!validateForm(false)) {
            return;
        }

        try {
            setLoading(true);
            const id = showEdit;
            const body = {
                FirstName: form.FirstName,
                LastName: form.LastName,
                Email: form.Email,
                Phone: form.Phone,
                Role: form.Role,
            };
            if (form.UserPassword?.trim()) body.UserPassword = form.UserPassword.trim();
            await api.patch(`/admin/employees/${id}`, body);
            showSuccess("Employee updated successfully");
            setForm({ FirstName: "", LastName: "", Email: "", Phone: "", Role: "Cashier", UserPassword: "" });
            setShowNewPassword(false);
            attemptFetch();
            closeModals();
        } catch (err) {
            showError(err?.response?.data?.error || "Failed to update employee");
        } finally {
            setLoading(false);
        }
    }

    async function deactivateEmployee(id) {
        try {
            setLoading(true);
            const res = await api.delete(`/admin/employees/${id}`);
            if (res.status === 200 || res.status === 204) {
                showSuccess("Employee deactivated successfully");
                await attemptFetch();
            } else {
                showError("Failed to deactivate employee");
            }
        } catch (err) {
            showError(err?.response?.data?.error || "Failed to deactivate employee");
        } finally {
            setLoading(false);
        }
    }

    async function reactivateEmployee(id) {
        try {
            setLoading(true);
            const res = await api.put(`/admin/employees/${id}/reactivate`, { isActive: 1 });
            if (res.status >= 200 && res.status < 300) {
                showSuccess("Employee reactivated successfully");
                await attemptFetch();
            } else {
                showError("Failed to reactivate employee");
            }
        } catch (err) {
            showError(err?.response?.data?.error || "Failed to reactivate employee");
        } finally {
            setLoading(false);
        }
    }

    const indexOfLast = currentPage * perPage;
    const indexOfFirst = indexOfLast - perPage;
    const currentRows = (filtered || []).slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil((filtered || []).length / perPage);

    function closeModals() {
        setShowCreate(false);
        setShowEdit(null);
        setShowPassword(false);
        setShowNewPassword(false);
    }

    return (
        <div className="appcl-container">
            <div className="employee-management-card">
                <div className="card-header">
                    <h2 className="card-title">Employee Management</h2>
                    {loading && <span style={{ color: "#6b7280", fontSize: 14 }}>Loading...</span>}
                </div>

                <div className="search-add-row">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search by name, email, phone, or role..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button><Search size={18} /></button>
                    </div>
                    <button
                        className="add-btn"
                        onClick={() => {
                            setShowCreate(true);
                            setForm({ FirstName: "", LastName: "", Email: "", Phone: "", Role: "Cashier", UserPassword: "" });
                            setShowPassword(false);
                        }}
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <table className="employee-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {(currentRows || []).map((e) => (
                        <tr key={e.EmployeeID} className={!e.isActive ? "row-inactive" : undefined}>
                            <td>{e.EmployeeID}</td>
                            <td>{e.FirstName}</td>
                            <td>{e.LastName}</td>
                            <td>{e.Phone}</td>
                            <td>{e.Email}</td>
                            <td>{e.Role}</td>
                            <td>
                                <div className="action-btns">
                                    {!e.isActive ? (
                                        <button
                                            className="reactivate-btn"
                                            onClick={() => reactivateEmployee(e.EmployeeID)}
                                            title="Reactivate"
                                        >
                                            <RefreshCw size={18} />
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                className="edit-btn"
                                                onClick={() => startEdit(e)}
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => deactivateEmployee(e.EmployeeID)}
                                                title="Deactivate"
                                            >
                                                <Ban size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {(!currentRows || currentRows.length === 0) && (
                        <tr>
                            <td colSpan={7} style={{ textAlign: "center", color: "#6b7280", padding: "1rem" }}>
                                No employees found
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

                {filtered && filtered.length > perPage && (
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

            {(showCreate || showEdit) && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-left">
                            <h2>{showEdit ? "Edit Employee" : "Add Employee"}</h2>
                        </div>
                        <div className="modal-right">

                            <form onSubmit={showEdit ? saveEdit : createEmployee} className="form-body">
                                {!showEdit && (
                                    <div className="input-group password-group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            autoComplete="new-password"
                                            value={form.UserPassword}
                                            onChange={(e) => setForm({ ...form, UserPassword: e.target.value })}
                                            placeholder=" "
                                        />
                                        <label>Password *</label>
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label="Toggle password visibility"
                                            translate="no"
                                        >
                                            {showPassword ? (
                                                <svg viewBox="-2.16 -2.16 28.32 28.32" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#404040" strokeWidth="0.192">
                                                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                                    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                                    <g id="SVGRepo_iconCarrier">
                                                        <path d="M2.68936 6.70456C2.52619 6.32384 2.08528 6.14747 1.70456 6.31064C1.32384 6.47381 1.14747 6.91472 1.31064 7.29544L2.68936 6.70456ZM15.5872 13.3287L15.3125 12.6308L15.5872 13.3287ZM9.04145 13.7377C9.26736 13.3906 9.16904 12.926 8.82185 12.7001C8.47466 12.4742 8.01008 12.5725 7.78417 12.9197L9.04145 13.7377ZM6.37136 15.091C6.14545 15.4381 6.24377 15.9027 6.59096 16.1286C6.93815 16.3545 7.40273 16.2562 7.62864 15.909L6.37136 15.091ZM22.6894 7.29544C22.8525 6.91472 22.6762 6.47381 22.2954 6.31064C21.9147 6.14747 21.4738 6.32384 21.3106 6.70456L22.6894 7.29544ZM19 11.1288L18.4867 10.582V10.582L19 11.1288ZM19.9697 13.1592C20.2626 13.4521 20.7374 13.4521 21.0303 13.1592C21.3232 12.8663 21.3232 12.3914 21.0303 12.0985L19.9697 13.1592ZM11.25 16.5C11.25 16.9142 11.5858 17.25 12 17.25C12.4142 17.25 12.75 16.9142 12.75 16.5H11.25ZM16.3714 15.909C16.5973 16.2562 17.0619 16.3545 17.409 16.1286C17.7562 15.9027 17.8545 15.4381 17.6286 15.091L16.3714 15.909ZM5.53033 11.6592C5.82322 11.3663 5.82322 10.8914 5.53033 10.5985C5.23744 10.3056 4.76256 10.3056 4.46967 10.5985L5.53033 11.6592ZM2.96967 12.0985C2.67678 12.3914 2.67678 12.8663 2.96967 13.1592C3.26256 13.4521 3.73744 13.4521 4.03033 13.1592L2.96967 12.0985ZM12 13.25C8.77611 13.25 6.46133 11.6446 4.9246 9.98966C4.15645 9.16243 3.59325 8.33284 3.22259 7.71014C3.03769 7.3995 2.90187 7.14232 2.8134 6.96537C2.76919 6.87696 2.73689 6.80875 2.71627 6.76411C2.70597 6.7418 2.69859 6.7254 2.69411 6.71533C2.69187 6.7103 2.69036 6.70684 2.68957 6.70503C2.68917 6.70413 2.68896 6.70363 2.68892 6.70355C2.68891 6.70351 2.68893 6.70357 2.68901 6.70374C2.68904 6.70382 2.68913 6.70403 2.68915 6.70407C2.68925 6.7043 2.68936 6.70456 2 7C1.31064 7.29544 1.31077 7.29575 1.31092 7.29609C1.31098 7.29624 1.31114 7.2966 1.31127 7.2969C1.31152 7.29749 1.31183 7.2982 1.31218 7.299C1.31287 7.30062 1.31376 7.30266 1.31483 7.30512C1.31698 7.31003 1.31988 7.31662 1.32353 7.32483C1.33083 7.34125 1.34115 7.36415 1.35453 7.39311C1.38127 7.45102 1.42026 7.5332 1.47176 7.63619C1.57469 7.84206 1.72794 8.13175 1.93366 8.47736C2.34425 9.16716 2.96855 10.0876 3.8254 11.0103C5.53867 12.8554 8.22389 14.75 12 14.75V13.25ZM15.3125 12.6308C14.3421 13.0128 13.2417 13.25 12 13.25V14.75C13.4382 14.75 14.7246 14.4742 15.8619 14.0266L15.3125 12.6308ZM7.78417 12.9197L6.37136 15.091L7.62864 15.909L9.04145 13.7377L7.78417 12.9197ZM22 7C21.3106 6.70456 21.3107 6.70441 21.3108 6.70427C21.3108 6.70423 21.3108 6.7041 21.3109 6.70402C21.3109 6.70388 21.311 6.70376 21.311 6.70368C21.3111 6.70352 21.3111 6.70349 21.3111 6.7036C21.311 6.7038 21.3107 6.70452 21.3101 6.70576C21.309 6.70823 21.307 6.71275 21.3041 6.71924C21.2983 6.73223 21.2889 6.75309 21.2758 6.78125C21.2495 6.83757 21.2086 6.92295 21.1526 7.03267C21.0406 7.25227 20.869 7.56831 20.6354 7.9432C20.1669 8.69516 19.4563 9.67197 18.4867 10.582L19.5133 11.6757C20.6023 10.6535 21.3917 9.56587 21.9085 8.73646C22.1676 8.32068 22.36 7.9668 22.4889 7.71415C22.5533 7.58775 22.602 7.48643 22.6353 7.41507C22.6519 7.37939 22.6647 7.35118 22.6737 7.33104C22.6782 7.32097 22.6818 7.31292 22.6844 7.30696C22.6857 7.30398 22.6867 7.30153 22.6876 7.2996C22.688 7.29864 22.6883 7.29781 22.6886 7.29712C22.6888 7.29677 22.6889 7.29646 22.689 7.29618C22.6891 7.29604 22.6892 7.29585 22.6892 7.29578C22.6893 7.29561 22.6894 7.29544 22 7ZM18.4867 10.582C17.6277 11.3882 16.5739 12.1343 15.3125 12.6308L15.8619 14.0266C17.3355 13.4466 18.5466 12.583 19.5133 11.6757L18.4867 10.582ZM18.4697 11.6592L19.9697 13.1592L21.0303 12.0985L19.5303 10.5985L18.4697 11.6592ZM11.25 14V16.5H12.75V14H11.25ZM14.9586 13.7377L16.3714 15.909L17.6286 15.091L16.2158 12.9197L14.9586 13.7377ZM4.46967 10.5985L2.96967 12.0985L4.03033 13.1592L5.53033 11.6592L4.46967 10.5985Z" fill="#404040"></path>
                                                    </g>
                                                </svg>
                                            ) : (
                                                <svg viewBox="-1.92 -1.92 27.84 27.84" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#404040">
                                                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                                    <g id="SVGRepo_iconCarrier"> <path d="M9 4.45962C9.91153 4.16968 10.9104 4 12 4C16.1819 4 19.028 6.49956 20.7251 8.70433C21.575 9.80853 22 10.3606 22 12C22 13.6394 21.575 14.1915 20.7251 15.2957C19.028 17.5004 16.1819 20 12 20C7.81811 20 4.97196 17.5004 3.27489 15.2957C2.42496 14.1915 2 13.6394 2 12C2 10.3606 2.42496 9.80853 3.27489 8.70433C3.75612 8.07914 4.32973 7.43025 5 6.82137" stroke="#404040" strokeWidth="1.5" strokeLinecap="round"></path>
                                                        <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="#404040" strokeWidth="1.5"></path>
                                                    </g>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {showEdit && (
                                    <div className="input-group password-group">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={form.UserPassword}
                                            autoComplete="off"
                                            onChange={(e) => setForm({ ...form, UserPassword: e.target.value })}
                                            placeholder=" "
                                            translate="no"
                                        />
                                        <label>New Password (optional)</label>
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowNewPassword((v) => !v)}
                                            aria-label="Toggle password visibility"
                                        >
                                            {showNewPassword ? (
                                                <svg viewBox="-2.16 -2.16 28.32 28.32" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#404040" strokeWidth="0.192">
                                                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                                    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                                    <g id="SVGRepo_iconCarrier">
                                                        <path d="M2.68936 6.70456C2.52619 6.32384 2.08528 6.14747 1.70456 6.31064C1.32384 6.47381 1.14747 6.91472 1.31064 7.29544L2.68936 6.70456ZM15.5872 13.3287L15.3125 12.6308L15.5872 13.3287ZM9.04145 13.7377C9.26736 13.3906 9.16904 12.926 8.82185 12.7001C8.47466 12.4742 8.01008 12.5725 7.78417 12.9197L9.04145 13.7377ZM6.37136 15.091C6.14545 15.4381 6.24377 15.9027 6.59096 16.1286C6.93815 16.3545 7.40273 16.2562 7.62864 15.909L6.37136 15.091ZM22.6894 7.29544C22.8525 6.91472 22.6762 6.47381 22.2954 6.31064C21.9147 6.14747 21.4738 6.32384 21.3106 6.70456L22.6894 7.29544ZM19 11.1288L18.4867 10.582V10.582L19 11.1288ZM19.9697 13.1592C20.2626 13.4521 20.7374 13.4521 21.0303 13.1592C21.3232 12.8663 21.3232 12.3914 21.0303 12.0985L19.9697 13.1592ZM11.25 16.5C11.25 16.9142 11.5858 17.25 12 17.25C12.4142 17.25 12.75 16.9142 12.75 16.5H11.25ZM16.3714 15.909C16.5973 16.2562 17.0619 16.3545 17.409 16.1286C17.7562 15.9027 17.8545 15.4381 17.6286 15.091L16.3714 15.909ZM5.53033 11.6592C5.82322 11.3663 5.82322 10.8914 5.53033 10.5985C5.23744 10.3056 4.76256 10.3056 4.46967 10.5985L5.53033 11.6592ZM2.96967 12.0985C2.67678 12.3914 2.67678 12.8663 2.96967 13.1592C3.26256 13.4521 3.73744 13.4521 4.03033 13.1592L2.96967 12.0985ZM12 13.25C8.77611 13.25 6.46133 11.6446 4.9246 9.98966C4.15645 9.16243 3.59325 8.33284 3.22259 7.71014C3.03769 7.3995 2.90187 7.14232 2.8134 6.96537C2.76919 6.87696 2.73689 6.80875 2.71627 6.76411C2.70597 6.7418 2.69859 6.7254 2.69411 6.71533C2.69187 6.7103 2.69036 6.70684 2.68957 6.70503C2.68917 6.70413 2.68896 6.70363 2.68892 6.70355C2.68891 6.70351 2.68893 6.70357 2.68901 6.70374C2.68904 6.70382 2.68913 6.70403 2.68915 6.70407C2.68925 6.7043 2.68936 6.70456 2 7C1.31064 7.29544 1.31077 7.29575 1.31092 7.29609C1.31098 7.29624 1.31114 7.2966 1.31127 7.2969C1.31152 7.29749 1.31183 7.2982 1.31218 7.299C1.31287 7.30062 1.31376 7.30266 1.31483 7.30512C1.31698 7.31003 1.31988 7.31662 1.32353 7.32483C1.33083 7.34125 1.34115 7.36415 1.35453 7.39311C1.38127 7.45102 1.42026 7.5332 1.47176 7.63619C1.57469 7.84206 1.72794 8.13175 1.93366 8.47736C2.34425 9.16716 2.96855 10.0876 3.8254 11.0103C5.53867 12.8554 8.22389 14.75 12 14.75V13.25ZM15.3125 12.6308C14.3421 13.0128 13.2417 13.25 12 13.25V14.75C13.4382 14.75 14.7246 14.4742 15.8619 14.0266L15.3125 12.6308ZM7.78417 12.9197L6.37136 15.091L7.62864 15.909L9.04145 13.7377L7.78417 12.9197ZM22 7C21.3106 6.70456 21.3107 6.70441 21.3108 6.70427C21.3108 6.70423 21.3108 6.7041 21.3109 6.70402C21.3109 6.70388 21.311 6.70376 21.311 6.70368C21.3111 6.70352 21.3111 6.70349 21.3111 6.7036C21.311 6.7038 21.3107 6.70452 21.3101 6.70576C21.309 6.70823 21.307 6.71275 21.3041 6.71924C21.2983 6.73223 21.2889 6.75309 21.2758 6.78125C21.2495 6.83757 21.2086 6.92295 21.1526 7.03267C21.0406 7.25227 20.869 7.56831 20.6354 7.9432C20.1669 8.69516 19.4563 9.67197 18.4867 10.582L19.5133 11.6757C20.6023 10.6535 21.3917 9.56587 21.9085 8.73646C22.1676 8.32068 22.36 7.9668 22.4889 7.71415C22.5533 7.58775 22.602 7.48643 22.6353 7.41507C22.6519 7.37939 22.6647 7.35118 22.6737 7.33104C22.6782 7.32097 22.6818 7.31292 22.6844 7.30696C22.6857 7.30398 22.6867 7.30153 22.6876 7.2996C22.688 7.29864 22.6883 7.29781 22.6886 7.29712C22.6888 7.29677 22.6889 7.29646 22.689 7.29618C22.6891 7.29604 22.6892 7.29585 22.6892 7.29578C22.6893 7.29561 22.6894 7.29544 22 7ZM18.4867 10.582C17.6277 11.3882 16.5739 12.1343 15.3125 12.6308L15.8619 14.0266C17.3355 13.4466 18.5466 12.583 19.5133 11.6757L18.4867 10.582ZM18.4697 11.6592L19.9697 13.1592L21.0303 12.0985L19.5303 10.5985L18.4697 11.6592ZM11.25 14V16.5H12.75V14H11.25ZM14.9586 13.7377L16.3714 15.909L17.6286 15.091L16.2158 12.9197L14.9586 13.7377ZM4.46967 10.5985L2.96967 12.0985L4.03033 13.1592L5.53033 11.6592L4.46967 10.5985Z" fill="#404040"></path>
                                                    </g>
                                                </svg>
                                            ) : (
                                                <svg viewBox="-1.92 -1.92 27.84 27.84" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#404040">
                                                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                                                    <g id="SVGRepo_iconCarrier"> <path d="M9 4.45962C9.91153 4.16968 10.9104 4 12 4C16.1819 4 19.028 6.49956 20.7251 8.70433C21.575 9.80853 22 10.3606 22 12C22 13.6394 21.575 14.1915 20.7251 15.2957C19.028 17.5004 16.1819 20 12 20C7.81811 20 4.97196 17.5004 3.27489 15.2957C2.42496 14.1915 2 13.6394 2 12C2 10.3606 2.42496 9.80853 3.27489 8.70433C3.75612 8.07914 4.32973 7.43025 5 6.82137" stroke="#404040" strokeWidth="1.5" strokeLinecap="round"></path>
                                                        <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="#404040" strokeWidth="1.5"></path>
                                                    </g>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                )}

                                <div className="grid-two">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            required
                                            autoComplete="off"
                                            value={form.FirstName}
                                            onChange={(e) => setForm({ ...form, FirstName: e.target.value })}
                                            placeholder=" "
                                        />
                                        <label>First Name *</label>
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            required
                                            autoComplete="off"
                                            value={form.LastName}
                                            onChange={(e) => setForm({ ...form, LastName: e.target.value })}
                                            placeholder=" "
                                        />
                                        <label>Last Name *</label>
                                    </div>
                                </div>

                                <div className="grid-two">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            autoComplete="off"
                                            value={form.Phone}
                                            onChange={(e) => setForm({ ...form, Phone: e.target.value })}
                                            placeholder=" "
                                        />
                                        <label>Phone</label>
                                    </div>
                                    <div className="input-group">
                                        <input
                                            type="email"
                                            required
                                            autoComplete="off"
                                            value={form.Email}
                                            onChange={(e) => setForm({ ...form, Email: e.target.value })}
                                            placeholder=" "
                                        />
                                        <label>Email *</label>
                                    </div>
                                </div>

                                <div className="input-group">
                                    <select
                                        className="select-input"
                                        autoComplete="off"
                                        value={form.Role}
                                        onChange={(e) => setForm({ ...form, Role: e.target.value })}
                                    >
                                        <option value="Cashier">Cashier</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                    <label className="label-floating">Role</label>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="cancel-btn" onClick={closeModals}>
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

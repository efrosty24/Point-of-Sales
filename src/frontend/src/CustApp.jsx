import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import api from "./utils/api.js";
import "./CustApp.css";

function CustApp() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zip, setZip] = useState("");
    const [country, setCountry] = useState("USA");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState({});
    const [tempCustomerData, setTempCustomerData] = useState(null);

    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const US_STATES = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
    ];

    
    const handleGuestLogin = () => {
        const guestUser = {
            id: 1000,
            name: "Guest",
            role: "customer",
            isAdmin: false
        };
        setUser(guestUser);
        navigate("/cashier");
    };

    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(email)) {
            newErrors.email = "Invalid email format";
        }

        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        if (!isLogin) {
            if (!firstName.trim()) newErrors.firstName = "First name is required";
            if (!lastName.trim()) newErrors.lastName = "Last name is required";

            if (!phone) {
                newErrors.phone = "Phone number is required";
            } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
                newErrors.phone = "Invalid phone number";
            }

            if (!address.trim()) newErrors.address = "Address is required";
            if (!city.trim()) newErrors.city = "City is required";
            if (!state) newErrors.state = "State is required";

            if (!zip) {
                newErrors.zip = "ZIP code is required";
            } else if (!/^\d{5}$/.test(zip)) {
                newErrors.zip = "ZIP code must be 5 digits";
            }

            if (!country.trim()) newErrors.country = "Country is required";

            if (!confirmPassword) {
                newErrors.confirmPassword = "Please confirm your password";
            } else if (password !== confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePasswordChange = () => {
        const newErrors = {};

        if (!newPassword) {
            newErrors.newPassword = "New password is required";
        } else if (newPassword.length < 8) {
            newErrors.newPassword = "Password must be at least 8 characters";
        }

        if (!confirmNewPassword) {
            newErrors.confirmNewPassword = "Please confirm your new password";
        } else if (newPassword !== confirmNewPassword) {
            newErrors.confirmNewPassword = "Passwords do not match";
        }

        setPasswordErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (!validatePasswordChange()) return;

        setIsLoading(true);

        try {
            const response = await api.post("/admin/customers/updatePass", {
                customerId: tempCustomerData.id,
                newPassword: newPassword
            });

            if (response.data.success) {
                setShowPasswordModal(false);
                setUser(tempCustomerData);
                navigate("/dashboard");
            } else {
                setPasswordErrors({
                    submit: response.data.message || "Failed to update password"
                });
            }
        } catch (error) {
            console.error('Password change error:', error);
            setPasswordErrors({
                submit: error.response?.data?.message || "Unable to update password"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError("");

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            if (isLogin) {
                const response = await api.post("/admin/customers/login", {
                    email,
                    password,
                });

                if (response.data.passwordChangeRequired) {
                    setTempCustomerData(response.data.customer);
                    setShowPasswordModal(true);
                    setIsLoading(false);
                    return;
                }

                if (response.data.success) {
                    setUser(response.data.customer);
                    navigate("/cashier");
                } else {
                    setServerError(response.data.message || "Login failed");
                }
            } else {
                const payload = {
                    FirstName: firstName,
                    LastName: lastName,
                    Phone: phone.replace(/\D/g, ''),
                    Email: email,
                    Address: address,
                    City: city,
                    State: state,
                    Zip: zip,
                    Country: country,
                    Password: password
                };

                const res = await api.post(`/admin/customers`, payload);

                if (res.status < 200 || res.status >= 300) {
                    console.error("Create failed");
                    setServerError("Registration failed. Please try again.");
                    alert(res.data.error || "SignUp Failed");
                    return;
                }
                console.log(res);
                const customer = res.data.customer;

                const transformed = {
                    id: customer.CustomerID,
                    name: customer.FirstName + " " + customer.LastName,
                    Phone: customer.Phone,
                    Email: customer.Email,
                    Address: customer.Address,
                    City: customer.City,
                    State: customer.State,
                    Zip: customer.Zip,
                    Country: customer.Country,
                    Password: customer.Password,
                    role: "customer",
                    points: 0
                };
                console.log(transformed);

                setUser(transformed);

                navigate("/cashier");
            }
        } catch (error) {
            console.error('Auth error:', error);
            setServerError(error.response?.data?.error || "Unable to connect to server");
            alert(error.response?.data?.error || "SignUp Failed");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setErrors({});
        setServerError("");
        setPassword("");
        setConfirmPassword("");
    };

    const handleModalOverlayClick = (e) => {
        if (e.target.className === 'modal-overlay') {
            setShowPasswordModal(false);
        }
    };

    return (
        <div className="auth-container">
            {}
            <div className="auth-bg">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
                <div className="bg-orb bg-orb-3"></div>
                <div className="grid-overlay"></div>
            </div>

            {}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={handleModalOverlayClick}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Change Password Required</h2>
                            <p>You must create a new password to continue</p>
                        </div>

                        <form onSubmit={handlePasswordChange} className="modal-form">
                            {passwordErrors.submit && (
                                <div className="server-error">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span>{passwordErrors.submit}</span>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <div className={`input-wrapper ${passwordErrors.newPassword ? 'error' : ''}`}>
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                        <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? (
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {passwordErrors.newPassword && <span className="error-message">{passwordErrors.newPassword}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                                <div className={`input-wrapper ${passwordErrors.confirmNewPassword ? 'error' : ''}`}>
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                        <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <input
                                        type={showConfirmNewPassword ? "text" : "password"}
                                        id="confirmNewPassword"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                    >
                                        {showConfirmNewPassword ? (
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {passwordErrors.confirmNewPassword && <span className="error-message">{passwordErrors.confirmNewPassword}</span>}
                            </div>

                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Update Password</span>
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {}
            <div className="auth-card">
                {}
                <div className="auth-branding">
                    <div className="brand-content">
                        <h1 className="brand-name">Grocery 7</h1>
                        <p className="brand-tagline">Your premium grocery destination</p>

                        <div className="brand-features">
                            <div className="brand-feature">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Fresh daily products</span>
                            </div>
                            <div className="brand-feature">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Fast delivery</span>
                            </div>
                            <div className="brand-feature">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Best prices guaranteed</span>
                            </div>
                        </div>

                        <div className="decorative-pattern">
                            <div className="pattern-dot"></div>
                            <div className="pattern-dot"></div>
                            <div className="pattern-dot"></div>
                        </div>
                    </div>
                </div>

                {}
                <div className="auth-form-section">
                    <div className="form-container">
                        {}
                        <button className="back-home" onClick={() => navigate("/")} type="button">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>Back to Home</span>
                        </button>

                        {}
                        <div className="form-header">
                            <h2 className="form-title">
                                {isLogin ? "Welcome Back" : "Create Account"}
                            </h2>
                            <p className="form-subtitle">
                                {isLogin
                                    ? "Sign in to access your account"
                                    : "Join us for exclusive deals and offers"}
                            </p>
                        </div>

                        {}
                        {serverError && (
                            <div className="server-error">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>{serverError}</span>
                            </div>
                        )}

                        {}
                        <form onSubmit={handleSubmit} className="auth-form">
                            {!isLogin && (
                                <>
                                    {}
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="firstName">First Name</label>
                                            <div className={`input-wrapper ${errors.firstName ? 'error' : ''}`}>
                                                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                                    <path d="M20 21C20 19.6044 20 18.9067 19.8278 18.3389C19.44 17.0605 18.4395 16.06 17.1611 15.6722C16.5933 15.5 15.8956 15.5 14.5 15.5H9.5C8.10444 15.5 7.40665 15.5 6.83886 15.6722C5.56045 16.06 4.56004 17.0605 4.17224 18.3389C4 18.9067 4 19.6044 4 21M16.5 7.5C16.5 9.98528 14.4853 12 12 12C9.51472 12 7.5 9.98528 7.5 7.5C7.5 5.01472 9.51472 3 12 3C14.4853 3 16.5 5.01472 16.5 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <input
                                                    type="text"
                                                    id="firstName"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    placeholder="John"
                                                />
                                            </div>
                                            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="lastName">Last Name</label>
                                            <div className={`input-wrapper ${errors.lastName ? 'error' : ''}`}>
                                                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                                    <path d="M20 21C20 19.6044 20 18.9067 19.8278 18.3389C19.44 17.0605 18.4395 16.06 17.1611 15.6722C16.5933 15.5 15.8956 15.5 14.5 15.5H9.5C8.10444 15.5 7.40665 15.5 6.83886 15.6722C5.56045 16.06 4.56004 17.0605 4.17224 18.3389C4 18.9067 4 19.6044 4 21M16.5 7.5C16.5 9.98528 14.4853 12 12 12C9.51472 12 7.5 9.98528 7.5 7.5C7.5 5.01472 9.51472 3 12 3C14.4853 3 16.5 5.01472 16.5 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <input
                                                    type="text"
                                                    id="lastName"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    placeholder="Doe"
                                                />
                                            </div>
                                            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                                        </div>
                                    </div>
                                </>
                            )}

                            {}
                            <div className="form-group">
                                <label htmlFor="email">Email ID</label>
                                <div className={`input-wrapper ${errors.email ? 'error' : ''}`}>
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john.doe@example.com"
                                    />
                                </div>
                                {errors.email && <span className="error-message">{errors.email}</span>}
                            </div>

                            {!isLogin && (
                                <>
                                    {}
                                    <div className="form-group">
                                        <label htmlFor="phone">Phone Number</label>
                                        <div className={`input-wrapper ${errors.phone ? 'error' : ''}`}>
                                            <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M22 16.92V19.92C22 20.51 21.54 21 20.95 21C10.39 21 2 12.61 2 2.05C2 1.46 2.49 1 3.08 1H6.08C6.67 1 7.16 1.46 7.16 2.05C7.16 3.24 7.34 4.39 7.68 5.49C7.79 5.85 7.68 6.24 7.41 6.51L5.62 8.3C7.01 11.04 9.96 13.99 12.7 15.38L14.49 13.59C14.76 13.32 15.15 13.21 15.51 13.32C16.61 13.66 17.76 13.84 18.95 13.84C19.54 13.84 20 14.33 20 14.92V17.92C20 18.51 19.54 19 18.95 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <input
                                                type="tel"
                                                id="phone"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="(555) 123-4567"
                                            />
                                        </div>
                                        {errors.phone && <span className="error-message">{errors.phone}</span>}
                                    </div>

                                    {}
                                    <div className="form-group">
                                        <label htmlFor="address">Street Address</label>
                                        <div className={`input-wrapper ${errors.address ? 'error' : ''}`}>
                                            <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <input
                                                type="text"
                                                id="address"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="123 Main Street"
                                            />
                                        </div>
                                        {errors.address && <span className="error-message">{errors.address}</span>}
                                    </div>

                                    {}
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="city">City</label>
                                            <div className={`input-wrapper ${errors.city ? 'error' : ''}`}>
                                                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <input
                                                    type="text"
                                                    id="city"
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    placeholder="Houston"
                                                />
                                            </div>
                                            {errors.city && <span className="error-message">{errors.city}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="state">State</label>
                                            <div className={`input-wrapper ${errors.state ? 'error' : ''}`}>
                                                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <select
                                                    id="state"
                                                    value={state}
                                                    onChange={(e) => setState(e.target.value)}
                                                    className="state-select"
                                                >
                                                    <option value="">Select State</option>
                                                    {US_STATES.map(st => (
                                                        <option key={st} value={st}>{st}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {errors.state && <span className="error-message">{errors.state}</span>}
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="zip">ZIP Code</label>
                                            <div className={`input-wrapper ${errors.zip ? 'error' : ''}`}>
                                                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                                    <path d="M21 10H7M21 6H3M21 14H3M21 18H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <input
                                                    type="text"
                                                    id="zip"
                                                    value={zip}
                                                    onChange={(e) => setZip(e.target.value)}
                                                    placeholder="77001"
                                                    maxLength="5"
                                                />
                                            </div>
                                            {errors.zip && <span className="error-message">{errors.zip}</span>}
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="country">Country</label>
                                            <div className={`input-wrapper ${errors.country ? 'error' : ''}`}>
                                                <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                <input
                                                    type="text"
                                                    id="country"
                                                    value={country}
                                                    onChange={(e) => setCountry(e.target.value)}
                                                    placeholder="USA"
                                                />
                                            </div>
                                            {errors.country && <span className="error-message">{errors.country}</span>}
                                        </div>
                                    </div>
                                </>
                            )}

                            {}
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className={`input-wrapper ${errors.password ? 'error' : ''}`}>
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                        <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none">
                                                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && <span className="error-message">{errors.password}</span>}
                            </div>

                            {!isLogin && (
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <div className={`input-wrapper ${errors.confirmPassword ? 'error' : ''}`}>
                                        <svg className="input-icon" viewBox="0 0 24 24" fill="none">
                                            <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm your password"
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <svg viewBox="0 0 24 24" fill="none">
                                                    <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" fill="none">
                                                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                                </div>
                            )}

                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{isLogin ? "Sign In" : "Create Account"}</span>
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        {isLogin && (
                            <button onClick={handleGuestLogin} className="guest-btn" type="button">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M20 21C20 19.6044 20 18.9067 19.8278 18.3389C19.44 17.0605 18.4395 16.06 17.1611 15.6722C16.5933 15.5 15.8956 15.5 14.5 15.5H9.5C8.10444 15.5 7.40665 15.5 6.83886 15.6722C5.56045 16.06 4.56004 17.0605 4.17224 18.3389C4 18.9067 4 19.6044 4 21M16.5 7.5C16.5 9.98528 14.4853 12 12 12C9.51472 12 7.5 9.98528 7.5 7.5C7.5 5.01472 9.51472 3 12 3C14.4853 3 16.5 5.01472 16.5 7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Continue as Guest</span>
                            </button>
                        )}

                        {}
                        <div className="toggle-mode">
                            <p>
                                {isLogin ? "Don't have an account?" : "Already have an account?"}
                                <button onClick={toggleMode} className="toggle-btn" type="button">
                                    {isLogin ? "Sign Up" : "Sign In"}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CustApp;

import { useState, useContext } from "react";
import api from "./utils/api.js";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { AuthContext } from "./AuthContext";
import { useAlert } from "./AlertContext";

function App() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);
    const { showError, showSuccess } = useAlert();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!email.trim()) {
            showError("Please enter your email address.");
            setLoading(false);
            return;
        }

        if (!password.trim()) {
            showError("Please enter your password.");
            setLoading(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError("Please enter a valid email address.");
            setLoading(false);
            return;
        }

        try {
            const response = await api.post("/api/login", {
                email,
                password,
            });

            if (response.data.success) {
                setUser(response.data.employee);
                showSuccess("Login successful! Redirecting...");
                console.log(response.data);
                setTimeout(() => {
                    navigate("/dashboard");
                }, 500);
            } else {
                if(response.data.message === "InvalidUP"){
                    showError("Invalid email or password. Please try again.");
                }else {
                    showError("Login failed. Please try again.");
                }
            }
        } catch (e) {
            if (e.response?.status === 401) {
                showError("Invalid email or password. Please try again.");
            } else if (e.response?.status === 403) {
                showError("Your account has been deactivated. Please contact an administrator.");
            } else if (e.response?.status === 500) {
                showError("Server error. Please try again later.");
            } else if (e.code === "ERR_NETWORK") {
                showError("Unable to connect to server. Please check your internet connection.");
            } else {
                showError("An unexpected error occurred. Please try again.");
            }
            console.error("Login error:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">

            <div className="auth-bg">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
                <div className="bg-orb bg-orb-3"></div>
                <div className="grid-overlay"></div>
            </div>


            <div className="auth-card">

                <div className="auth-branding">
                    <div className="brand-content">
                        <h1 className="brand-name">Grocery7</h1>
                        <p className="brand-tagline">Personnel Access Portal</p>

                        <div className="brand-features">
                            <div className="brand-feature">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Secure employee authentication</span>
                            </div>
                            <div className="brand-feature">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                                <span>Access POS system</span>
                            </div>
                            <div className="brand-feature">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                                </svg>
                                <span>Manage inventory & sales</span>
                            </div>
                        </div>

                        <div className="decorative-pattern">
                            <span className="pattern-dot"></span>
                            <span className="pattern-dot"></span>
                            <span className="pattern-dot"></span>
                            <span className="pattern-dot"></span>
                        </div>
                    </div>
                </div>


                <div className="auth-form-section">
                    <div className="form-container">
                        <div className="form-header">
                            <h2 className="form-title">Employee Login</h2>
                            <p className="form-subtitle">
                                Enter your credentials to access the system
                            </p>
                        </div>

                        <form className="auth-form" onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="email">Email ID</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="employee@grocery7.com"
                                        autoComplete="email"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        disabled={loading}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Logging in...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                        </svg>
                                        Sign In
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;

import { useContext } from "react";
import "./Navbar.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../AuthContext";

function Navbar({ user }) {
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);


    const handleSignOut = () => {
        setUser(null);
        delete axios.defaults.headers.common["Authorization"];
        navigate("/", { replace: true });
    };

    return (
        <header className="navbar-container">
            <div className="navbar-left">
                <h1 className="navbar-title">Grocery POS</h1>
            </div>

            <div className="navbar-right">
                <div className="navbar-user">
                    <div className="user-info">
                        <div className="user-name">{user?.name || "User"}</div>
                        <div className="user-role">{user?.role || "Employee"}</div>
                    </div>

                    <button
                        className="user-avatar hover-signout"
                        type="button"
                        onClick={handleSignOut}
                        aria-label="Sign out"
                        title="Sign out"
                    >
                        <svg
                            className="avatar-icon"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="8" r="4" stroke="#2e7d32" strokeWidth="2" />
                            <path d="M4 20c1.8-3.2 5-5 8-5s6.2 1.8 8 5" stroke="#2e7d32" strokeWidth="2" fill="none" />
                        </svg>
                        <span className="avatar-text">Sign Out</span>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Navbar;

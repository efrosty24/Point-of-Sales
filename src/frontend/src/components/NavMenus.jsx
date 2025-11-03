import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useEffect, useContext } from "react";
import { AuthContext } from "../AuthContext";
import "./NavMenus.css";

function NavMenus() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (!user) navigate("/");
    }, [navigate, user]);
    if (!user) return null;
    return (
        <div className="layout">
            <Sidebar />
            <div className="main-section">
                <Navbar user={user} />
                <div className="content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default NavMenus;

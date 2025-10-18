import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useEffect } from "react";
import "./NavMenus.css";

function NavMenus() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        if (!user) navigate("/login");
    }, [navigate, user]);

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

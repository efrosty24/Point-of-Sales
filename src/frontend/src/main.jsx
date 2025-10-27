import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import NavMenus from "./components/NavMenus";
import Dashboard from "./pages/Dashboard";
// import EmpDashboard from "./pages/EmpDashboard";
import Cashier from "./pages/Cashier";
import SalesReport from "./pages/SalesReport.jsx";
import CustomerList from "./pages/CustomerList.jsx";
import "./index.css";

const user = JSON.parse(localStorage.getItem("user"));

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/" element={<NavMenus />}>
                {/*<Route*/}
                {/*    path="dashboard"*/}
                {/*    element={*/}
                {/*        user?.role === "Admin" ? <Dashboard /> : <EmpDashboard />*/}
                {/*    }*/}
                {/*/>*/}
                <Route path="dashbaord" element={<Dashboard />} />
                <Route path="salesreport" element={<SalesReport />} />
                <Route path="cashier" element={<Cashier />} />
                <Route path="CustomerList" element={<CustomerList />} />
            </Route>
        </Routes>
    </BrowserRouter>
);

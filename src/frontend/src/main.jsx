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
import InventoryManagement from "./pages/InventoryManagement.jsx";
import Employees from "./pages/Employees.jsx";
import DiscountManagement from "./pages/DiscountManagement.jsx";

const user = JSON.parse(localStorage.getItem("user"));

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/" element={<NavMenus />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="salesreport" element={<SalesReport />} />
                <Route path="cashier" element={<Cashier />} />
                <Route path="CustomerList" element={<CustomerList />} />
                <Route path="inventory" element={<InventoryManagement />} />
                <Route path="employees" element={<Employees />} />
                <Route path="discounts" element={<DiscountManagement />} />
            </Route>
        </Routes>
    </BrowserRouter>
);

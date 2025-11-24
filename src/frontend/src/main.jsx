import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import CustApp from "./CustApp";
import Start from "./pages/Start";
import NavMenus from "./components/NavMenus";
import Dashboard from "./pages/Dashboard";
import EmpDashboard from "./pages/EmpDashboard";
import Cashier from "./pages/Cashier";
import SalesReport from "./pages/SalesReport.jsx";
import CustomerList from "./pages/CustomerList.jsx";
import InventoryManagement from "./pages/InventoryManagement.jsx";
import Employees from "./pages/Employees.jsx";
import Suppliers from "./pages/SupplierList.jsx";
import DiscountManagement from "./pages/DiscountManagement.jsx";
import { AuthProvider, AuthContext } from "./AuthContext";
import { NotificationProvider } from "./NotificationContext";
import { AlertProvider } from "./AlertContext";
import { ConfirmProvider } from "./ConfirmContext";
import Alert from "./components/Alert";
import ConfirmDialog from "./components/ConfirmDialog";
import "./index.css";

function MainRouter() {
    const { user } = React.useContext(AuthContext);
    const isAdmin = user?.isAdmin === true || user?.role?.toLowerCase() === "admin";

    return (
        <NotificationProvider user={user}>
            <AlertProvider>
                <ConfirmProvider>
                    <Alert />
                    <ConfirmDialog />
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Start />} />
                            <Route path="/empLogin" element={<App />} />
                            <Route path="/custLogin" element={<CustApp />} />
                            <Route element={<NavMenus />}>
                                <Route path="/dashboard" element={isAdmin ? <Dashboard /> : <EmpDashboard />} />
                                <Route path="/salesreport" element={<SalesReport />} />
                                <Route path="/cashier" element={<Cashier />} />
                                <Route path="/customerlist" element={<CustomerList />} />
                                <Route path="/inventory" element={<InventoryManagement />} />
                                <Route path="/employees" element={<Employees />} />
                                <Route path="/suppliers" element={<Suppliers />} />
                                <Route path="/discounts" element={<DiscountManagement />} />
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </ConfirmProvider>
            </AlertProvider>
        </NotificationProvider>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <AuthProvider>
        <MainRouter />
    </AuthProvider>
);

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import NavMenus from "./components/NavMenus";
import Dashboard from "./pages/Dashboard";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/" element={<NavMenus />}>
                <Route path="dashboard" element={<Dashboard />} />
            </Route>
        </Routes>
    </BrowserRouter>
);

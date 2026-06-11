import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import "./App.css";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Stock from "./pages/StockManagement";
import Requests from "./pages/Requests";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Notify from "./pages/Notify";
import Logout from "./pages/Logout";
import AddItem from "./components/inventory/AddItem";
import ProtectedRoute from "./route/ProtectedRoute";
import NewRequest from "./components/request/NewRequest";
import GenerateReportModal from "./components/reports/GenerateReportModal";

function App() {
  return (
    <AnimatePresence>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/add-new-item" element={<AddItem />} />
          <Route path="stock" element={<Stock />} />
          <Route path="requests" element={<Requests />} />
          <Route path="requests/new-request" element={<NewRequest />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notify />} />
          <Route path="profile" element={<Settings />} />
          <Route path="logout" element={<Logout />} />
          <Route path="generate-report" element={<GenerateReportModal />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;

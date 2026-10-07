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
import Profile from "./pages/Profile";
import Logout from "./pages/Logout";

import AddItem from "./components/inventory/AddItem";
import NewRequest from "./components/request/NewRequest";
import GenerateReportModal from "./components/reports/GenerateReportModal";

import IssuedInventory from "./pages/IssuedInventory";
import AuditLogs from "./pages/AuditLogs";
import MyActivity from "./pages/MyActivity";
import Messages from "./pages/Messages";

import ProtectedRoute from "./route/ProtectedRoute";
import PublicOnlyRoute from "./route/PublicOnlyRoute";

import RoleProtectedRoute, { ROLES } from "./route/RoleProtectedRoute";

function App() {
  return (
    <AnimatePresence>
      <Routes>
        {/* =================================================
            PUBLIC ROUTES
            ================================================= */}

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/logout" element={<Logout />} />

        {/* =================================================
            PROTECTED APPLICATION
            ================================================= */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="audit-logs"
            element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRATOR]}>
                <AuditLogs />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="my-activity"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.ADMINISTRATOR,
                  ROLES.DIRECTORATE,
                  ROLES.STORE_MANAGER,
                  ROLES.STAFF,
                ]}
              >
                <MyActivity />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              DASHBOARD
              ALL ROLES
              ================================================= */}

          <Route
            index
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.ADMINISTRATOR,
                  ROLES.DIRECTORATE,
                  ROLES.STORE_MANAGER,
                  ROLES.STAFF,
                ]}
              >
                <Dashboard />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              INVENTORY
              ALL ROLES
              ================================================= */}

          <Route
            path="inventory"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.ADMINISTRATOR,
                  ROLES.DIRECTORATE,
                  ROLES.STORE_MANAGER,
                  ROLES.STAFF,
                ]}
              >
                <Inventory />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              ADD INVENTORY ITEM
              ADMINISTRATOR + STORE MANAGER
              ================================================= */}

          <Route
            path="inventory/add-new-item"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.STORE_MANAGER,
                ]}
              >
                <AddItem />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              STOCK MOVEMENT
              ADMINISTRATOR + STORE MANAGER
              ================================================= */}

          <Route
            path="stock"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.STORE_MANAGER,
                ]}
              >
                <Stock />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              REQUESTS
              ALL ROLES
              ================================================= */}

          <Route
            path="requests"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.DIRECTORATE,
                  ROLES.STORE_MANAGER,
                  ROLES.STAFF,
                ]}
              >
                <Requests />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              NEW REQUEST
              STAFF ONLY
              ================================================= */}

          <Route
            path="requests/new-request"
            element={
              <RoleProtectedRoute allowedRoles={[ROLES.STAFF]}>
                <NewRequest />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              ISSUED INVENTORY
              STORE MANAGER ONLY
              ================================================= */}

          <Route
            path="issued-inventory"
            element={
              <RoleProtectedRoute allowedRoles={[ROLES.STORE_MANAGER]}>
                <IssuedInventory />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              REPORTS
              ADMINISTRATOR + STORE MANAGER
              ================================================= */}

          <Route
            path="reports"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.DIRECTORATE,
                  ROLES.STORE_MANAGER,
                ]}
              >
                <Reports />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              USER MANAGEMENT
              ADMINISTRATOR ONLY
              ================================================= */}

          <Route
            path="users"
            element={
              <RoleProtectedRoute allowedRoles={[ROLES.ADMINISTRATOR]}>
                <Users />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="messages"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.ADMINISTRATOR,
                  ROLES.DIRECTORATE,
                  ROLES.STORE_MANAGER,
                  ROLES.STAFF,
                ]}
              >
                <Messages />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              SETTINGS
              ALL ROLES
              ================================================= */}

          <Route
            path="settings"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.ADMINISTRATOR,
                  ROLES.STORE_MANAGER,
                  ROLES.STAFF,
                ]}
              >
                <Settings />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              NOTIFICATIONS
              ALL ROLES
              ================================================= */}

          <Route
            path="notifications"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.ADMINISTRATOR,
                  ROLES.STORE_MANAGER,
                  ROLES.STAFF,
                ]}
              >
                <Notify />
              </RoleProtectedRoute>
            }
          />

          {/* =================================================
              PROFILE
              ALL ROLES
              ================================================= */}

          <Route
            path="profile"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.ADMINISTRATOR,
                  ROLES.STORE_MANAGER,
                  ROLES.STAFF,
                ]}
              >
                <Profile />
              </RoleProtectedRoute>
            }
          />
          {/* =================================================
              GENERATE REPORT
              ADMINISTRATOR + STORE MANAGER
              ================================================= */}

          <Route
            path="generate-report"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  ROLES.ADMINISTRATOR,
                  ROLES.DIRECTORATE,
                  ROLES.STORE_MANAGER,
                ]}
              >
                <GenerateReportModal />
              </RoleProtectedRoute>
            }
          />
        </Route>

        {/* =================================================
            FALLBACK
            ================================================= */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;

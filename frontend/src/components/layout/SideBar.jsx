import React, { useEffect, useState } from "react";

import { NavLink, useLocation } from "react-router-dom";

import {
  FaBoxOpen,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTachometerAlt,
  FaExchangeAlt,
  FaClipboardList,
  FaUsers,
  FaClipboardCheck,
  FaHistory,
  FaBell,
  FaUserClock,
  FaEnvelope,
} from "react-icons/fa";

import apiClient from "../../services/apiClient";

// =========================================================
// ROLE CONSTANTS
// =========================================================

const ROLES = Object.freeze({
  SUPER_ADMIN: "Super Admin",
  ADMINISTRATOR: "Administrator",
  STORE_MANAGER: "Store Manager",
  STAFF: "Staff",
});

// =========================================================
// NAVIGATION ITEM
// =========================================================

function NavItem({
  to,
  end = false,
  icon: Icon,
  children,
  isReportsRoute = false,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
          isActive || isReportsRoute
            ? "bg-blue-700 text-white"
            : "text-slate-200 hover:bg-slate-800"
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0 text-current" />

      <span>{children}</span>
    </NavLink>
  );
}

// =========================================================
// SIDEBAR
// =========================================================

function SideBar() {
  const location = useLocation();

  const [user, setUser] = useState(null);

  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const isReportsSection =
    location.pathname === "/reports" ||
    location.pathname === "/generate-report";

  // =======================================================
  // LOAD CURRENT USER
  // =======================================================

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        setIsLoadingUser(true);

        const response = await apiClient.get("/api/auth/me");

        if (!mounted) {
          return;
        }

        setUser(response.data?.user || null);
      } catch (error) {
        console.error("[SideBar] Failed to load current user:", error);

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoadingUser(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  // =======================================================
  // CURRENT ROLE
  // =======================================================

  const userRole = user?.role || null;

  const isAdministrator =
    userRole === ROLES.ADMINISTRATOR || userRole === ROLES.SUPER_ADMIN;

  const isStoreManager = userRole === ROLES.STORE_MANAGER;

  const isStaff = userRole === ROLES.STAFF;

  // =======================================================
  // ROLE-BASED PERMISSIONS
  // =======================================================

  const canViewDashboard = isAdministrator || isStoreManager || isStaff;

  const canViewInventory = isAdministrator || isStoreManager || isStaff;

  const canViewStockMovement = isAdministrator || isStoreManager;

  const canViewRequests = isAdministrator || isStoreManager || isStaff;

  const canViewNotifications = isAdministrator || isStoreManager || isStaff;

  const canViewIssuedInventory = isStoreManager;

  const canViewReports =
    userRole === ROLES.SUPER_ADMIN || isStoreManager;

  const canViewAuditLogs = isAdministrator;

  const canViewMyActivity = isAdministrator || isStoreManager || isStaff;

  const canViewUserManagement = isAdministrator;

  const canViewSettings = isAdministrator || isStoreManager || isStaff;
  const canViewMessages = isAdministrator || isStoreManager || isStaff;

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col overflow-hidden bg-slate-900 text-white">
      {/* ===================================================
          BRAND
          =================================================== */}

      <div className="shrink-0 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 font-bold">
            HU
          </div>

          <div>
            <h1 className="text-lg font-semibold">HU-ICT</h1>

            <p className="text-xs text-slate-300">Store Management System</p>
          </div>
        </div>

        {/* =================================================
            USER / ROLE
            ================================================= */}

        {!isLoadingUser && user && (
          <div className="mb-5 rounded-lg bg-slate-800 px-3 py-2">
            <div className="truncate text-sm font-semibold text-white">
              {user.full_name || user.fullName || "User"}
            </div>

            <div className="mt-0.5 text-xs text-slate-400">
              {userRole || "Unknown role"}
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          MAIN NAVIGATION
          ================================================= */}

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
        <nav className="space-y-1">
          {/* DASHBOARD */}

          {canViewDashboard && (
            <NavItem to="/" end icon={FaTachometerAlt}>
              Dashboard
            </NavItem>
          )}

          {/* INVENTORY */}

          {canViewInventory && (
            <NavItem to="/inventory" icon={FaBoxOpen}>
              Inventory
            </NavItem>
          )}

          {/* STOCK MOVEMENT */}

          {canViewStockMovement && (
            <NavItem to="/stock" icon={FaExchangeAlt}>
              Stock Movement
            </NavItem>
          )}

          {/* REQUESTS */}

          {canViewRequests && (
            <NavItem to="/requests" icon={FaClipboardList}>
              Requests
            </NavItem>
          )}

          {/* NOTIFICATIONS */}

          {canViewNotifications && (
            <NavItem to="/notifications" icon={FaBell}>
              Notifications
            </NavItem>
          )}

          {/* ISSUED INVENTORY */}

          {canViewIssuedInventory && (
            <NavItem to="/issued-inventory" icon={FaClipboardCheck}>
              Issued Inventory
            </NavItem>
          )}

          {/* REPORTS */}

          {canViewReports && (
            <NavItem
              to="/reports"
              icon={FaChartBar}
              isReportsRoute={isReportsSection}
            >
              Reports
            </NavItem>
          )}

          {/* AUDIT LOG */}

          {canViewAuditLogs && (
            <NavItem to="/audit-logs" icon={FaHistory}>
              Audit Log
            </NavItem>
          )}

          {/* MY ACTIVITY */}

          {canViewMyActivity && (
            <NavItem to="/my-activity" icon={FaUserClock}>
              My Activity
            </NavItem>
          )}

          {/* USER MANAGEMENT */}

          {canViewUserManagement && (
            <NavItem to="/users" icon={FaUsers}>
              User Management
            </NavItem>
          )}
          {canViewMessages && (
            <NavItem to="/messages" icon={FaEnvelope}>
              Messages
            </NavItem>
          )}
        </nav>
      </div>

      {/* ===================================================
          BOTTOM NAVIGATION
          =================================================== */}

      <div className="mt-auto shrink-0 p-6">
        {/* SETTINGS */}

        {canViewSettings && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            <FaCog className="h-4 w-4 shrink-0 text-current" />

            <span>Settings</span>
          </NavLink>
        )}

        {/* LOGOUT */}

        <NavLink
          to="/logout"
          className={({ isActive }) =>
            `mt-2 flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
              isActive
                ? "bg-slate-800 text-red-600"
                : "text-red-600 hover:bg-slate-800"
            }`
          }
        >
          <FaSignOutAlt className="h-4 w-4 shrink-0 text-current" />

          <span>Logout</span>
        </NavLink>
      </div>
    </aside>
  );
}

export default SideBar;

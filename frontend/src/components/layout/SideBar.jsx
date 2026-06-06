import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  FaBoxOpen,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTachometerAlt,
  FaExchangeAlt,
  FaClipboardList,
  FaUsers,
} from "react-icons/fa";

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
        `flex items-center gap-3 px-3 py-2 rounded-md ${
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

function SideBar() {
  const location = useLocation();
  const isReportsSection =
    location.pathname === "/reports" ||
    location.pathname === "/generate-report";

  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center font-bold">
            HU
          </div>
          <div>
            <h1 className="text-lg font-semibold">HU-ICT</h1>
            <p className="text-xs text-slate-300">Store Management System</p>
          </div>
        </div>

        <nav className="space-y-1">
          <NavItem to="/" end icon={FaTachometerAlt}>
            Dashboard
          </NavItem>
          <NavItem to="/inventory" icon={FaBoxOpen}>
            Inventory
          </NavItem>
          <NavItem to="/stock" icon={FaExchangeAlt}>
            Stock Movement
          </NavItem>
          <NavItem to="/requests" icon={FaClipboardList}>
            Requests
          </NavItem>
          <NavItem
            to="/reports"
            icon={FaChartBar}
            isReportsRoute={isReportsSection}
          >
            Reports
          </NavItem>
          <NavItem to="/users" icon={FaUsers}>
            User Management
          </NavItem>
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="mt-auto p-6">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 ${
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            <FaCog className="h-4 w-4 shrink-0 text-current" />
            <span>Settings</span>
          </NavLink>
          <NavLink
            to="/logout"
            className={({ isActive }) =>
              `mt-2 flex items-center gap-3 rounded-md px-3 py-2 ${
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
      </div>
    </aside>
  );
}

export default SideBar;

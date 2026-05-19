import React from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";

function SideBar() {
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
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive
                  ? "bg-blue-700 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive
                  ? "bg-blue-700 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            Inventory
          </NavLink>
          <NavLink
            to="/stock"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive
                  ? "bg-blue-700 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            Stock Movement
          </NavLink>
          <NavLink
            to="/requests"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive
                  ? "bg-blue-700 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            Requests
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive
                  ? "bg-blue-700 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            Reports
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md ${
                isActive
                  ? "bg-blue-700 text-white"
                  : "text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            User Management
          </NavLink>
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="mt-auto p-6">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md ${isActive ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`
            }
          >
            Settings
          </NavLink>
          <NavLink
            to="/logout"
            className={({ isActive }) =>
              `block mt-2 px-3 py-2 rounded-md ${isActive ? "bg-slate-800 text-white" : "text-slate-200 hover:bg-slate-800"}`
            }
          >
            Logout
          </NavLink>
        </div>
      </div>
    </aside>
  );
}

export default SideBar;

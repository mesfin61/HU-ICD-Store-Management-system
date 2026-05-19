import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiBell } from "react-icons/fi";

function HeaderBar() {
  return (
    <header className="h-20 px-6 w-full sticky top-0 z-40 bg-white border-b border-gray-200 flex items-center">
      <div className="flex-1 flex flex-col justify-center"></div>
      <div className="flex items-center gap-4 ml-6">
        <Link
          to="/notifications"
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          <FiBell className="text-lg" />
        </Link>
        <Link to="/profile" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">
            AU
          </div>
          <div className="hidden md:block text-sm text-gray-700">
            <div className="font-semibold">Admin User</div>
            <div className="text-xs text-gray-400">SYSTEM ADMINISTRATOR</div>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default HeaderBar;

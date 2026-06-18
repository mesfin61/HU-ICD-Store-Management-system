import React from "react";
import { Link, useLocation } from "react-router-dom";
import API_URL from "../../config/api";
import { FiBell } from "react-icons/fi";
import { useUser } from "../../context/AuthContext";

function HeaderBar() {
  const { user, loading } = useUser();
  return (
    <header className="h-16 px-6 w-full sticky top-0 z-40 bg-white border-b border-gray-200 flex items-center">
      <div className="flex-1 flex flex-col justify-center"></div>
      <div className="flex items-center gap-4 ml-6">
        <Link
          to="/notifications"
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          <FiBell className="text-lg" />
        </Link>
        {loading ? (
          <div className="w-9 h-9 rounded-full bg-gray-300 animate-pulse"></div>
        ) : (
          <Link to="/profile" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
              <img
                src={`${API_URL}/${user.profilePicture.replace(/^\/+/, "")}`}
                alt="profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden md:block text-sm text-gray-700">
              <div className="font-semibold">{user?.fullName}</div>
              <div className="text-xs text-gray-400 uppercase">
                {user?.role}
              </div>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}

export default HeaderBar;

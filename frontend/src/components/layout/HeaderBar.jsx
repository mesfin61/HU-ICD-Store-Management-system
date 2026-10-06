import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { useUser } from "../../context/AuthContext";
import { getUnreadNotificationCount } from "../../services/notificationService";

function HeaderBar() {
  const { user, loading } = useUser();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();

        if (mounted) {
          setUnreadCount(Number(count) || 0);
        }
      } catch (error) {
        console.error("[HeaderBar] load unread notifications:", error);
      }
    };

    loadUnreadCount();

    const intervalId = window.setInterval(loadUnreadCount, 30000);

    window.addEventListener("notifications-updated", loadUnreadCount);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("notifications-updated", loadUnreadCount);
    };
  }, []);

  return (
    <header className="h-16 px-6 w-full sticky top-0 z-40 bg-white border-b border-gray-200 flex items-center">
      <div className="flex-1 flex flex-col justify-center"></div>

      <div className="flex items-center gap-4 ml-6">
        <Link
          to="/notifications"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
          className="relative text-gray-600 hover:text-gray-900 text-sm"
        >
          <FiBell className="text-lg" />

          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        {loading ? (
          <div className="h-5 w-20 animate-pulse rounded bg-gray-300"></div>
        ) : user ? (
          <Link to="/profile" className="flex items-center">
            <div className="hidden md:block text-sm text-gray-700">
              <div className="font-semibold">{user.fullName}</div>

              <div className="text-xs text-gray-400 uppercase">{user.role}</div>
            </div>
          </Link>
        ) : null}
      </div>
    </header>
  );
}

export default HeaderBar;

import React, {
  useEffect,
  useState,
} from "react";

import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiTrash2,
  FiRefreshCw,
} from "react-icons/fi";

import PageTransition from "../animated_motion/PageTransition";

import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/notificationService";

function Notify() {
  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState("all");

  // =======================================================
  // LOAD NOTIFICATIONS
  // =======================================================

  const loadNotifications =
    async ({
      showLoading = true,
    } = {}) => {
      try {
        if (showLoading) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        setErrorMessage("");

        const unreadOnly =
          filter === "unread";

        const [
          notificationData,
          unread,
        ] = await Promise.all([
          getMyNotifications({
            limit: 100,
            offset: 0,
            unreadOnly,
          }),
          getUnreadNotificationCount(),
        ]);

        setNotifications(
          Array.isArray(
            notificationData,
          )
            ? notificationData
            : [],
        );

        setUnreadCount(
          Number(unread) || 0,
        );
      } catch (error) {
        console.error(
          "[Notify] load notifications:",
          error,
        );

        setErrorMessage(
          error.response?.data
            ?.message ||
            "Failed to load notifications.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  // =======================================================
  // REFRESH
  // =======================================================

  const handleRefresh =
    async () => {
      await loadNotifications({
        showLoading: false,
      });
    };

  // =======================================================
  // MARK ONE AS READ
  // =======================================================

  const handleMarkAsRead =
    async (notificationId) => {
      try {
        setErrorMessage("");

        await markNotificationAsRead(
          notificationId,
        );

        await loadNotifications({
          showLoading: false,
        });
      } catch (error) {
        console.error(
          "[Notify] mark as read:",
          error,
        );

        setErrorMessage(
          error.response?.data
            ?.message ||
            "Failed to mark notification as read.",
        );
      }
    };

  // =======================================================
  // MARK ALL AS READ
  // =======================================================

  const handleMarkAllAsRead =
    async () => {
      try {
        setErrorMessage("");

        await markAllNotificationsAsRead();

        await loadNotifications({
          showLoading: false,
        });
      } catch (error) {
        console.error(
          "[Notify] mark all as read:",
          error,
        );

        setErrorMessage(
          error.response?.data
            ?.message ||
            "Failed to mark notifications as read.",
        );
      }
    };

  // =======================================================
  // DELETE
  // =======================================================

  const handleDelete =
    async (notificationId) => {
      try {
        setErrorMessage("");

        await deleteNotification(
          notificationId,
        );

        await loadNotifications({
          showLoading: false,
        });
      } catch (error) {
        console.error(
          "[Notify] delete notification:",
          error,
        );

        setErrorMessage(
          error.response?.data
            ?.message ||
            "Failed to delete notification.",
        );
      }
    };

  // =======================================================
  // FORMAT DATE
  // =======================================================

  const formatDate =
    (value) => {
      if (!value) {
        return "—";
      }

      const date = new Date(
        value,
      );

      if (
        Number.isNaN(
          date.getTime(),
        )
      ) {
        return "—";
      }

      return date.toLocaleString();
    };

  // =======================================================
  // NOTIFICATION STYLE
  // =======================================================

  const getNotificationStyle =
    (title) => {
      const normalized =
        String(title || "")
          .toLowerCase();

      if (
        normalized.includes(
          "reject",
        )
      ) {
        return {
          icon:
            FiBell,
          container:
            "border-rose-200 bg-rose-50",
          iconContainer:
            "bg-rose-100 text-rose-700",
        };
      }

      if (
        normalized.includes(
          "approved",
        ) ||
        normalized.includes(
          "approval",
        )
      ) {
        return {
          icon:
            FiCheckCircle,
          container:
            "border-emerald-200 bg-emerald-50",
          iconContainer:
            "bg-emerald-100 text-emerald-700",
        };
      }

      if (
        normalized.includes(
          "issued",
        ) ||
        normalized.includes(
          "issuance",
        )
      ) {
        return {
          icon:
            FiBell,
          container:
            "border-indigo-200 bg-indigo-50",
          iconContainer:
            "bg-indigo-100 text-indigo-700",
        };
      }

      if (
        normalized.includes(
          "return",
        )
      ) {
        return {
          icon:
            FiRefreshCw,
          container:
            "border-purple-200 bg-purple-50",
          iconContainer:
            "bg-purple-100 text-purple-700",
        };
      }

      if (
        normalized.includes(
          "stock",
        )
      ) {
        return {
          icon:
            FiBell,
          container:
            "border-blue-200 bg-blue-50",
          iconContainer:
            "bg-blue-100 text-blue-700",
        };
      }

      return {
        icon:
          FiBell,
        container:
          "border-slate-200 bg-white",
        iconContainer:
          "bg-slate-100 text-slate-700",
      };
    };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-5">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                <FiBell className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-primary">
                  Notifications
                </h1>

                <p className="text-sm font-semibold text-slate-500">
                  Updates and alerts related to your account and system activity.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                isRefreshing
              }
              className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50 disabled:opacity-50"
            >
              <FiRefreshCw
                className={
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={
                  handleMarkAllAsRead
                }
                className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              >
                <FiCheck />

                Mark All as Read
              </button>
            )}

          </div>
        </div>

        {/* =================================================
            SUMMARY
            ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">
              Total Loaded
            </div>

            <div className="mt-1 text-2xl font-bold text-primary">
              {
                notifications.length
              }
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-blue-700">
              Unread
            </div>

            <div className="mt-1 text-2xl font-bold text-blue-800">
              {unreadCount}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-slate-500">
              Status
            </div>

            <div className="mt-1 font-semibold text-primary">
              {unreadCount > 0
                ? "Attention required"
                : "All caught up"}
            </div>
          </div>

        </div>

        {/* =================================================
            FILTER
            ================================================= */}

        <div className="flex flex-wrap gap-2 border-b pb-1">

          <button
            type="button"
            onClick={() =>
              setFilter("all")
            }
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              filter === "all"
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("unread")
            }
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              filter === "unread"
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Unread
          </button>

        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {/* =================================================
            LOADING
            ================================================= */}

        {isLoading ? (
          <div className="rounded-lg border bg-white p-10 text-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white p-12 text-center">

            <FiBell className="mx-auto h-10 w-10 text-slate-300" />

            <h2 className="mt-4 text-lg font-semibold text-primary">
              No notifications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filter === "unread"
                ? "You have no unread notifications."
                : "There are no notifications for your account yet."}
            </p>

          </div>
        ) : (
          <div className="space-y-3">

            {notifications.map(
              (notification) => {
                const style =
                  getNotificationStyle(
                    notification.title,
                  );

                const Icon =
                  style.icon;

                const isUnread =
                  !notification.is_read;

                return (
                  <div
                    key={
                      notification.id
                    }
                    className={`rounded-lg border p-4 shadow-sm transition ${style.container} ${
                      isUnread
                        ? "ring-1 ring-blue-100"
                        : ""
                    }`}
                  >

                    <div className="flex items-start gap-4">

                      {/* ICON */}

                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.iconContainer}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                          <div>
                            <div className="flex items-center gap-2">

                              <h2 className="font-semibold text-primary">
                                {
                                  notification.title
                                }
                              </h2>

                              {isUnread && (
                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                                  New
                                </span>
                              )}

                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                formatDate(
                                  notification.created_at,
                                )
                              }
                            </p>
                          </div>

                          <div className="flex shrink-0 gap-2">

                            {isUnread && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMarkAsRead(
                                    notification.id,
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                              >
                                <FiCheck />

                                Read
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  notification.id,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                              title="Delete notification"
                            >
                              <FiTrash2 />
                            </button>

                          </div>

                        </div>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {
                            notification.message
                          }
                        </p>

                      </div>

                    </div>

                  </div>
                );
              },
            )}

          </div>
        )}

      </div>
    </PageTransition>
  );
}

export default Notify;
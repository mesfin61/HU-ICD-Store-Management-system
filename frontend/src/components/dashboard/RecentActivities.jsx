import React, { useEffect, useState } from "react";

import {
  FaBell,
  FaClipboardCheck,
  FaClipboardList,
  FaHistory,
  FaBoxOpen,
} from "react-icons/fa";

import apiClient from "../../services/apiClient";

import { Link } from "react-router-dom";

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
// FORMAT DATE
// =========================================================

function formatActivityDate(value) {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =========================================================
// STATUS STYLE
// =========================================================

function getStatusClasses(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();

  switch (normalized) {
    case "SUCCESS":
    case "APPROVED":
    case "FULFILLED":
    case "READ":
      return "bg-emerald-100 text-emerald-800";

    case "PENDING":
      return "bg-amber-100 text-amber-800";

    case "REJECTED":
      return "bg-rose-100 text-rose-800";

    case "PARTIALLY_APPROVED":
      return "bg-blue-100 text-blue-800";

    case "ISSUED":
    case "INVENTORY_ISSUED":
      return "bg-indigo-100 text-indigo-800";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

// =========================================================
// ACTIVITY ICON
// =========================================================

function ActivityIcon({ type }) {
  const normalized = String(type || "")
    .trim()
    .toUpperCase();

  if (normalized.includes("REQUEST")) {
    return <FaClipboardList className="h-4 w-4" />;
  }

  if (normalized.includes("ISSUE")) {
    return <FaClipboardCheck className="h-4 w-4" />;
  }

  if (normalized.includes("INVENTORY")) {
    return <FaBoxOpen className="h-4 w-4" />;
  }

  if (normalized.includes("NOTIFICATION")) {
    return <FaBell className="h-4 w-4" />;
  }

  return <FaHistory className="h-4 w-4" />;
}

// =========================================================
// BUILD ADMIN ACTIVITIES
// =========================================================

async function loadAdministratorActivities() {
  const response = await apiClient.get("/api/audit-logs", {
    params: {
      limit: 6,
      offset: 0,
    },
  });

  const logs = Array.isArray(response.data?.data) ? response.data.data : [];

  return logs.map((log) => ({
    id: `audit-${log.id}`,
    type: "AUDIT",
    activity: log.action || "System activity",
    subject: log.entity_name || "System",
    performedBy: log.user_name || log.user_email || "System",
    date: log.created_at,
    status: "SUCCESS",
  }));
}

// =========================================================
// BUILD STORE MANAGER ACTIVITIES
// =========================================================

async function loadStoreManagerActivities() {
  const [issuanceResponse, notificationResponse] = await Promise.all([
    apiClient.get("/api/issuance/outstanding"),

    apiClient.get("/api/notifications", {
      params: {
        limit: 6,
        offset: 0,
        unreadOnly: false,
      },
    }),
  ]);

  const issuances = Array.isArray(issuanceResponse.data?.data)
    ? issuanceResponse.data.data
    : [];

  const notifications = Array.isArray(notificationResponse.data?.data)
    ? notificationResponse.data.data
    : [];

  // -------------------------------------------------------
  // Outstanding issuance activity
  // -------------------------------------------------------

  const issuanceActivities = issuances.map((item) => ({
    id: `issuance-${item.id}`,
    type: "INVENTORY_ISSUED",
    activity: "Inventory currently issued",
    subject: `${item.item_name || "Inventory item"} — ${item.quantity_remaining ?? item.quantity_issued ?? 0} ${item.unit || "units"} remaining`,
    performedBy: item.issued_to_name || "User",
    date: item.issued_date,
    status:
      item.due_date && new Date(item.due_date) < new Date()
        ? "OVERDUE"
        : "ISSUED",
  }));

  // -------------------------------------------------------
  // Notification activity
  // -------------------------------------------------------

  const notificationActivities = notifications.map((item) => ({
    id: `notification-${item.id}`,
    type: "NOTIFICATION",
    activity: item.title || "Notification",
    subject: item.message || "",
    performedBy: "System",
    date: item.created_at,
    status: item.is_read ? "READ" : "NEW",
  }));

  return [...issuanceActivities, ...notificationActivities];
}

// =========================================================
// BUILD STAFF ACTIVITIES
// =========================================================

async function loadStaffActivities() {
  const [requestsResponse, issuanceResponse, notificationResponse] =
    await Promise.all([
      apiClient.get("/api/requests/mine"),

      apiClient.get("/api/issuance/my-outstanding"),

      apiClient.get("/api/notifications", {
        params: {
          limit: 6,
          offset: 0,
          unreadOnly: false,
        },
      }),
    ]);

  const requests = Array.isArray(requestsResponse.data?.data)
    ? requestsResponse.data.data
    : [];

  const issuances = Array.isArray(issuanceResponse.data?.data)
    ? issuanceResponse.data.data
    : [];

  const notifications = Array.isArray(notificationResponse.data?.data)
    ? notificationResponse.data.data
    : [];

  // -------------------------------------------------------
  // Request activity
  // -------------------------------------------------------

  const requestActivities = requests.map((request) => ({
    id: `request-${request.id}`,
    type: "REQUEST",
    activity: `Request ${String(request.status || "").toLowerCase()}`,
    subject: request.purpose || "Inventory request",
    performedBy: "You",
    date: request.approved_at || request.requested_at,
    status: request.status || "PENDING",
  }));

  // -------------------------------------------------------
  // Issuance activity
  // -------------------------------------------------------

  const issuanceActivities = issuances.map((item) => ({
    id: `issuance-${item.id}`,
    type: "INVENTORY_ISSUED",
    activity: "Inventory issued",
    subject: `${item.item_name || "Inventory item"} — ${item.quantity_remaining ?? item.quantity_issued ?? 0} ${item.unit || "units"} remaining`,
    performedBy: item.issued_by_name || "Store Manager",
    date: item.issued_date,
    status:
      item.due_date && new Date(item.due_date) < new Date()
        ? "OVERDUE"
        : "ISSUED",
  }));

  // -------------------------------------------------------
  // Notification activity
  // -------------------------------------------------------

  const notificationActivities = notifications.map((item) => ({
    id: `notification-${item.id}`,
    type: "NOTIFICATION",
    activity: item.title || "Notification",
    subject: item.message || "",
    performedBy: "System",
    date: item.created_at,
    status: item.is_read ? "READ" : "NEW",
  }));

  return [
    ...requestActivities,
    ...issuanceActivities,
    ...notificationActivities,
  ];
}

// =========================================================
// COMPONENT
// =========================================================

function RecentActivities() {
  const [activities, setActivities] = useState([]);

  const [role, setRole] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =======================================================
  // LOAD DATA
  // =======================================================

  useEffect(() => {
    let mounted = true;

    async function loadActivities() {
      try {
        setLoading(true);
        setError("");

        const meResponse = await apiClient.get("/api/auth/me");

        const currentRole = meResponse.data?.user?.role || null;

        const effectiveRole =
          currentRole === ROLES.SUPER_ADMIN ? ROLES.ADMINISTRATOR : currentRole;

        if (!currentRole) {
          throw new Error("Unable to determine the current user role.");
        }

        let loadedActivities = [];

        if (effectiveRole === ROLES.ADMINISTRATOR) {
          loadedActivities = await loadAdministratorActivities();
        } else if (effectiveRole === ROLES.STORE_MANAGER) {
          loadedActivities = await loadStoreManagerActivities();
        } else if (effectiveRole === ROLES.STAFF) {
          loadedActivities = await loadStaffActivities();
        } else {
          throw new Error("Your account role is not recognized by the system.");
        }

        // ---------------------------------------------------
        // Sort newest first.
        //
        // Only records actually returned by the backend are
        // included.
        // ---------------------------------------------------

        const sortedActivities = loadedActivities
          .filter((activity) => activity.date)
          .sort((left, right) => new Date(right.date) - new Date(left.date))
          .slice(0, 6);

        if (mounted) {
          setRole(effectiveRole);

          setActivities(sortedActivities);
        }
      } catch (loadError) {
        console.error(
          "[RecentActivities] Failed to load activities:",
          loadError,
        );

        if (mounted) {
          setError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Failed to load recent activity.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      mounted = false;
    };
  }, []);

  // =======================================================
  // TITLE
  // =======================================================

  const title =
    role === ROLES.ADMINISTRATOR
      ? "Recent System Activity"
      : role === ROLES.STORE_MANAGER
        ? "Recent Store Activity"
        : "My Recent Activity";

  const viewAllPath =
    role === ROLES.ADMINISTRATOR
      ? "/audit-logs"
      : role === ROLES.STAFF
        ? "/requests"
        : "/issued-inventory";

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <section className="mb-2 rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* =================================================
          HEADER
          ================================================= */}

      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-primary">{title}</h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Activity retrieved from the current system state.
          </p>
        </div>

        {!loading && !error && activities.length > 0 && (
          <Link
            to={viewAllPath}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="px-4 py-4">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* =================================================
          LOADING
          ================================================= */}

      {loading && (
        <div className="space-y-3 p-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-md border border-slate-100 p-3"
            >
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />

              <div className="min-w-0 flex-1">
                <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =================================================
          EMPTY
          ================================================= */}

      {!loading && !error && activities.length === 0 && (
        <div className="px-4 py-10 text-center">
          <FaHistory className="mx-auto h-8 w-8 text-slate-300" />

          <h3 className="mt-3 text-sm font-semibold text-primary">
            No recent activity
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            There is no activity to display yet.
          </p>
        </div>
      )}

      {/* =================================================
          DESKTOP
          ================================================= */}

      {!loading && !error && activities.length > 0 && (
        <div className="p-4">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] table-auto text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Activity
                  </th>

                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Details
                  </th>

                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Performed By
                  </th>

                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="p-3 align-top">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <ActivityIcon type={activity.type} />
                        </span>

                        <span className="font-semibold text-primary">
                          {activity.activity}
                        </span>
                      </div>
                    </td>

                    <td className="max-w-[320px] p-3 align-top text-slate-700">
                      <div className="line-clamp-2">{activity.subject}</div>
                    </td>

                    <td className="p-3 align-top text-slate-600">
                      {activity.performedBy}
                    </td>

                    <td className="whitespace-nowrap p-3 align-top text-slate-600">
                      {formatActivityDate(activity.date)}
                    </td>

                    <td className="p-3 align-top">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusClasses(
                          activity.status,
                        )}`}
                      >
                        {String(activity.status || "")
                          .replaceAll("_", " ")
                          .toLowerCase()
                          .replace(/^\w/, (letter) => letter.toUpperCase())}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* =================================================
                MOBILE
                ================================================= */}

          <div className="grid gap-3 md:hidden">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                    <ActivityIcon type={activity.type} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-primary">
                        {activity.activity}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${getStatusClasses(
                          activity.status,
                        )}`}
                      >
                        {String(activity.status || "")
                          .replaceAll("_", " ")
                          .toLowerCase()
                          .replace(/^\w/, (letter) => letter.toUpperCase())}
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {activity.subject}
                    </p>

                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <div>
                        <span className="font-semibold">By:</span>{" "}
                        {activity.performedBy}
                      </div>

                      <div>
                        <span className="font-semibold">Date:</span>{" "}
                        {formatActivityDate(activity.date)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default RecentActivities;

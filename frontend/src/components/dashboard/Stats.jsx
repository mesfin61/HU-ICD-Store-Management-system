import React, { useEffect, useState } from "react";

import {
  FaBoxOpen,
  FaClipboardList,
  FaUsers,
  FaExclamationTriangle,
  FaClipboardCheck,
  FaBoxes,
  FaClock,
  FaBan,
  FaCheckCircle,
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
// INITIAL STATE
// =========================================================

const INITIAL_STATS = {
  inventoryItems: 0,
  availableStock: 0,
  lowStockItems: 0,

  totalRequests: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  partiallyApprovedRequests: 0,
  rejectedRequests: 0,
  fulfilledRequests: 0,

  issuedItems: 0,
  outstandingReturns: 0,

  users: 0,
  unreadNotifications: 0,
};

// =========================================================
// HELPERS
// =========================================================

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toUpperCase();
}

function isOverdue(item) {
  if (!item?.due_date) {
    return false;
  }

  const dueDate = new Date(item.due_date);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return dueDate < new Date();
}

// =========================================================
// DASHBOARD STATS
// =========================================================

function Stats() {
  const [user, setUser] = useState(null);

  const [stats, setStats] = useState(INITIAL_STATS);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboardStats() {
      try {
        setLoading(true);
        setError("");

        // ===================================================
        // CURRENT USER
        // ===================================================

        const meResponse = await apiClient.get("/api/auth/me");

        const currentUser = meResponse.data?.user || null;

        if (!currentUser) {
          throw new Error("Unable to determine the current user.");
        }

        const role =
          currentUser.role === ROLES.SUPER_ADMIN
            ? ROLES.ADMINISTRATOR
            : currentUser.role || null;

        if (mounted) {
          setUser(currentUser);
        }

        // ===================================================
        // INVENTORY
        //
        // All authenticated roles may read inventory.
        // ===================================================

        const inventoryResponse = await apiClient.get("/api/inventory");

        const inventory = Array.isArray(inventoryResponse.data?.data)
          ? inventoryResponse.data.data
          : [];

        const inventoryItems = inventory.length;

        const availableStock = inventory.reduce((total, item) => {
          const currentStock = Number(item.current_stock) || 0;

          return total + currentStock;
        }, 0);

        const lowStockItems = inventory.filter((item) => {
          const currentStock = Number(item.current_stock) || 0;

          const minimumStock = Number(item.minimum_stock) || 0;

          return currentStock <= minimumStock;
        }).length;

        // ===================================================
        // REQUESTS
        //
        // Administrator:
        //   /api/requests
        //
        // Store Manager:
        //   /api/requests/for-issuance
        //
        // Staff:
        //   /api/requests/mine
        // ===================================================

        let requests = [];

        if (role === ROLES.ADMINISTRATOR) {
          const response = await apiClient.get("/api/requests");

          requests = Array.isArray(response.data?.data)
            ? response.data.data
            : [];
        }

        if (role === ROLES.STORE_MANAGER) {
          const response = await apiClient.get("/api/requests/for-issuance");

          requests = Array.isArray(response.data?.data)
            ? response.data.data
            : [];
        }

        if (role === ROLES.STAFF) {
          const response = await apiClient.get("/api/requests/mine");

          requests = Array.isArray(response.data?.data)
            ? response.data.data
            : [];
        }

        const totalRequests = requests.length;

        const pendingRequests = requests.filter(
          (request) => normalizeStatus(request.status) === "PENDING",
        ).length;

        const approvedRequests = requests.filter(
          (request) => normalizeStatus(request.status) === "APPROVED",
        ).length;

        const partiallyApprovedRequests = requests.filter(
          (request) => normalizeStatus(request.status) === "PARTIALLY_APPROVED",
        ).length;

        const rejectedRequests = requests.filter(
          (request) => normalizeStatus(request.status) === "REJECTED",
        ).length;

        const fulfilledRequests = requests.filter(
          (request) => normalizeStatus(request.status) === "FULFILLED",
        ).length;

        // ===================================================
        // ISSUED INVENTORY
        //
        // Store Manager:
        //   all outstanding issued items
        //
        // Staff:
        //   only the authenticated user's outstanding items
        //
        // Administrator:
        //   no issued-inventory management endpoint is
        //   currently exposed, so don't manufacture a number.
        // ===================================================

        let issuedItems = [];

        if (role === ROLES.STORE_MANAGER) {
          const response = await apiClient.get("/api/issuance/outstanding");

          issuedItems = Array.isArray(response.data?.data)
            ? response.data.data
            : [];
        }

        if (role === ROLES.STAFF) {
          const response = await apiClient.get("/api/issuance/my-outstanding");

          issuedItems = Array.isArray(response.data?.data)
            ? response.data.data
            : [];
        }

        const issuedCount = issuedItems.length;

        const outstandingReturns = issuedItems.filter(isOverdue).length;

        // ===================================================
        // USERS
        //
        // Administrator only.
        // ===================================================

        let users = 0;

        if (role === ROLES.ADMINISTRATOR) {
          const response = await apiClient.get("/api/users");

          const systemUsers = Array.isArray(response.data?.data)
            ? response.data.data
            : [];

          users = systemUsers.length;
        }

        // ===================================================
        // NOTIFICATIONS
        //
        // Every authenticated user may see their unread count.
        // ===================================================

        const notificationResponse = await apiClient.get(
          "/api/notifications/unread-count",
        );

        const unreadNotifications =
          Number(notificationResponse.data?.data?.count) || 0;

        // ===================================================
        // UPDATE STATE
        // ===================================================

        if (mounted) {
          setStats({
            inventoryItems,
            availableStock,
            lowStockItems,

            totalRequests,
            pendingRequests,
            approvedRequests,
            partiallyApprovedRequests,
            rejectedRequests,
            fulfilledRequests,

            issuedItems: issuedCount,

            outstandingReturns,

            users,

            unreadNotifications,
          });
        }
      } catch (loadError) {
        console.error("[Dashboard] Failed to load statistics:", loadError);

        if (mounted) {
          setError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Failed to load dashboard data.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardStats();

    return () => {
      mounted = false;
    };
  }, []);

  const role =
    user?.role === ROLES.SUPER_ADMIN ? ROLES.ADMINISTRATOR : user?.role || null;

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            Loading current system information...
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-lg border bg-white"
            />
          ))}
        </div>
      </section>
    );
  }

  // =======================================================
  // ERROR
  // =======================================================

  if (error) {
    return (
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            Unable to load current dashboard information.
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      </section>
    );
  }

  // =======================================================
  // ADMINISTRATOR DASHBOARD
  // =======================================================

  if (role === ROLES.ADMINISTRATOR) {
    return (
      <section className="space-y-5">
        <DashboardHeading
          title="System Dashboard"
          description="Current system, inventory, request, and account overview."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="System Users" value={stats.users} icon={FaUsers} />

          <StatCard
            title="Inventory Items"
            value={stats.inventoryItems}
            icon={FaBoxOpen}
          />

          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={FaClock}
            warning={stats.pendingRequests > 0}
          />

          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={FaExclamationTriangle}
            warning={stats.lowStockItems > 0}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard
            title="Total Requests"
            value={stats.totalRequests}
            icon={FaClipboardList}
          />

          <InfoCard
            title="Fulfilled Requests"
            value={stats.fulfilledRequests}
            icon={FaCheckCircle}
          />

          <InfoCard
            title="Rejected Requests"
            value={stats.rejectedRequests}
            icon={FaBan}
          />
        </div>
      </section>
    );
  }

  // =======================================================
  // STORE MANAGER DASHBOARD
  // =======================================================

  if (role === ROLES.STORE_MANAGER) {
    return (
      <section className="space-y-5">
        <DashboardHeading
          title="Store Dashboard"
          description="Current inventory and store operations overview."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Inventory Items"
            value={stats.inventoryItems}
            icon={FaBoxOpen}
          />

          <StatCard
            title="Available Stock"
            value={stats.availableStock}
            icon={FaBoxes}
          />

          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={FaExclamationTriangle}
            warning={stats.lowStockItems > 0}
          />

          <StatCard
            title="Ready for Issuance"
            value={stats.totalRequests}
            icon={FaClipboardCheck}
            warning={stats.totalRequests > 0}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoCard
            title="Outstanding Issuances"
            value={stats.issuedItems}
            icon={FaClipboardCheck}
            description="Issued inventory that has not been fully returned."
          />

          <InfoCard
            title="Overdue Returns"
            value={stats.outstandingReturns}
            icon={FaExclamationTriangle}
            warning={stats.outstandingReturns > 0}
            description="Outstanding issued items past their due date."
          />
        </div>
      </section>
    );
  }

  // =======================================================
  // STAFF DASHBOARD
  // =======================================================

  if (role === ROLES.STAFF) {
    return (
      <section className="space-y-5">
        <DashboardHeading
          title="My Dashboard"
          description="Your requests, issued inventory, notifications, and account activity."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="My Requests"
            value={stats.totalRequests}
            icon={FaClipboardList}
          />

          <StatCard
            title="Pending Requests"
            value={stats.pendingRequests}
            icon={FaClock}
            warning={stats.pendingRequests > 0}
          />

          <StatCard
            title="Issued Items"
            value={stats.issuedItems}
            icon={FaClipboardCheck}
          />

          <StatCard
            title="Unread Notifications"
            value={stats.unreadNotifications}
            icon={FaExclamationTriangle}
            warning={stats.unreadNotifications > 0}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard
            title="Approved Requests"
            value={stats.approvedRequests}
            icon={FaCheckCircle}
          />

          <InfoCard
            title="Partially Approved"
            value={stats.partiallyApprovedRequests}
            icon={FaClipboardCheck}
          />

          <InfoCard
            title="Rejected Requests"
            value={stats.rejectedRequests}
            icon={FaBan}
          />
        </div>

        <InfoCard
          title="Overdue Returns"
          value={stats.outstandingReturns}
          icon={FaExclamationTriangle}
          warning={stats.outstandingReturns > 0}
          description="Your issued inventory that has passed its due date."
        />
      </section>
    );
  }

  // =======================================================
  // UNKNOWN ROLE
  //
  // Never fabricate dashboard information for an unknown
  // authorization state.
  // =======================================================

  return (
    <section className="space-y-5">
      <DashboardHeading
        title="Dashboard"
        description="Your account role could not be determined."
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-800">
        Your account does not have a recognized application role. Contact an
        Administrator.
      </div>
    </section>
  );
}

// =========================================================
// DASHBOARD HEADING
// =========================================================

function DashboardHeading({ title, description }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">{title}</h1>

      <p className="mt-1 text-sm font-semibold text-slate-500">{description}</p>
    </div>
  );
}

// =========================================================
// STAT CARD
// =========================================================

function StatCard({ title, value, icon: Icon, warning = false }) {
  return (
    <div className="flex min-h-[112px] items-center justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>

        <p
          className={`mt-2 text-3xl font-bold ${
            warning ? "text-red-600" : "text-primary"
          }`}
        >
          {value}
        </p>
      </div>

      <div
        className={`ml-4 shrink-0 rounded-lg p-3 ${
          warning ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

// =========================================================
// INFO CARD
// =========================================================

function InfoCard({ title, value, icon: Icon, description, warning = false }) {
  return (
    <div
      className={`rounded-lg border bg-white p-5 shadow-sm ${
        warning ? "border-red-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p
            className={`mt-2 text-3xl font-bold ${
              warning ? "text-red-600" : "text-primary"
            }`}
          >
            {value}
          </p>
        </div>

        {Icon && (
          <div
            className={`rounded-lg p-3 ${
              warning ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {description && (
        <p className="mt-3 text-sm leading-5 text-slate-500">{description}</p>
      )}
    </div>
  );
}

export default Stats;

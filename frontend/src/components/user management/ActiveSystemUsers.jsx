import React, { useEffect, useMemo, useState } from "react";
import {
  FaFilter,
  FaShieldAlt,
  FaUserShield,
  FaClipboardCheck,
  FaBoxes,
  FaChevronRight,
  FaSearch,
  FaSyncAlt,
  FaTimes,
} from "react-icons/fa";

import { getUsers, setUserActiveState } from "../../services/userService";
import { useUser } from "../../context/AuthContext";

/*
 * Role presentation only.
 *
 * IMPORTANT:
 * These definitions do NOT control authorization.
 * Authorization is enforced by the backend/database role.
 */
const roleDefinitions = [
  {
    title: "Super Admin",
    description:
      "Highest-level administrative access for system governance and security.",
    tone: "blue",
    Icon: FaShieldAlt,
    bullets: [
      "User management & access control",
      "System-wide configuration",
      "Security and administrative oversight",
    ],
  },
  {
    title: "admin",
    description: "Administrative access for managing standard system users.",
    tone: "green",
    Icon: FaUserShield,
    bullets: [
      "Manage standard users",
      "View operational information",
      "Administrative user oversight",
    ],
  },
  {
    title: "Store Manager",
    description:
      "Operational oversight for inventory and departmental activities.",
    tone: "green",
    Icon: FaBoxes,
    bullets: [
      "Approve item requests",
      "Manage stock levels",
      "Generate operational reports",
    ],
  },
  {
    title: "Store Officer",
    description:
      "Operational role for recording and validating stock activities.",
    tone: "orange",
    Icon: FaClipboardCheck,
    bullets: [
      "Record stock movements",
      "Validate inventory activities",
      "Perform physical inventory operations",
    ],
  },
];

function Pill({ children, role }) {
  const normalizedRole = String(role || "").toLowerCase();

  let toneClass = "border-slate-200 bg-slate-50 text-slate-600";

  if (normalizedRole === "super admin") {
    toneClass = "border-blue-200 bg-blue-50 text-blue-700";
  } else if (normalizedRole === "admin") {
    toneClass = "border-purple-200 bg-purple-50 text-purple-700";
  } else if (normalizedRole.includes("manager")) {
    toneClass = "border-emerald-200 bg-emerald-50 text-emerald-700";
  } else if (normalizedRole.includes("officer")) {
    toneClass = "border-orange-200 bg-orange-50 text-orange-700";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}
    >
      {children || "Unknown"}
    </span>
  );
}

function UserActions({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onRefresh,
  refreshing,
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative">
        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search users..."
          className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none transition focus:border-[#0b4a8b] focus:ring-1 focus:ring-[#0b4a8b] sm:w-48"
        />
      </div>

      <div className="relative">
        <FaFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-md border border-slate-200 bg-white py-2 pl-7 pr-7 text-xs outline-none transition focus:border-[#0b4a8b] focus:ring-1 focus:ring-[#0b4a8b]"
          aria-label="Filter users by status"
        >
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Refresh users"
        title="Refresh users"
      >
        <FaSyncAlt className={`text-xs ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}

function RoleDefinitionCard({ title, description, tone, Icon, bullets }) {
  const iconClass =
    tone === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : "bg-orange-50 text-orange-700 border-orange-100";

  const headingClass =
    tone === "blue"
      ? "text-blue-700"
      : tone === "green"
        ? "text-emerald-700"
        : "text-orange-700";

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-8 w-8 place-items-center rounded-md border ${iconClass}`}
          >
            <Icon className="text-[12px]" />
          </div>

          <div>
            <h4
              className={`text-[11px] font-bold uppercase tracking-wide ${headingClass}`}
            >
              {title}
            </h4>
          </div>
        </div>

        <span className="text-slate-400">
          <FaChevronRight className="text-[10px]" />
        </span>
      </div>

      <p className="mb-2 text-[11px] leading-5 text-slate-500">{description}</p>

      <ul className="space-y-1.5">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-2 text-[11px] text-slate-600"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DatabaseStatusMessage({ loading, error, usersCount, onRetry }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 border-b border-slate-200 px-5 py-6 text-sm text-slate-500">
        <FaSyncAlt className="animate-spin text-xs" />
        Loading users from the database...
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-b border-red-100 bg-red-50 px-5 py-5">
        <div className="text-sm font-semibold text-red-800">
          Failed to load users
        </div>

        <div className="mt-1 text-xs text-red-600">{error}</div>

        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (usersCount === 0) {
    return (
      <div className="border-b border-slate-200 px-5 py-8 text-center">
        <div className="text-sm font-semibold text-slate-700">
          No users found
        </div>

        <div className="mt-1 text-xs text-slate-500">
          There are currently no users matching the selected criteria.
        </div>
      </div>
    );
  }

  return null;
}

function ActiveSystemUsers({ refreshKey = 0 }) {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /*
   * PostgreSQL is the sole source of truth.
   *
   * Every time refreshKey changes, the list is
   * reloaded from GET /api/users.
   */
  async function loadUsers({ showLoading = true } = {}) {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const databaseUsers = await getUsers();

      setUsers(Array.isArray(databaseUsers) ? databaseUsers : []);
    } catch (loadError) {
      console.error("[ActiveSystemUsers] Failed to load users:", loadError);

      setError(
        loadError?.message || "Failed to retrieve users from the database.",
      );

      /*
       * Do not fall back to localStorage.
       *
       * If PostgreSQL cannot be reached, the correct
       * institutional behavior is to show the error,
       * not display stale or fabricated users.
       */
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [refreshKey]);

  const isSuperAdmin = currentUser?.role === "Super Admin";

  async function handleUserStatusChange() {
    if (!selectedUser) {
      return;
    }

    const active = !Boolean(selectedUser.is_active);
    const action = active ? "activate" : "deactivate";

    try {
      setUpdatingUserId(selectedUser.id);
      await setUserActiveState(selectedUser.id, active);
      setSelectedUser(null);
      await loadUsers({ showLoading: false });
    } catch (statusError) {
      setError(
        statusError.response?.data?.message ||
          `Failed to ${action} the user.`,
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  function openUserStatusModal(targetUser) {
    if (isSuperAdmin) {
      setSelectedUser(targetUser);
    }
  }

  /*
   * Client-side filtering is only presentation logic.
   *
   * The underlying users always come from PostgreSQL.
   */
  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const isActive = Boolean(user.is_active);

      if (statusFilter === "active" && !isActive) {
        return false;
      }

      if (statusFilter === "inactive" && isActive) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        user.full_name,
        user.email,
        user.department_name,
        user.role_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [users, search, statusFilter]);

  /*
   * Real statistics derived from the database
   * response.
   *
   * We deliberately do NOT calculate 2FA statistics
   * because the current users query does not provide
   * a 2FA field.
   */
  const summary = useMemo(() => {
    const totalUsers = users.length;

    const activeUsers = users.filter((user) => Boolean(user.is_active)).length;

    const inactiveUsers = totalUsers - activeUsers;

    const superAdminUsers = users.filter(
      (user) => String(user.role_name || "").toLowerCase() === "super admin",
    ).length;

    const adminUsers = users.filter(
      (user) => String(user.role_name || "").toLowerCase() === "admin",
    ).length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      superAdminUsers,
      adminUsers,
    };
  }, [users]);

  return (
    <section className="w-full">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2.1fr)_minmax(290px,0.9fr)]">
        {/* Users table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Active System Users
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Live data retrieved from the institutional database.
              </p>
            </div>

            <UserActions
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              onRefresh={() => loadUsers({ showLoading: false })}
              refreshing={refreshing}
            />
          </div>

          <DatabaseStatusMessage
            loading={loading}
            error={error}
            usersCount={filteredUsers.length}
            onRetry={() => loadUsers()}
          />

          {!loading && !error && filteredUsers.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[#f7f9ff] text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 sm:px-5">User Details</th>

                      <th className="px-4 py-3">Department</th>

                      <th className="px-4 py-3">Role</th>

                      <th className="px-4 py-3">Status</th>

                      <th className="px-4 py-3">Created</th>

                      {isSuperAdmin && <th className="px-4 py-3" />}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredUsers.map((user) => {
                      const displayName = user.full_name || "Unnamed User";

                      const displayEmail = user.email || "No email";

                      const displayDepartment =
                        user.department_name || "Unassigned";

                      const displayRole = user.role_name || "Unknown";

                      const active = Boolean(user.is_active);

                      const createdDate = user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "—";

                      return (
                        <tr
                          key={user.id}
                          onClick={() => openUserStatusModal(user)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openUserStatusModal(user);
                            }
                          }}
                          tabIndex={isSuperAdmin ? 0 : undefined}
                          className={`align-top text-sm text-slate-700 transition ${
                            isSuperAdmin
                              ? "cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                              : ""
                          } ${active ? "" : "bg-red-50 hover:bg-red-100"}`}
                        >
                          <td className="px-4 py-4 sm:px-5">
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900">
                                {displayName}
                              </div>

                              <div className="truncate text-xs text-slate-500">
                                {displayEmail}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            {displayDepartment}
                          </td>

                          <td className="px-4 py-4">
                            <Pill role={displayRole}>{displayRole}</Pill>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  active ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              />

                              <span
                                className={
                                  active ? "text-emerald-600" : "text-slate-500"
                                }
                              >
                                {active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-slate-500">
                            {createdDate}
                          </td>

                          {isSuperAdmin && (
                            <td className="px-4 py-4 text-right text-slate-400">
                              <FaChevronRight className="inline-block text-xs" />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p>
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredUsers.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {users.length}
                  </span>{" "}
                  users
                </p>
              </div>
            </>
          )}
        </div>

        {/* Right-side information */}
        <div className="flex flex-col gap-3">
          {/* Live database summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Live Database Summary
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Total Users</div>

                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {summary.totalUsers}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Active Users</div>

                <div className="mt-1 text-lg font-semibold text-emerald-600">
                  {summary.activeUsers}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Inactive Users</div>

                <div className="mt-1 text-lg font-semibold text-slate-600">
                  {summary.inactiveUsers}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Super Admins</div>

                <div className="mt-1 text-lg font-semibold text-blue-700">
                  {summary.superAdminUsers}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Admins</div>

                <div className="mt-1 text-lg font-semibold text-purple-700">
                  {summary.adminUsers}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {selectedUser && isSuperAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-status-modal-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="user-status-modal-title"
                  className="text-base font-semibold text-slate-900"
                >
                  {selectedUser.is_active ? "Deactivate user" : "Activate user"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Confirm the account status change for this user.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close user status dialog"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            <div
              className={`mt-5 rounded-lg border px-4 py-3 ${
                selectedUser.is_active
                  ? "border-red-200 bg-red-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <p className="font-semibold text-slate-900">
                {selectedUser.full_name || "Unnamed User"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedUser.email || "No email"}
              </p>
              <p
                className={`mt-2 text-xs font-semibold ${
                  selectedUser.is_active ? "text-red-700" : "text-emerald-700"
                }`}
              >
                Current status: {selectedUser.is_active ? "Active" : "Inactive"}
              </p>
            </div>

            {selectedUser.is_active && (
              <p className="mt-4 text-sm leading-5 text-red-700">
                This user will no longer be able to sign in until the account is
                activated again.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUserStatusChange}
                disabled={updatingUserId === selectedUser.id}
                className={`rounded-md px-3 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  selectedUser.is_active
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {updatingUserId === selectedUser.id
                  ? "Updating..."
                  : selectedUser.is_active
                    ? "Deactivate user"
                    : "Activate user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ActiveSystemUsers;

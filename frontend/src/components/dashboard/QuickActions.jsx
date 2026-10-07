import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/apiClient";

const ROLES = {
  ADMINISTRATOR: "Administrator",
  DIRECTORATE: "Directorate",
  STORE_MANAGER: "Store Manager",
  STAFF: "Staff",
};

function QuickActions() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;

    apiClient
      .get("/api/auth/me")
      .then((response) => {
        if (mounted) {
          const currentRole = response.data?.user?.role || null;
          setRole(
            currentRole,
          );
        }
      })
      .catch((error) => {
        console.error("[QuickActions] Failed to load user:", error);

        if (mounted) {
          setRole(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!role) {
    return null;
  }

  const actions = [];

  if (role === ROLES.STORE_MANAGER) {
    actions.push({
      label: "Stock Movement",
      to: "/stock",
    });

    actions.push({
      label: "Process Requests",
      to: "/requests",
    });

    actions.push({
      label: "Issued Inventory",
      to: "/issued-inventory",
    });
  }

  if (role === ROLES.ADMINISTRATOR) {
    actions.push({
      label: "User Management",
      to: "/users",
    });

    actions.push({
      label: "Audit Log",
      to: "/audit-logs",
    });

  }

  if (role === ROLES.DIRECTORATE) {
    actions.push({
      label: "Review Requests",
      to: "/requests",
    });

    actions.push({
      label: "Request Reports",
      to: "/reports",
    });
  }

  if (role === ROLES.STAFF) {
    actions.push({
      label: "New Request",
      to: "/requests/new-request",
    });

    actions.push({
      label: "My Requests",
      to: "/requests",
    });

    actions.push({
      label: "Messages",
      to: "/messages",
    });

    actions.push({
      label: "Notifications",
      to: "/notifications",
    });
  }

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-primary">Quick Actions</h2>

        <p className="text-sm text-slate-500">
          Common tasks available to your role.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="rounded-md border border-blue-800 px-4 py-3 text-center text-sm font-semibold text-blue-800 transition hover:bg-blue-800 hover:text-white"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default QuickActions;

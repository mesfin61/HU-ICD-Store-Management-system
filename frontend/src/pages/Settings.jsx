import React, { useEffect, useMemo, useState } from "react";
import PageTransition from "../animated_motion/PageTransition";
import apiClient from "../services/apiClient";

function getUserDisplayName(user) {
  return (
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.email ||
    "Current User"
  );
}

function getUserRole(user) {
  return (
    user?.role_name ||
    user?.role ||
    user?.roleName ||
    "Unknown Role"
  );
}

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSettingsData() {
      try {
        setLoading(true);
        setError("");

        const [userResponse, inventoryResponse] =
          await Promise.all([
            apiClient.get("/api/auth/me"),
            apiClient.get("/api/inventory"),
          ]);

        if (!mounted) return;

        const userData =
          userResponse.data?.data?.user ||
          userResponse.data?.data ||
          userResponse.data?.user ||
          userResponse.data;

        const inventoryData = Array.isArray(
          inventoryResponse.data?.data,
        )
          ? inventoryResponse.data.data
          : [];

        setCurrentUser(userData);
        setInventory(inventoryData);
      } catch (loadError) {
        console.error(
          "[Settings] Failed to load settings data:",
          loadError,
        );

        if (mounted) {
          setError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Failed to load settings data.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettingsData();

    return () => {
      mounted = false;
    };
  }, []);

  const inventorySummary = useMemo(() => {
    const totalItems = inventory.length;

    const lowStockItems = inventory.filter((item) => {
      const currentStock =
        Number(item.current_stock) || 0;

      const minimumStock =
        Number(item.minimum_stock) || 0;

      return (
        currentStock > 0 &&
        currentStock <= minimumStock
      );
    }).length;

    return {
      totalItems,
      lowStockItems,
    };
  }, [inventory]);

  const displayName =
    getUserDisplayName(currentUser);

  const role =
    getUserRole(currentUser);

  return (
    <PageTransition>
      <div className="flex flex-col gap-4 px-4 py-4">
        <div>
          <h2 className="mb-2 text-2xl font-semibold text-primary">
            Settings
          </h2>

          <p className="font-semibold text-secondary">
            Application settings and preferences for{" "}
            {displayName}.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Signed in as
            </div>

            <div className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "—" : role}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Current user
            </div>

            <div className="mt-2 break-words text-lg font-semibold text-slate-900">
              {loading ? "—" : displayName}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Inventory items
            </div>

            <div className="mt-2 text-lg font-semibold text-slate-900">
              {loading
                ? "—"
                : inventorySummary.totalItems}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Low stock alerts
            </div>

            <div className="mt-2 text-lg font-semibold text-slate-900">
              {loading
                ? "—"
                : inventorySummary.lowStockItems}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
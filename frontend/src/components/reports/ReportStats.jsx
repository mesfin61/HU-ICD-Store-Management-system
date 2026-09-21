import React, { useEffect, useMemo, useState } from "react";
import {
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExchangeAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import apiClient from "../../services/apiClient";

const iconMap = {
  money: FaMoneyBillWave,
  chart: FaChartLine,
  turnover: FaExchangeAlt,
  warning: FaExclamationTriangle,
};

function StatIcon({ type }) {
  const Icon = iconMap[type] ?? FaCheckCircle;

  return <Icon className="h-6 w-6 text-slate-700" aria-hidden="true" />;
}

function ReportStats() {
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadReportStats() {
      try {
        setLoading(true);
        setError("");

        const [inventoryResponse, requestsResponse, movementResponse] =
          await Promise.all([
            apiClient.get("/api/inventory"),
            apiClient.get("/api/requests"),
            apiClient.get("/api/inventory/transactions/trends"),
          ]);

        if (!mounted) return;

        const inventoryData = Array.isArray(inventoryResponse.data?.data)
          ? inventoryResponse.data.data
          : [];

        const requestData = Array.isArray(requestsResponse.data?.data)
          ? requestsResponse.data.data
          : [];

        const movementData = Array.isArray(movementResponse.data?.data)
          ? movementResponse.data.data
          : [];

        setInventory(inventoryData);
        setRequests(requestData);
        setMovements(movementData);
      } catch (loadError) {
        console.error(
          "[ReportStats] Failed to load report statistics:",
          loadError,
        );

        if (mounted) {
          setError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Failed to load report statistics.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReportStats();

    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalItems = inventory.length;

    const lowStockItems = inventory.filter((item) => {
      const currentStock = Number(item.current_stock) || 0;
      const minimumStock = Number(item.minimum_stock) || 0;

      return currentStock > 0 && currentStock <= minimumStock;
    }).length;

    const outOfStockItems = inventory.filter((item) => {
      const currentStock = Number(item.current_stock) || 0;
      return currentStock <= 0;
    }).length;

    const activeCategories = new Set(
      inventory
        .map((item) =>
          String(item.category_name || item.category || "Uncategorized").trim(),
        )
        .filter(Boolean),
    ).size;

    const pendingRequests = requests.filter(
      (request) => String(request.status || "").toUpperCase() === "PENDING",
    ).length;

    const approvedRequests = requests.filter((request) => {
      const status = String(request.status || "").toUpperCase();

      return status === "APPROVED" || status === "PARTIALLY_APPROVED";
    }).length;

    const totalInbound = movements.reduce(
      (total, movement) => total + (Number(movement.inbound) || 0),
      0,
    );

    const totalOutbound = movements.reduce(
      (total, movement) => total + (Number(movement.outbound) || 0),
      0,
    );

    const totalMovements = totalInbound + totalOutbound;

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      activeCategories,
      totalRequests: requests.length,
      pendingRequests,
      approvedRequests,
      totalMovements,
      totalInbound,
      totalOutbound,
    };
  }, [inventory, requests, movements]);

  const stats = [
    {
      id: 1,
      title: "TOTAL ITEMS TRACKED",
      value: loading ? "—" : summary.totalItems.toString(),
      percent: loading ? "" : `${summary.activeCategories} categories`,
      pctColor: "bg-green-100 text-green-700",
      subtitle: "Active inventory records",
      icon: "money",
    },
    {
      id: 2,
      title: "REQUEST PIPELINE",
      value: loading ? "—" : summary.totalRequests.toString(),
      percent: loading ? "" : `${summary.pendingRequests} pending`,
      pctColor: "bg-green-100 text-green-700",
      subtitle: "Requests recorded in the database",
      icon: "chart",
    },
    {
      id: 3,
      title: "30-DAY STOCK MOVEMENTS",
      value: loading ? "—" : summary.totalMovements.toString(),
      tag: loading
        ? ""
        : `${summary.totalInbound} in / ${summary.totalOutbound} out`,
      tagColor: "bg-gray-100 text-gray-700",
      subtitle: "Physical inventory transactions",
      icon: "turnover",
    },
    {
      id: 4,
      title: "LOW STOCK ITEMS",
      value: loading ? "—" : summary.lowStockItems.toString(),
      percent: loading ? "" : `${summary.outOfStockItems} out`,
      pctColor: "bg-red-100 text-red-700",
      subtitle: "Items requiring replenishment",
      icon: "warning",
    },
  ];

  return (
    <section className="w-full">
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="relative flex flex-col justify-between rounded-lg bg-white p-4 shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-gray-50 p-2">
                  <StatIcon type={stat.icon} />
                </div>
              </div>

              <div>
                {stat.percent && (
                  <div
                    className={`inline-flex items-center rounded px-2 py-1 text-sm font-medium ${stat.pctColor}`}
                  >
                    {stat.percent}
                  </div>
                )}

                {stat.tag && (
                  <div
                    className={`inline-flex items-center rounded px-2 py-1 text-sm font-medium ${stat.tagColor}`}
                  >
                    {stat.tag}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs tracking-widest text-gray-500">
                {stat.title}
              </div>

              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {stat.value}
              </div>

              <div className="mt-1 text-sm text-gray-400">{stat.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ReportStats;

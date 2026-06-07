import React from "react";
import {
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExchangeAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import {
  getInventorySummary,
  getStoredInventoryItems,
} from "../inventory/inventoryStorage";
import { getStoredRequestItems } from "../request/requestStorage";
import {
  getStockMovementSummary,
  getStoredStockMovements,
} from "../stock-management/stockMovementStorage";

const iconMap = {
  money: FaMoneyBillWave,
  chart: FaChartLine,
  turnover: FaExchangeAlt,
  warning: FaExclamationTriangle,
};

const StatIcon = ({ type }) => {
  const Icon = iconMap[type] ?? FaCheckCircle;

  return <Icon className="w-6 h-6 text-slate-700" aria-hidden="true" />;
};

function ReportStats() {
  const inventorySummary = getInventorySummary(getStoredInventoryItems());
  const requestSummary = getStoredRequestItems().reduce(
    (summary, request) => {
      summary.totalRequests += 1;
      summary.pendingRequests += request.status === "Pending" ? 1 : 0;
      summary.approvedRequests += request.status === "Approved" ? 1 : 0;
      return summary;
    },
    { totalRequests: 0, pendingRequests: 0, approvedRequests: 0 },
  );
  const movementSummary = getStockMovementSummary(getStoredStockMovements());

  const stats = [
    {
      id: 1,
      title: "TOTAL ITEMS TRACKED",
      value: inventorySummary.totalItems.toString(),
      percent: `${inventorySummary.activeCategories} categories`,
      pctColor: "bg-green-100 text-green-700",
      subtitle: "Inventory records currently stored",
      icon: "money",
    },
    {
      id: 2,
      title: "REQUEST PIPELINE",
      value: requestSummary.totalRequests.toString(),
      percent: `${requestSummary.pendingRequests} pending`,
      pctColor: "bg-green-100 text-green-700",
      subtitle: "Total requests captured in the system",
      icon: "chart",
    },
    {
      id: 3,
      title: "STOCK MOVEMENTS",
      value: movementSummary.totalMovements.toString(),
      tag: `${movementSummary.totalInbound} in / ${movementSummary.totalOutbound} out`,
      tagColor: "bg-gray-100 text-gray-700",
      subtitle: "Recorded stock transactions",
      icon: "turnover",
    },
    {
      id: 4,
      title: "LOW STOCK ITEMS",
      value: inventorySummary.lowStockItems.toString(),
      percent: `${inventorySummary.outStockItems} out`,
      pctColor: "bg-red-100 text-red-700",
      subtitle: "Items that require replenishment",
      icon: "warning",
    },
  ];

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.id}
            className="relative bg-white rounded-lg shadow p-4 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-md">
                  <StatIcon type={s.icon} />
                </div>
              </div>
              <div>
                {s.percent && (
                  <div
                    className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded ${s.pctColor}`}
                  >
                    {s.percent}
                  </div>
                )}
                {s.tag && (
                  <div
                    className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded ${s.tagColor}`}
                  >
                    {s.tag}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-500 tracking-widest">
                {s.title}
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-gray-400">{s.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ReportStats;

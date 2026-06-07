import React from "react";
import { Link } from "react-router-dom";
import { getStoredInventoryItems } from "../inventory/inventoryStorage";
import { getStoredRequestItems } from "../request/requestStorage";
import { getStoredStockMovements } from "../stock-management/stockMovementStorage";

function formatActivityDate(value) {
  if (!value) return "Recently";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildActivities() {
  const inventoryActivities = getStoredInventoryItems().map((item) => ({
    activity: "Inventory item added",
    category: item.category,
    performedBy: item.vendor || "Inventory team",
    date: item.createdAt,
    status:
      item.status === "Low Stock" || item.status === "Out of Stock"
        ? "warning"
        : "success",
  }));

  const requestActivities = getStoredRequestItems().map((request) => ({
    activity: `Request ${request.status.toLowerCase()}`,
    category: request.itemCategory,
    performedBy: request.requester,
    date: request.createdAt || request.date,
    status:
      request.status === "Approved"
        ? "approved"
        : request.status === "Pending"
          ? "pending"
          : "warning",
  }));

  const movementActivities = getStoredStockMovements().map((movement) => ({
    activity: movement.movementType,
    category: movement.category,
    performedBy: movement.source || "System",
    date: movement.createdAt || movement.date,
    status: movement.movementType === "Stock-In" ? "success" : "warning",
  }));

  return [...movementActivities, ...requestActivities, ...inventoryActivities]
    .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))
    .slice(0, 6)
    .map((entry) => ({
      ...entry,
      Date: formatActivityDate(entry.date),
    }));
}

function RecentActivities() {
  const activities = buildActivities();

  return (
    <div className="flex flex-col mb-2 bg-white shadow-lg rounded-lg gap-2">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center px-3 pt-3 gap-2">
        <h2 className="font-bold text-primary">Recent Activity</h2>
        <Link
          to="/reports"
          className="text-primary no-underline hover:underline font-bold"
        >
          View All Activities
        </Link>
      </div>
      <div className="p-3">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[640px] table-auto text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="text-left p-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left p-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performed By
                </th>
                <th className="text-left p-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left p-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity, index) => (
                <tr
                  key={index}
                  className="border-b even:bg-white hover:bg-gray-50"
                >
                  <td className="p-2 align-top">{activity.activity}</td>
                  <td className="p-2 align-top">{activity.category}</td>
                  <td className="p-2 align-top">{activity.performedBy}</td>
                  <td className="p-2 align-top">{activity.Date}</td>
                  <td className="p-2 align-top">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        activity.status === "success"
                          ? "bg-green-100 text-green-800"
                          : activity.status === "approved"
                            ? "bg-blue-100 text-blue-800"
                            : activity.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 md:hidden">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="rounded-lg border bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-primary">
                    {activity.activity}
                  </div>
                  <div className="text-sm text-slate-600 truncate">
                    {activity.category}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    activity.status === "success"
                      ? "bg-green-100 text-green-800"
                      : activity.status === "approved"
                        ? "bg-blue-100 text-blue-800"
                        : activity.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {activity.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-slate-700">
                <div>
                  <span className="font-medium">By:</span>{" "}
                  {activity.performedBy}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {activity.Date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RecentActivities;

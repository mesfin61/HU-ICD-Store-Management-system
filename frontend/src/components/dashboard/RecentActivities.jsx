import React from "react";
import { Link } from "react-router-dom";

const activities = [
  {
    activity: "New Stock Recieved",
    category: "Computing Device",
    performedBy: "Ahmed Mohammed",
    Date: "oct 24, 2025 - 09:15 AM",
    status: "success",
  },
  {
    activity: "Request Approved",
    category: "Pheripherals",
    performedBy: "Sara Ali",
    Date: "oct 23, 2025 - 02:30 PM",
    status: "approved",
  },
  {
    activity: "Stock Out of Stock",
    category: "Consumables",
    performedBy: "Mohammed Hassan",
    Date: "oct 22, 2025 - 11:45 AM",
    status: "warning",
  },
];

function RecentActivities() {
  return (
    <div className="flex flex-col mb-2 bg-white shadow-lg rounded-lg gap-2">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center px-3 pt-3 gap-2">
        <h2 className="font-bold text-primary">Recent Activity</h2>
        <Link className="text-primary no-underline hover:underline font-bold">
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

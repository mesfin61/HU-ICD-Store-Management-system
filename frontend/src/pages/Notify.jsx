import React from "react";
import { getStoredRequestItems } from "../components/request/requestStorage";
import { getStoredStockMovements } from "../components/stock-management/stockMovementStorage";
import PageTransition from "../animated_motion/PageTransition";

function Notify() {
  const pendingRequests = getStoredRequestItems().filter(
    (request) => request.status === "Pending",
  );
  const recentMovements = getStoredStockMovements().slice(0, 3);

  return (
    <PageTransition>
      <div className="flex flex-col gap-4 px-4 py-4">
        <div>
          <h1 className="text-xl font-bold text-primary">Notifications</h1>
          <p className="text-sm text-secondary font-semibold">
            Live system updates from requests and stock activity.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-sm border">
          <h2 className="mb-3 font-semibold text-primary">Pending Requests</h2>
          {pendingRequests.length > 0 ? (
            <ul className="space-y-3 text-sm text-slate-700">
              {pendingRequests.map((request) => (
                <li key={request.id} className="rounded-md bg-slate-50 p-3">
                  <div className="font-medium text-slate-900">
                    {request.requester} requested {request.item}
                  </div>
                  <div className="text-xs text-slate-500">
                    {request.department} • {request.priorityLevel}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No pending requests right now.
            </p>
          )}
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm border">
          <h2 className="mb-3 font-semibold text-primary">
            Recent Stock Activity
          </h2>
          {recentMovements.length > 0 ? (
            <ul className="space-y-3 text-sm text-slate-700">
              {recentMovements.map((movement) => (
                <li key={movement.id} className="rounded-md bg-slate-50 p-3">
                  <div className="font-medium text-slate-900">
                    {movement.movementType} - {movement.item}
                  </div>
                  <div className="text-xs text-slate-500">
                    {movement.quantity} units • {movement.date}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              No stock movements recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  </PageTransition>
  );
}

export default Notify;

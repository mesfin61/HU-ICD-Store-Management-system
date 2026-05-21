import React from "react";
import { Link } from "react-router-dom";

function RecentMovements({ movements }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-primary">
            Recent Movements
          </h3>
        </div>
        <span className="text-xs font-semibold px-2 py-1 text-primary">
          <Link className="text-blue-700 hover:underline" to="/movements">
            View All
          </Link>
        </span>
      </div>

      {movements.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 p-6 text-sm text-gray-500">
          No movements yet. Click Process Transaction to create the first
          record.
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[720px] table-auto text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-primary font-medium">
                  <th className="p-3">Movement</th>
                  <th className="p-3">Item</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="p-3 font-medium text-primary">
                      {movement.movementType}
                    </td>
                    <td className="p-3">{movement.item}</td>
                    <td className="p-3">{movement.quantity} Units</td>
                    <td className="p-3">{movement.source || "-"}</td>
                    <td className="p-3">{movement.reference || "-"}</td>
                    <td className="p-3">{movement.date || "-"}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                        {movement.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {movements.map((movement) => (
              <div
                key={movement.id}
                className="rounded-lg border bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-primary truncate">
                      {movement.movementType}
                    </div>
                    <div className="text-sm text-slate-600 truncate">
                      {movement.item}
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    {movement.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-slate-700">
                  <div>
                    <span className="font-medium">Qty:</span>{" "}
                    {movement.quantity} Units
                  </div>
                  <div>
                    <span className="font-medium">Source:</span>{" "}
                    {movement.source || "-"}
                  </div>
                  <div>
                    <span className="font-medium">Reference:</span>{" "}
                    {movement.reference || "-"}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>{" "}
                    {movement.date || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default RecentMovements;

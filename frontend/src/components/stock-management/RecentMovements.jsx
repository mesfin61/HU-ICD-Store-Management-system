import React from "react";
import { Link } from "react-router-dom";

function RecentMovements({ movements }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
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
        <div className="overflow-x-auto">
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
      )}
    </div>
  );
}

export default RecentMovements;

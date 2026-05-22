import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiFilter } from "react-icons/fi";
import {
  getStoredRequestItems,
  updateStoredRequestStatus,
} from "./requestStorage";

function RequestList() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    setRequests(getStoredRequestItems());
  }, []);

  const handleStatusUpdate = (requestId, status) => {
    const updatedRequests = updateStoredRequestStatus(requestId, status);
    setRequests(updatedRequests);
  };

  const statusStyle = (status) => {
    if (status === "Approved") {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }

    if (status === "Declined") {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }

    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  return (
    <div className="flex flex-col gap-4 md:p-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <span className="flex flex-col ">
          <h1 className="text-2xl font-bold text-primary">Pending Requests</h1>
          <p className="text-sm font-semibold text-primary">
            Manage incoming material and service requests from departments.
          </p>
        </span>

        <span className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-slate-100"
            title="Filter requests"
          >
            <FiFilter /> Filter
          </button>
          <Link
            to="/requests/new-request"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Request
          </Link>
        </span>
      </div>

      <div className="hidden overflow-x-auto md:block bg-white rounded border border-gray-500">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-secondary-container text-left text-xs tracking-wider text-primary font-medium">
              <th className="p-3">Request ID</th>
              <th className="p-3">Requester</th>
              <th className="p-3">Department</th>
              <th className="p-3">Item</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Supporting Document</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {requests.length > 0 ? (
              requests.map((request) => (
                <tr key={request.id}>
                  <td className="p-3 font-medium text-primary">
                    {request.requestId}
                  </td>
                  <td className="p-3">{request.requester}</td>
                  <td className="p-3">{request.department}</td>
                  <td className="p-3">{request.item}</td>
                  <td className="p-3">{request.quantity}</td>
                  <td className="p-3">
                    {request.supportingDocumentUrl ? (
                      <a
                        href={request.supportingDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                      >
                        {request.supportingDocumentName || "Open file"}
                      </a>
                    ) : (
                      request.supportingDocumentName || "No file uploaded"
                    )}
                  </td>
                  <td className="p-3">{request.date}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(request.status)}`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {request.status === "Pending" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusUpdate(request.id, "Approved")
                          }
                          className="rounded-md border border-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusUpdate(request.id, "Declined")
                          }
                          className="rounded-md border border-rose-600 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
                        Action completed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-3 text-center text-slate-500" colSpan={9}>
                  No requests submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RequestList;

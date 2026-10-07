import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiFilter } from "react-icons/fi";

import RequestApprovalModal from "./RequestApprovalModal";
import IssuanceModal from "./IssuanceModal";

import {
  getMyRequests,
  getAllRequests,
  getRequestsForIssuance,
} from "../../services/requestService";

import apiClient from "../../services/apiClient";

function RequestList() {
  const [filterOpen, setFilterOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [requests, setRequests] = useState([]);

  const [user, setUser] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const [approvalRequestId, setApprovalRequestId] = useState(null);

  const [issuanceRequestId, setIssuanceRequestId] = useState(null);

  // =========================================================
  // LOAD USER + REQUESTS
  // =========================================================

  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const meResponse = await apiClient.get("/api/auth/me");

      const currentUser = meResponse.data.user;

      setUser(currentUser);

      let data = [];

      if (
        currentUser.role === "Directorate"
      ) {
        data = await getAllRequests();
      } else if (currentUser.role === "Staff") {
        data = await getMyRequests();
      } else if (currentUser.role === "Store Manager") {
        data = await getRequestsForIssuance();
      }

      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[Request] load requests:", error);

      setErrorMessage(
        error.response?.data?.message || "Failed to load requests.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // ROLE FLAGS
  // =========================================================

  const isAdministrator = user?.role === "Directorate";

  const isStaff = user?.role === "Staff";

  const isStoreManager = user?.role === "Store Manager";

  // =========================================================
  // STATUS STYLING
  // =========================================================

  const statusStyle = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";

      case "PARTIALLY_APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-200";

      case "FULFILLED":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";

      case "REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-200";

      case "PENDING":
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredRequests = requests.filter((request) => {
    const searchableText = [
      request.id,
      request.requester_name,
      request.department_name,
      request.purpose,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearchTerm || searchableText.includes(normalizedSearchTerm);

    const matchesStatus =
      statusFilter === "ALL" || request.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="flex flex-col gap-4 md:p-3">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <span className="flex flex-col">
          <h1 className="text-2xl font-bold text-primary">
            {isAdministrator
              ? "Request Management"
              : isStoreManager
                ? "Requests Ready for Issuance"
                : "My Requests"}
          </h1>

          <p className="text-sm font-semibold text-primary">
            {isAdministrator
              ? "Review and decide incoming inventory requests."
              : isStoreManager
                ? "View approved requests and process inventory issuance."
                : "Track the requests you have submitted."}
          </p>
        </span>

        <span className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <button
            type="button"
            onClick={() => setFilterOpen((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-slate-100"
          >
            <FiFilter />
            Filter
          </button>

          {isStaff && (
            <Link
              to="/requests/new-request"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              New Request
            </Link>
          )}
        </span>
      </div>

      {/* =====================================================
          FILTERS
          ===================================================== */}

      {filterOpen && (
        <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-primary">
            Search requests
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ID, requester, department, or purpose"
              className="rounded-md border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-primary">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-500"
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PARTIALLY_APPROVED">Partially approved</option>
              <option value="FULFILLED">Fulfilled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>

          {(searchTerm || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
              className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-slate-100"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* =====================================================
          ERROR
          ===================================================== */}

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {/* =====================================================
          REQUEST TABLE
          ===================================================== */}

      {isLoading ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-slate-500">
          Loading requests...
        </div>
      ) : (
        <div className="hidden overflow-x-auto rounded border border-gray-300 bg-white md:block">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-secondary-container text-left text-xs font-medium tracking-wider text-primary">
                <th className="p-3">Request ID</th>

                {(isAdministrator || isStoreManager) && (
                  <>
                    <th className="p-3">Requester</th>

                    <th className="p-3">Department</th>
                  </>
                )}

                <th className="p-3">Purpose</th>

                <th className="p-3">Requested Date</th>

                {isStoreManager && (
                  <th className="p-3">Approved Quantity</th>
                )}

                <th className="p-3">Status</th>

                {(isAdministrator || isStoreManager) && (
                  <th className="p-3">Actions</th>
                )}
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => {
                  const canReviewRequest =
                    isAdministrator && request.status === "PENDING";

                  return (
                  <tr
                    key={request.id}
                    onClick={
                      canReviewRequest
                        ? () => setApprovalRequestId(request.id)
                        : undefined
                    }
                    onKeyDown={
                      canReviewRequest
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setApprovalRequestId(request.id);
                            }
                          }
                        : undefined
                    }
                    tabIndex={canReviewRequest ? 0 : undefined}
                    className={`border-b last:border-b-0 ${
                      canReviewRequest
                        ? "cursor-pointer border-l-4 border-l-amber-400 bg-amber-50/70 hover:bg-amber-100/70 focus:bg-amber-100/70 focus:outline-none"
                        : "bg-white"
                    }`}
                  >
                    {/* REQUEST ID */}

                    <td className="p-3 font-medium text-primary">
                      {request.id}
                    </td>

                    {/* REQUESTER + DEPARTMENT */}

                    {(isAdministrator || isStoreManager) && (
                      <>
                        <td className="p-3">{request.requester_name}</td>

                        <td className="p-3">{request.department_name}</td>
                      </>
                    )}

                    {/* PURPOSE */}

                    <td className="max-w-xs p-3">{request.purpose}</td>

                    {/* DATE */}

                    <td className="p-3">
                      {request.requested_at
                        ? new Date(request.requested_at).toLocaleString()
                        : "—"}
                    </td>

                    {isStoreManager && (
                      <td className="p-3">
                        <span className="font-semibold text-primary">
                          {request.total_remaining_quantity} remaining
                        </span>
                        <span className="block text-xs text-slate-500">
                          of {request.total_approved_quantity} approved
                        </span>
                      </td>
                    )}

                    {/* STATUS */}

                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle(
                          request.status,
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    {(isAdministrator || isStoreManager) && (
                      <td className="p-3">
                        {/* =========================
                              ADMINISTRATOR ACTIONS
                              ========================= */}

                        {isAdministrator && request.status === "PENDING" ? (
                          <span className="inline-flex rounded-md border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            Action needed
                          </span>
                        ) : null}

                        {/* =========================
                              STORE MANAGER ACTIONS
                              ========================= */}

                        {isStoreManager &&
                        (request.status === "APPROVED" ||
                          request.status === "PARTIALLY_APPROVED") ? (
                          <button
                            type="button"
                            onClick={() => setIssuanceRequestId(request.id)}
                            className="rounded-md border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            Process Issuance
                          </button>
                        ) : null}

                        {/* =========================
                              NO ACTION
                              ========================= */}

                        {!(
                          (isAdministrator && request.status === "PENDING") ||
                          (isStoreManager &&
                            (request.status === "APPROVED" ||
                              request.status === "PARTIALLY_APPROVED"))
                        ) && (
                          <span className="text-xs font-medium text-slate-500">
                            No action
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="p-8 text-center text-slate-500"
                    colSpan={
                      isAdministrator ? 7 : isStoreManager ? 8 : 4
                    }
                  >
                    {requests.length > 0
                      ? "No requests match the selected filters."
                      : "No requests found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================
          APPROVAL MODAL
          ===================================================== */}

      {approvalRequestId && (
        <RequestApprovalModal
          requestId={approvalRequestId}
          onClose={() => setApprovalRequestId(null)}
          onSuccess={async () => {
            setApprovalRequestId(null);

            await loadData();
          }}
        />
      )}

      {/* =====================================================
          ISSUANCE MODAL
          ===================================================== */}

      {issuanceRequestId && (
        <IssuanceModal
          requestId={issuanceRequestId}
          onClose={() => setIssuanceRequestId(null)}
          onIssued={async () => {
            setIssuanceRequestId(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

export default RequestList;

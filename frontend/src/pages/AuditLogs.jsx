import React, { useEffect, useState } from "react";

import PageTransition from "../animated_motion/PageTransition";

import { getAuditLogs } from "../services/auditLogService";

function AuditLogs() {
  const [logs, setLogs] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const [actionFilter, setActionFilter] = useState("");

  const [entityFilter, setEntityFilter] = useState("");
  6;

  const [selectedLog, setSelectedLog] = useState(null);

  // =======================================================
  // LOAD AUDIT LOGS
  // =======================================================

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getAuditLogs({
        limit: 100,
        offset: 0,
        action: actionFilter,
        entityName: entityFilter,
      });

      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[AuditLogs] load:", error);

      setErrorMessage(
        error.response?.data?.message || "Failed to load audit logs.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, entityFilter]);

  // =======================================================
  // FORMATTERS
  // =======================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString();
  };

  const formatJson = (value) => {
    if (value === null || value === undefined) {
      return "None";
    }

    if (typeof value === "string") {
      return value;
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  // =======================================================
  // ACTION STYLE
  // =======================================================

  const actionStyle = (action) => {
    if (action?.includes("REJECT")) {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }

    if (action?.includes("APPROV")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }

    if (action?.includes("CREATED")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }

    if (action?.includes("ISSU")) {
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    }

    if (action?.includes("RETURN")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <PageTransition>
      <div className="flex min-w-0 max-w-full flex-col gap-6 px-4 py-4 md:px-6 md:py-5">
        {/* =================================================
            HEADER
            ================================================= */}

        <div>
          <h1 className="text-2xl font-bold text-primary">Audit Log</h1>

          <p className="mt-1 text-sm font-semibold text-primary">
            Review system activity and accountability records.
          </p>
        </div>

        {/* =================================================
            FILTERS
            ================================================= */}

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-primary">
                Action
              </label>

              <input
                type="text"
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                placeholder="e.g. REQUEST_CREATED"
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-primary outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-primary">
                Entity
              </label>

              <input
                type="text"
                value={entityFilter}
                onChange={(event) => setEntityFilter(event.target.value)}
                placeholder="e.g. requests"
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-primary outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setActionFilter("");
                  setEntityFilter("");
                }}
                className="w-full rounded-md border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-slate-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {/* =================================================
            TABLE
            ================================================= */}

        {isLoading ? (
          <div className="rounded-lg border bg-white p-10 text-center text-sm text-slate-500">
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-lg border bg-white p-10 text-center text-sm text-slate-500">
            No audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="bg-secondary-container text-left text-xs font-semibold uppercase tracking-wider text-primary">
                  <th className="p-3">Date</th>

                  <th className="p-3">User</th>

                  <th className="p-3">Action</th>

                  <th className="p-3">Entity</th>

                  <th className="p-3">Entity ID</th>

                  <th className="p-3">Details</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-primary">
                        {log.user_name || "System"}
                      </div>

                      {log.user_email && (
                        <div className="text-xs text-slate-500">
                          {log.user_email}
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${actionStyle(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3 font-medium text-primary">
                      {log.entity_name}
                    </td>

                    <td className="p-3 max-w-[260px] truncate font-mono text-xs text-slate-600">
                      {log.entity_id || "—"}
                    </td>

                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="rounded-md border border-blue-600 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* =================================================
            DETAILS MODAL
            ================================================= */}

        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">
              <div className="sticky top-0 flex items-start justify-between border-b bg-white px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    Audit Record
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedLog.action}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-md px-3 py-1 text-2xl text-slate-500 hover:bg-slate-100"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6 p-6">
                {/* META */}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      User
                    </div>

                    <div className="mt-1 font-semibold text-primary">
                      {selectedLog.user_name || "System"}
                    </div>

                    {selectedLog.user_email && (
                      <div className="text-sm text-slate-500">
                        {selectedLog.user_email}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Date
                    </div>

                    <div className="mt-1 font-semibold text-primary">
                      {formatDate(selectedLog.created_at)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Action
                    </div>

                    <div className="mt-1">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${actionStyle(
                          selectedLog.action,
                        )}`}
                      >
                        {selectedLog.action}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Entity
                    </div>

                    <div className="mt-1 font-semibold text-primary">
                      {selectedLog.entity_name}
                    </div>

                    <div className="font-mono text-xs text-slate-500">
                      {selectedLog.entity_id || "—"}
                    </div>
                  </div>
                </div>

                {/* OLD DATA */}

                <div>
                  <h3 className="mb-2 text-sm font-bold text-primary">
                    Previous State
                  </h3>

                  <pre className="overflow-x-auto rounded-lg border bg-slate-50 p-4 text-xs text-slate-700">
                    {formatJson(selectedLog.old_data)}
                  </pre>
                </div>

                {/* NEW DATA */}

                <div>
                  <h3 className="mb-2 text-sm font-bold text-primary">
                    New State
                  </h3>

                  <pre className="overflow-x-auto rounded-lg border bg-slate-50 p-4 text-xs text-slate-700">
                    {formatJson(selectedLog.new_data)}
                  </pre>
                </div>
              </div>

              <div className="border-t px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="rounded-md border border-primary px-6 py-2 text-sm font-semibold text-primary hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default AuditLogs;

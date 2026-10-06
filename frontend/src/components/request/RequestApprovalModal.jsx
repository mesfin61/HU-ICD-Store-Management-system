import React, { useEffect, useState } from "react";

import {
  approveRequest,
  getRequest,
  rejectRequest,
} from "../../services/requestService";

function RequestApprovalModal({ requestId, onClose, onSuccess }) {
  const [request, setRequest] = useState(null);

  const [approvalQuantities, setApprovalQuantities] = useState({});

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const handleReject = async () => {
    const reason = window.prompt(
      "Enter the reason for rejecting this request:",
    );

    if (typeof reason !== "string" || !reason.trim() || !request) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await rejectRequest(request.id, reason.trim());

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("[RequestApprovalModal] reject request:", error);

      setErrorMessage(
        error.response?.data?.message || "Failed to reject request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadRequest = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getRequest(requestId);

        if (!mounted) {
          return;
        }

        setRequest(data);

        const initialQuantities = {};

        for (const item of data.items || []) {
          initialQuantities[item.id] = Number(item.quantity_requested) || 0;
        }

        setApprovalQuantities(initialQuantities);
      } catch (error) {
        console.error("[RequestApprovalModal] load request:", error);

        if (mounted) {
          setErrorMessage(
            error.response?.data?.message || "Failed to load request details.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    if (requestId) {
      loadRequest();
    }

    return () => {
      mounted = false;
    };
  }, [requestId]);

  const handleQuantityChange = (requestItemId, value) => {
    setApprovalQuantities((current) => ({
      ...current,
      [requestItemId]: value === "" ? "" : Number(value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!request) {
      return;
    }

    setErrorMessage("");

    const approvedItems = [];

    for (const item of request.items || []) {
      const rawQuantity = approvalQuantities[item.id];

      const quantityApproved = rawQuantity === "" ? 0 : Number(rawQuantity);

      if (!Number.isInteger(quantityApproved) || quantityApproved < 0) {
        setErrorMessage(`Invalid approval quantity for ${item.item_name}.`);
        return;
      }

      const requestedQuantity = Number(item.quantity_requested);

      if (quantityApproved > requestedQuantity) {
        setErrorMessage(
          `Approved quantity for ${item.item_name} cannot exceed the requested quantity.`,
        );
        return;
      }

      approvedItems.push({
        requestItemId: item.id,
        quantityApproved,
      });
    }

    try {
      setIsSubmitting(true);

      await approveRequest(request.id, approvedItems);

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("[RequestApprovalModal] approve request:", error);

      setErrorMessage(
        error.response?.data?.message || "Failed to approve request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!requestId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary">Review Request</h2>

              {request && (
                <p className="mt-1 text-sm text-slate-600">
                  Request ID: {request.id}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md px-3 py-1 text-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading request details...
          </div>
        ) : errorMessage && !request ? (
          <div className="p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          </div>
        ) : request ? (
          <form onSubmit={handleSubmit} className="p-6">
            {errorMessage && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Requester
                </div>
                <div className="mt-1 font-semibold text-primary">
                  {request.requester_name}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Department
                </div>
                <div className="mt-1 font-semibold text-primary">
                  {request.department_name}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  Purpose
                </div>

                <div className="mt-1 rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
                  {request.purpose}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 text-lg font-bold text-primary">
                Requested Items
              </h3>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[650px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="p-3">Item</th>

                      <th className="p-3">Requested</th>

                      <th className="p-3">Previously Issued</th>

                      <th className="p-3">Approve</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(request.items || []).map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">
                          <div className="font-semibold text-primary">
                            {item.item_name}
                          </div>

                          <div className="text-xs text-slate-500">
                            {item.item_code}
                          </div>
                        </td>

                        <td className="p-3 font-semibold">
                          {item.quantity_requested} {item.unit}
                        </td>

                        <td className="p-3">
                          {Number(item.quantity_issued) || 0} {item.unit}
                        </td>

                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity_requested}
                            step="1"
                            value={approvalQuantities[item.id] ?? ""}
                            onChange={(event) =>
                              handleQuantityChange(item.id, event.target.value)
                            }
                            disabled={isSubmitting}
                            className="w-28 rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-primary outline-none focus:border-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting}
                className="rounded-md border border-rose-600 px-6 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reject
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !request.items?.length}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Approving..." : "Approve"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default RequestApprovalModal;

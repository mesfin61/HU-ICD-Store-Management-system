import React, {
  useEffect,
  useState,
} from "react";

import {
  getRequest,
} from "../../services/requestService";

import {
  issueInventory,
} from "../../services/issuanceService";

function IssuanceModal({
  requestId,
  onClose,
  onIssued,
}) {
  const [request, setRequest] =
    useState(null);

  const [
    selectedRequestItemId,
    setSelectedRequestItemId,
  ] = useState("");

  const [
    quantity,
    setQuantity,
  ] = useState("");

  const [
    dueDate,
    setDueDate,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadRequest = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data =
          await getRequest(requestId);

        if (!mounted) {
          return;
        }

        setRequest(data);

        const issuableItems =
          (data.items || []).filter(
            (item) => {
              const approved =
                Number(
                  item.quantity_approved,
                ) || 0;

              const issued =
                Number(
                  item.quantity_issued,
                ) || 0;

              return (
                approved - issued > 0
              );
            },
          );

        if (
          issuableItems.length > 0
        ) {
          setSelectedRequestItemId(
            issuableItems[0].id,
          );
        }
      } catch (error) {
        console.error(
          "[IssuanceModal] load request:",
          error,
        );

        if (mounted) {
          setErrorMessage(
            error.response?.data?.message ||
              "Failed to load request details.",
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

  const issuableItems =
    (request?.items || []).filter(
      (item) => {
        const approved =
          Number(
            item.quantity_approved,
          ) || 0;

        const issued =
          Number(
            item.quantity_issued,
          ) || 0;

        return (
          approved - issued > 0
        );
      },
    );

  const selectedItem =
    issuableItems.find(
      (item) =>
        item.id ===
        selectedRequestItemId,
    );

  const remainingApproved =
    selectedItem
      ? Number(
          selectedItem.quantity_approved,
        ) -
        Number(
          selectedItem.quantity_issued,
        )
      : 0;

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (!selectedItem) {
      setErrorMessage(
        "Select an item to issue.",
      );
      return;
    }

    const issueQuantity =
      Number(quantity);

    if (
      !Number.isInteger(
        issueQuantity,
      ) ||
      issueQuantity <= 0
    ) {
      setErrorMessage(
        "Issue quantity must be a positive whole number.",
      );
      return;
    }

    if (
      issueQuantity >
      remainingApproved
    ) {
      setErrorMessage(
        "Issue quantity cannot exceed the remaining approved quantity.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const result =
        await issueInventory({
          requestId,
          requestItemId:
            selectedItem.id,
          quantity:
            issueQuantity,
          dueDate,
        });

      /*
       * Pass the actual issued item back to RequestList.
       *
       * The backend returns the issued item ID,
       * while selectedItem gives us the display
       * information needed by the return modal.
       */
      if (onIssued) {
        onIssued({
          ...result,
          selectedItem,
        });
      }
    } catch (error) {
      console.error(
        "[IssuanceModal] issue inventory:",
        error,
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to issue inventory.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemChange = (
    event,
  ) => {
    setSelectedRequestItemId(
      event.target.value,
    );

    setQuantity("");
    setErrorMessage("");
  };

  if (!requestId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-primary">
              Process Inventory Issuance
            </h2>

            {request && (
              <p className="mt-1 text-sm text-slate-500">
                Request ID: {request.id}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md px-3 py-1 text-xl text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading request...
          </div>
        ) : errorMessage &&
          !request ? (
          <div className="p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6"
          >
            {request && (
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
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            {issuableItems.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                There is no approved quantity remaining for issuance.
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-primary">
                    Item
                  </label>

                  <select
                    value={
                      selectedRequestItemId
                    }
                    onChange={
                      handleItemChange
                    }
                    disabled={
                      isSubmitting
                    }
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-primary"
                  >
                    {issuableItems.map(
                      (item) => {
                        const remaining =
                          Number(
                            item.quantity_approved,
                          ) -
                          Number(
                            item.quantity_issued,
                          );

                        return (
                          <option
                            key={item.id}
                            value={item.id}
                          >
                            {item.item_name} (
                            {item.item_code})
                            —{" "}
                            {remaining}{" "}
                            {item.unit} remaining
                          </option>
                        );
                      },
                    )}
                  </select>
                </div>

                {selectedItem && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase text-slate-500">
                        Approved
                      </div>

                      <div className="mt-1 text-lg font-bold text-primary">
                        {
                          selectedItem.quantity_approved
                        }{" "}
                        {selectedItem.unit}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase text-slate-500">
                        Already Issued
                      </div>

                      <div className="mt-1 text-lg font-bold text-primary">
                        {
                          selectedItem.quantity_issued
                        }{" "}
                        {selectedItem.unit}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-blue-50 p-4">
                      <div className="text-xs font-semibold uppercase text-blue-700">
                        Remaining
                      </div>

                      <div className="mt-1 text-lg font-bold text-blue-800">
                        {remainingApproved}{" "}
                        {selectedItem.unit}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-primary">
                      Issue Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      max={
                        remainingApproved
                      }
                      step="1"
                      value={quantity}
                      onChange={(
                        event,
                      ) =>
                        setQuantity(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        isSubmitting
                      }
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-primary">
                      Due Date
                    </label>

                    <input
                      type="date"
                      value={dueDate}
                      onChange={(
                        event,
                      ) =>
                        setDueDate(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        isSubmitting
                      }
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                  <button
                    type="button"
                    onClick={
                      onClose
                    }
                    disabled={
                      isSubmitting
                    }
                    className="rounded-md border border-primary px-6 py-2 text-sm font-semibold text-primary hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting
                    }
                    className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Issuing..."
                      : "Issue Inventory"}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default IssuanceModal;
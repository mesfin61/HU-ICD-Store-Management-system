import React, {
  useState,
} from "react";

import {
  returnInventory,
} from "../../services/itemReturnService";

function ReturnInventoryModal({
  issuedItem,
  onClose,
  onSuccess,
}) {
  const [
    quantityReturned,
    setQuantityReturned,
  ] = useState("");

  const [
    conditionStatus,
    setConditionStatus,
  ] = useState("GOOD");

  const [
    remarks,
    setRemarks,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  if (!issuedItem) {
    return null;
  }

  // =========================================================
  // DATA FROM ISSUED INVENTORY API
  // =========================================================

  const issuedQuantity =
    Number(
      issuedItem.quantity_issued,
    ) || 0;

  const alreadyReturned =
    Number(
      issuedItem.quantity_returned,
    ) || 0;

  const remainingQuantity =
    Number(
      issuedItem.quantity_remaining,
    );

  /*
   * Use the backend-provided remaining quantity when
   * available. Fall back to the calculated value only if
   * the backend field is missing.
   */
  const effectiveRemainingQuantity =
    Number.isFinite(remainingQuantity)
      ? remainingQuantity
      : Math.max(
          issuedQuantity -
            alreadyReturned,
          0,
        );

  // =========================================================
  // SUBMIT RETURN
  // =========================================================

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setErrorMessage("");

    const quantity =
      Number(quantityReturned);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setErrorMessage(
        "Return quantity must be a positive whole number.",
      );
      return;
    }

    if (
      quantity >
      effectiveRemainingQuantity
    ) {
      setErrorMessage(
        `You can return at most ${effectiveRemainingQuantity} ${issuedItem.unit || "pcs"}.`,
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const result =
        await returnInventory({
          issuedItemId:
            issuedItem.id,

          quantityReturned:
            quantity,

          conditionStatus,

          remarks:
            remarks.trim() || null,
        });

      if (onSuccess) {
        await onSuccess(result);
      }
    } catch (error) {
      console.error(
        "[ReturnInventoryModal] return inventory:",
        error,
      );

      setErrorMessage(
        error.response?.data
          ?.message ||
          "Failed to return inventory.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">

      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">

        {/* ===================================================
            HEADER
            =================================================== */}

        <div className="flex items-start justify-between border-b bg-white px-6 py-4">

          <div>
            <h2 className="text-xl font-bold text-primary">
              Return Inventory
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-600">
              {issuedItem.item_name ||
                "Inventory Item"}
            </p>

            {issuedItem.item_code && (
              <p className="text-xs text-slate-400">
                Item Code:{" "}
                {issuedItem.item_code}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md px-3 py-1 text-2xl leading-none text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>

        </div>

        {/* ===================================================
            FORM
            =================================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >

          {/* ERROR */}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {/* =================================================
              SUMMARY
              ================================================= */}

          <div className="grid gap-4 md:grid-cols-3">

            <div className="rounded-lg border bg-slate-50 p-4">

              <div className="text-xs font-semibold uppercase text-slate-500">
                Issued Quantity
              </div>

              <div className="mt-1 text-lg font-bold text-primary">
                {issuedQuantity}{" "}
                {issuedItem.unit ||
                  "pcs"}
              </div>

            </div>

            <div className="rounded-lg border bg-slate-50 p-4">

              <div className="text-xs font-semibold uppercase text-slate-500">
                Already Returned
              </div>

              <div className="mt-1 text-lg font-bold text-primary">
                {alreadyReturned}{" "}
                {issuedItem.unit ||
                  "pcs"}
              </div>

            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">

              <div className="text-xs font-semibold uppercase text-blue-700">
                Remaining
              </div>

              <div className="mt-1 text-lg font-bold text-blue-800">
                {
                  effectiveRemainingQuantity
                }{" "}
                {issuedItem.unit ||
                  "pcs"}
              </div>

            </div>

          </div>

          {/* =================================================
              QUANTITY
              ================================================= */}

          <div>

            <label
              htmlFor="quantity-returned"
              className="block text-sm font-semibold text-primary"
            >
              Quantity Returned
            </label>

            <input
              id="quantity-returned"
              name="quantityReturned"
              type="number"
              min="1"
              max={
                effectiveRemainingQuantity
              }
              step="1"
              value={quantityReturned}
              onChange={(event) => {
                setQuantityReturned(
                  event.target.value,
                );

                setErrorMessage("");
              }}
              disabled={
                isSubmitting ||
                effectiveRemainingQuantity <=
                  0
              }
              className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-primary outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              placeholder="Enter quantity"
            />

            <p className="mt-1 text-xs text-slate-500">
              Maximum returnable quantity:{" "}
              {
                effectiveRemainingQuantity
              }{" "}
              {issuedItem.unit ||
                "pcs"}
            </p>

          </div>

          {/* =================================================
              CONDITION
              ================================================= */}

          <div>

            <label
              htmlFor="condition-status"
              className="block text-sm font-semibold text-primary"
            >
              Condition
            </label>

            <select
              id="condition-status"
              name="conditionStatus"
              value={conditionStatus}
              onChange={(event) =>
                setConditionStatus(
                  event.target.value,
                )
              }
              disabled={isSubmitting}
              className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-primary outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="GOOD">
                Good
              </option>

              <option value="DAMAGED">
                Damaged
              </option>

              <option value="NEEDS_REPAIR">
                Needs Repair
              </option>

              <option value="UNUSABLE">
                Unusable
              </option>
            </select>

          </div>

          {/* =================================================
              REMARKS
              ================================================= */}

          <div>

            <label
              htmlFor="return-remarks"
              className="block text-sm font-semibold text-primary"
            >
              Remarks{" "}
              <span className="text-xs font-normal text-slate-400">
                (optional)
              </span>
            </label>

            <textarea
              id="return-remarks"
              name="remarks"
              rows={4}
              value={remarks}
              onChange={(event) =>
                setRemarks(
                  event.target.value,
                )
              }
              disabled={isSubmitting}
              placeholder="Optional return remarks..."
              className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-primary outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            />

          </div>

          {/* =================================================
              FOOTER
              ================================================= */}

          <div className="flex justify-end gap-3 border-t pt-4">

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-primary px-6 py-2 text-sm font-semibold text-primary hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                effectiveRemainingQuantity <=
                  0
              }
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Returning..."
                : "Confirm Return"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default ReturnInventoryModal;
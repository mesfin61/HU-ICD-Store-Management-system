import React, { useEffect, useState } from "react";

import { FaCircleCheck } from "react-icons/fa6";

import { FaDownload, FaUpload, FaTrash } from "react-icons/fa";

import { PiStorefront } from "react-icons/pi";

import { IoBarChartSharp } from "react-icons/io5";

import {
  getInventoryItems,
  receiveStock,
  adjustStockIn,
  adjustStockOut,
  writeOffStock,
} from "../../services/inventoryService";

const TRANSACTION_TYPES = {
  RECEIPT: "RECEIPT",
  ADJUSTMENT_IN: "ADJUSTMENT_IN",
  ADJUSTMENT_OUT: "ADJUSTMENT_OUT",
  WRITE_OFF: "WRITE_OFF",
};

function StockOperations({ onProcessTransaction }) {
  const [inventoryItems, setInventoryItems] = useState([]);

  const [selectedItemId, setSelectedItemId] = useState("");

  const [transactionType, setTransactionType] = useState(
    TRANSACTION_TYPES.RECEIPT,
  );

  const [quantity, setQuantity] = useState("");

  const [referenceNo, setReferenceNo] = useState("");

  const [remarks, setRemarks] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  // =========================================================
  // LOAD REAL INVENTORY FROM BACKEND
  // =========================================================

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getInventoryItems();

      const items = Array.isArray(data) ? data : [];

      setInventoryItems(items);

      if (!selectedItemId && items.length > 0) {
        setSelectedItemId(items[0].id);
      }
    } catch (error) {
      console.error("[StockOperations] load inventory:", error);

      setErrorMessage(
        error.response?.data?.message || "Failed to load inventory.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // =========================================================
  // SELECTED ITEM
  // =========================================================

  const selectedItem = inventoryItems.find(
    (item) => item.id === selectedItemId,
  );

  const getItemName = (item) =>
    item?.name || item?.item_name || item?.itemName || "Unknown item";

  const getItemCode = (item) => item?.item_code || item?.itemCode || "-";

  const getUnit = (item) => item?.unit || "pcs";

  const getCurrentStock = (item) =>
    Number(item?.current_stock ?? item?.currentStock ?? 0);

  const getPhysicalStock = (item) =>
    Number(item?.physical_stock ?? item?.physicalStock ?? 0);

  // =========================================================
  // TRANSACTION METADATA
  // =========================================================

  const transactionLabel = {
    [TRANSACTION_TYPES.RECEIPT]: "Receipt",

    [TRANSACTION_TYPES.ADJUSTMENT_IN]: "Adjustment In",

    [TRANSACTION_TYPES.ADJUSTMENT_OUT]: "Adjustment Out",

    [TRANSACTION_TYPES.WRITE_OFF]: "Write-Off",
  }[transactionType];

  const transactionDescription = {
    [TRANSACTION_TYPES.RECEIPT]: "Record newly received inventory.",

    [TRANSACTION_TYPES.ADJUSTMENT_IN]:
      "Increase inventory to correct the recorded quantity.",

    [TRANSACTION_TYPES.ADJUSTMENT_OUT]:
      "Decrease inventory to correct the recorded quantity.",

    [TRANSACTION_TYPES.WRITE_OFF]:
      "Remove damaged, lost, or unusable inventory from stock.",
  }[transactionType];

  // =========================================================
  // PROCESS TRANSACTION
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!selectedItemId) {
      setErrorMessage("Select an inventory item.");
      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setErrorMessage("Quantity must be a positive whole number.");
      return;
    }

    const cleanReference = referenceNo.trim();

    if (!cleanReference) {
      setErrorMessage("Reference number is required.");
      return;
    }

    const cleanRemarks = remarks.trim();

    try {
      setIsSubmitting(true);

      const payload = {
        quantity: parsedQuantity,
        referenceNo: cleanReference,
        remarks: cleanRemarks || null,
      };

      let result;

      switch (transactionType) {
        case TRANSACTION_TYPES.RECEIPT:
          result = await receiveStock(selectedItemId, payload);
          break;

        case TRANSACTION_TYPES.ADJUSTMENT_IN:
          result = await adjustStockIn(selectedItemId, payload);
          break;

        case TRANSACTION_TYPES.ADJUSTMENT_OUT:
          result = await adjustStockOut(selectedItemId, payload);
          break;

        case TRANSACTION_TYPES.WRITE_OFF:
          result = await writeOffStock(selectedItemId, payload);
          break;

        default:
          throw new Error("INVALID_TRANSACTION_TYPE");
      }

      setSuccessMessage(`${transactionLabel} processed successfully.`);

      setQuantity("");
      setReferenceNo("");
      setRemarks("");

      await loadInventory();

      if (typeof onProcessTransaction === "function") {
        await onProcessTransaction({
          type: transactionType,
          label: transactionLabel,
          item: selectedItem,
          quantity: parsedQuantity,
          result,
        });
      }
    } catch (error) {
      console.error("[StockOperations] process transaction:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to process inventory transaction.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="px-0 pt-1 pb-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">
            Stock Operations
          </h2>

          <p className="text-sm font-semibold text-primary">
            Manage inventory receipts, adjustments, and write-offs.
          </p>
        </div>
      </div>

      {/* =====================================================
          TRANSACTION TYPE
          ===================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            type: TRANSACTION_TYPES.RECEIPT,
            icon: FaDownload,
          },
          {
            type: TRANSACTION_TYPES.ADJUSTMENT_IN,
            icon: FaDownload,
          },
          {
            type: TRANSACTION_TYPES.ADJUSTMENT_OUT,
            icon: FaUpload,
          },
          {
            type: TRANSACTION_TYPES.WRITE_OFF,
            icon: FaTrash,
          },
        ].map(({ type, icon: Icon }) => {
          const active = transactionType === type;

          const label = {
            [TRANSACTION_TYPES.RECEIPT]: "Receipt",

            [TRANSACTION_TYPES.ADJUSTMENT_IN]: "Adjustment In",

            [TRANSACTION_TYPES.ADJUSTMENT_OUT]: "Adjustment Out",

            [TRANSACTION_TYPES.WRITE_OFF]: "Write-Off",
          }[type];

          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                setTransactionType(type);
                setSuccessMessage("");
                setErrorMessage("");
              }}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                active
                  ? "border-blue-700 bg-blue-700 text-white"
                  : "border-gray-300 bg-white text-primary hover:bg-slate-50"
              }`}
            >
              <Icon className="h-5 w-5" />

              <div>
                <div className="font-semibold">{label}</div>

                <div
                  className={`text-xs ${
                    active ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {
                    {
                      [TRANSACTION_TYPES.RECEIPT]: "Add received stock",

                      [TRANSACTION_TYPES.ADJUSTMENT_IN]:
                        "Increase recorded stock",

                      [TRANSACTION_TYPES.ADJUSTMENT_OUT]:
                        "Decrease recorded stock",

                      [TRANSACTION_TYPES.WRITE_OFF]: "Remove unusable stock",
                    }[type]
                  }
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =====================================================
          SUCCESS / ERROR
          ===================================================== */}

      {successMessage && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <FaCircleCheck />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* ===================================================
            FORM
            =================================================== */}

        <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6 lg:col-span-2">
          <div className="mb-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-primary">
              {transactionLabel}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {transactionDescription}
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading inventory...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ITEM */}

              <div>
                <label className="block text-sm font-semibold text-primary">
                  Inventory Item
                </label>

                <select
                  value={selectedItemId}
                  onChange={(event) => {
                    setSelectedItemId(event.target.value);
                    setErrorMessage("");
                  }}
                  disabled={isSubmitting || inventoryItems.length === 0}
                  className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-primary outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {inventoryItems.length === 0 ? (
                    <option value="">No inventory items available</option>
                  ) : (
                    <>
                      <option value="">Select an inventory item...</option>

                      {inventoryItems.map((inventoryItem) => (
                        <option key={inventoryItem.id} value={inventoryItem.id}>
                          {getItemName(inventoryItem)} (
                          {getItemCode(inventoryItem)})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* QUANTITY */}

              <div>
                <label className="block text-sm font-semibold text-primary">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => {
                    setQuantity(event.target.value);
                    setErrorMessage("");
                  }}
                  disabled={isSubmitting}
                  placeholder="Enter quantity"
                  className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-primary outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                {selectedItem && (
                  <p className="mt-1 text-xs text-slate-500">
                    Current available stock: {getCurrentStock(selectedItem)}{" "}
                    {getUnit(selectedItem)}
                  </p>
                )}
              </div>

              {/* REFERENCE */}

              <div>
                <label className="block text-sm font-semibold text-primary">
                  Reference Number
                </label>

                <input
                  type="text"
                  value={referenceNo}
                  onChange={(event) => {
                    setReferenceNo(event.target.value);
                    setErrorMessage("");
                  }}
                  disabled={isSubmitting}
                  placeholder="Invoice / PO / Adjustment reference"
                  className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 uppercase text-primary outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* REMARKS */}

              <div>
                <label className="block text-sm font-semibold text-primary">
                  Remarks
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <textarea
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  placeholder="Optional explanation or internal note..."
                  className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-primary outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="border-t pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || inventoryItems.length === 0}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaCircleCheck />

                  {isSubmitting
                    ? "Processing..."
                    : `Process ${transactionLabel}`}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ===================================================
            ITEM INSIGHT
            =================================================== */}

        <aside className="rounded-lg border bg-white p-4 shadow-sm">
          <h4 className="mb-4 text-lg font-semibold text-primary">
            Item Insight
          </h4>

          {selectedItem ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-secondary-container p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white p-3">
                    <PiStorefront
                      style={{
                        color: "#003b72",
                        fontSize: "24px",
                      }}
                    />
                  </div>

                  <div>
                    <div className="text-xs uppercase text-slate-500">Item</div>

                    <div className="font-semibold text-primary">
                      {getItemName(selectedItem)}
                    </div>

                    <div className="text-xs text-slate-500">
                      {getItemCode(selectedItem)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs uppercase text-slate-500">
                    Available
                  </div>

                  <div className="mt-1 text-xl font-bold text-primary">
                    {getCurrentStock(selectedItem)}
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs uppercase text-slate-500">
                    Physical
                  </div>

                  <div className="mt-1 text-xl font-bold text-primary">
                    {getPhysicalStock(selectedItem)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-slate-50 p-4 text-sm">
                <div className="font-semibold text-primary">
                  Selected operation
                </div>

                <div className="mt-1 text-slate-600">{transactionLabel}</div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
              Select an inventory item to view its current stock.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default StockOperations;

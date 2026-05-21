import { useState } from "react";
import { FaDownload, FaUpload } from "react-icons/fa";
import { PiStorefront } from "react-icons/pi";
import { IoBarChartSharp } from "react-icons/io5";
import { FaCircleCheck } from "react-icons/fa6";
import {
  getInventorySummary,
  getStoredInventoryItems,
} from "../inventory/inventoryStorage";

function StockOperations({ onProcessTransaction }) {
  const summary = getInventorySummary(getStoredInventoryItems());
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mode, setMode] = useState("inbound");
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [date, setDate] = useState("");
  const [source, setSource] = useState("");
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");

  const currentStock = summary.totalItems;
  const projected = Math.max(summary.totalItems - summary.lowStockItems, 0);
  const inTransit = summary.outStockItems + summary.lowStockItems;
  const safetyLevel = Math.max(summary.lowStockItems, 5);

  const selectedItemLabel = {
    "": "Select an item from inventory...",
    "item-1": "Item 1 - Laptop",
    "item-2": "Item 2 - Monitor",
    "item-3": "Item 3 - Router",
  }[item];

  const handleSubmit = (event) => {
    event.preventDefault();

    const isFormComplete =
      item.trim() !== "" &&
      quantity > 0 &&
      date.trim() !== "" &&
      source.trim() !== "" &&
      reference.trim() !== "" &&
      remarks.trim() !== "";

    if (!isFormComplete) {
      setErrorMessage("All fields are required.");
      setSuccess(false);
      return;
    }

    setErrorMessage("");

    if (typeof onProcessTransaction === "function") {
      onProcessTransaction({
        id: crypto.randomUUID(),
        movementType: mode === "inbound" ? "Stock-In" : "Stock-Out",
        item: selectedItemLabel,
        quantity,
        date,
        source,
        reference,
        remarks,
        status: mode === "inbound" ? "Received" : "Issued",
      });
    }

    setSuccess(true);

    setItem("");
    setQuantity(0);
    setDate("");
    setSource("");
    setReference("");
    setRemarks("");
    setMode("inbound");
  };

  return (
    <div className="px-0 pt-1 pb-6 md:px-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold text-primary">
            Stock Operations
          </h2>
          <p className="text-sm text-primary font-semibold">
            Manage inbound and outbound technical assets for the directorate.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            className={`w-full sm:w-auto px-4 py-2 rounded-md ${mode === "inbound" ? "bg-blue-900 text-white" : "bg-white text-primary border border-primary"}`}
            onClick={() => setMode("inbound")}
          >
            Stock-In
          </button>
          <button
            className={`w-full sm:w-auto px-4 py-2 rounded-md ${mode === "outbound" ? "bg-blue-900 text-white" : "bg-white text-primary border border-primary"}`}
            onClick={() => setMode("outbound")}
          >
            Stock-Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {success === true ? (
          <div className="flex items-center flex-col p-6 sm:p-8 bg-white rounded-lg shadow-lg w-full lg:col-span-2">
            <span className="animate-bounce p-5 bg-blue-500 rounded-full mb-2">
              <FaCircleCheck style={{ color: "#003b72", fontSize: "48px" }} />
            </span>
            <span className="text-primary font-semibold p-2">
              Transaction processed!
            </span>
            <span className=" bg-primary text-white px-4 py-2 rounded-md mt-2">
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="text-white bg-primary hover:text-white"
              >
                New Transaction
              </button>
            </span>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-white border rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold flex flex-1 items-center gap-1 text-primary min-w-0 ">
                <span>
                  {mode === "inbound" ? <FaDownload /> : <FaUpload />}{" "}
                </span>
                New
                {mode === "inbound" ? " Stock-In" : " Stock-Out"} Entry
              </h3>
              <span className="text-xs bg-blue-600 font-semibold text-white px-2 py-1 rounded">
                {mode === "inbound" ? "INBOUND MODE" : "OUTBOUND MODE"}
              </span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-primary">
                  Asset / Item Selection
                </label>
                <select
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  className="mt-1 block w-full border border-primary rounded-md p-2 text-primary font-medium"
                >
                  <option className="text-primary font-medium" value="">
                    Select an item from inventory...
                  </option>
                  <option className="text-primary font-medium" value="item-1">
                    Item 1 - Laptop
                  </option>
                  <option className="text-primary font-medium" value="item-2">
                    Item 2 - Monitor
                  </option>
                  <option className="text-primary font-medium" value="item-3">
                    Item 3 - Router
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-1 block w-full border border-primary rounded-md p-2 text-primary font-medium"
                  />
                  <div className="text-xs text-gray-500 mt-1">UNITS</div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 block w-full border border-primary rounded-md p-2 text-primary font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary">
                    Source Vendor / Department
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g., Global Tech Solutions"
                    className="mt-1 block w-full border border-primary rounded-md p-2 text-primary font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary">
                    Reference No. (Invoice/PO)
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="REF-2024-001"
                    className="mt-1 block w-full border border-primary rounded-md p-2 text-primary font-medium uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary">
                  Remarks / Internal Notes
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full border border-primary rounded-md p-2"
                  placeholder="Additional details regarding this stock movement..."
                />
              </div>

              <div className=" items-center gap-3 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 flex gap-1 items-center bg-blue-900 text-white rounded-md"
                >
                  <span>
                    <FaCircleCheck />
                  </span>
                  Process Transaction
                </button>
              </div>

              {errorMessage ? (
                <p className="text-sm font-medium text-red-600 mt-2">
                  {errorMessage}
                </p>
              ) : null}
            </form>
          </div>
        )}

        <aside className="space-y-4 lg:sticky lg:top-4">
          {mode === "inbound" ? (
            <div className="bg-white border rounded-lg p-4 shadow-sm w-full">
              <h4 className="text-md font-medium text-primary mb-3">
                Item Insight
              </h4>

              <span className="flex flex-col sm:flex-row gap-2 mt-1 items-start sm:items-center p-3 bg-secondary-container rounded-md ">
                <span className="p-3 bg-white border-primary rounded">
                  <PiStorefront
                    style={{ color: "#003b72", fontSize: "24px" }}
                  />
                </span>
                <span className="sm:ml-3 text-sm font-medium text-primary">
                  <h2>Current Stock</h2>
                  <span className="text-lg font-bold text-primary">
                    {currentStock} Units
                  </span>
                </span>
              </span>

              <span className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-center text-sm text-gray-600 mb-3">
                <span className="flex flex-col items-center border border-primary rounded px-5 py-2">
                  <span className="text-xs font-medium text-primary">
                    IN TRANSIT
                  </span>
                  <span className="font-medium text-primary">
                    {inTransit} Units
                  </span>
                </span>
                <span className="flex flex-col items-center border border-primary rounded px-5 py-2">
                  <span className="text-xs font-medium text-primary">
                    SAFETY LEVEL
                  </span>
                  <span className="font-medium text-primary">
                    {safetyLevel} Units
                  </span>
                </span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col border border-gray-500 rounded-lg border-solid p-4">
              <h1 className="text-primary text-sm font-semibold">
                items insight
              </h1>

              <span className="flex flex-col sm:flex-row gap-2 mt-1 items-start sm:items-center p-3 bg-secondary-container rounded-md ">
                <span className="p-3 bg-white border-primary rounded">
                  <PiStorefront
                    style={{ color: "#003b72", fontSize: "24px" }}
                  />
                </span>
                <span className="sm:ml-3 text-sm font-medium text-primary">
                  <h2>Current Stock</h2>
                  <span className="text-lg font-bold text-primary">
                    {currentStock} Units
                  </span>
                </span>
              </span>

              <span className="flex flex-col sm:flex-row gap-2 mt-1 items-start sm:items-center p-3 bg-secondary-container rounded-md">
                <span className="p-3 bg-white border-primary rounded">
                  <IoBarChartSharp
                    style={{ color: "#003b72", fontSize: "24px" }}
                  />
                </span>
                <span className="sm:ml-3 text-sm font-medium text-primary">
                  <h2>projected Stock</h2>
                  <span className="text-lg font-bold text-primary">
                    {projected} Units
                  </span>
                </span>
              </span>

              <span className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-center text-sm text-gray-600 mb-3">
                <span className="flex flex-col items-center border border-primary rounded px-5 py-2">
                  <span className="text-xs font-medium text-primary">
                    IN TRANSIT
                  </span>
                  <span className="font-medium text-primary">
                    {inTransit} Units
                  </span>
                </span>
                <span className="flex flex-col items-center border border-primary rounded px-5 py-2">
                  <span className="text-xs font-medium text-primary">
                    SAFETY LEVEL
                  </span>
                  <span className="font-medium text-primary">
                    {safetyLevel} Units
                  </span>
                </span>
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default StockOperations;

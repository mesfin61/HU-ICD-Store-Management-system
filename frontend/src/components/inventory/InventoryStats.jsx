import React from "react";
import { Link } from "react-router-dom";
import { PiStorefront } from "react-icons/pi";
import { GoAlert } from "react-icons/go";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { MdCategory } from "react-icons/md";
import { getInventorySummary, getStoredInventoryItems } from "./inventoryStorage";

function InventoryStats() {
  const summary = getInventorySummary(getStoredInventoryItems());

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-6 items-center justify-between w-full">
        <div className="flex flex-col ">
          <h1 className="text-primary text-lg font-bold ">
            Inventory Management
          </h1>
          <p className="text-secondary font-semibold">
            Monitor and manage institutional technical assets across
            departments.
          </p>
        </div>

        <div className="ml-auto">
          <Link
            to="/inventory/add-new-item"
            className=" flex items-center gap-2 px-4 py-2 bg-surface-container-highest hover:bg-primary text-primary border border-primary/20 rounded-lg hover:text-white transition-all"
          >
            Add New Item
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <span className="flex p-4 gap-6 shadow-lg items-center rounded-lg border bg-white w-64 h-24">
          <span className="flex flex-col mr-2 flex-auto">
            <h2 className="text-gray-600 text-lg flex-1 font-semibold">
              Total items
            </h2>
            <h1>{summary.totalItems}</h1>
          </span>
          <span className="p-3 items-center rounded-lg bg-slate-400 ">
            <PiStorefront style={{ color: "#003b72", fontSize: "24px" }} />
          </span>
        </span>
        <span className="flex p-4 gap-6 shadow-lg rounded-lg border items-center space-between bg-white w-64 h-24">
          <span className="flex flex-col flex-1 mr-2 ">
            <h2 className="text-gray-600 text-lg flex-1 font-semibold">
              Low Stocks Item
            </h2>
            <h1 className="text-green-600 flex-1 font-bold">{summary.lowStockItems}</h1>
          </span>
          <span className="p-3 items-center rounded-lg bg-green-300 ">
            <GoAlert style={{ color: "green", fontSize: "24px" }} />
          </span>
        </span>
        <span className="flex p-4 gap-6 shadow-lg items-center rounded-lg border bg-white w-64 h-24">
          <span className="flex flex-col flex-1 mr-2">
            <h2 className="text-gray-600 text-lg flex-1 font-semibold">
              Out Stock Item
            </h2>
            <h1 className="text-red-600 flex-1 font-bold">{summary.outStockItems}</h1>
            <p className="text-sm text-red-600 flex flex-auto items-center gap-1 font-semibold">
              require action
            </p>
          </span>
          <span className="p-3 items-center rounded-lg bg-red-300  ">
            <IoMdCloseCircleOutline
              style={{ color: "#b91f1f", fontSize: "24px" }}
            />
          </span>
        </span>
        <span className="flex p-4 gap-6 shadow-lg rounded-lg border items-center space-between bg-white w-64 h-24">
          <span className="flex flex-col flex-auto ">
            <h2 className="text-gray-600 text-lg flex-1 font-semibold">
              Active Categories
            </h2>
            <h1 className="text-sm text-amber-600 font-semibold">{summary.activeCategories}</h1>
          </span>
          <span className="p-3 items-center rounded-lg bg-amber-300">
            <MdCategory style={{ color: "#d97706", fontSize: "24px" }} />
          </span>
        </span>
      </div>
    </div>
  );
}

export default InventoryStats;

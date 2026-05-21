import React from "react";
import { CiCalendarDate } from "react-icons/ci";
import {
  FaArrowTrendUp,
  FaCalendarCheck,
  FaRegCircleCheck,
} from "react-icons/fa6";
import {
  MdAddAlert,
  MdOutlineEventAvailable,
  MdOutlinePendingActions,
} from "react-icons/md";
import { IoWarning } from "react-icons/io5";
import {
  getInventorySummary,
  getStoredInventoryItems,
} from "../inventory/inventoryStorage";

function Stats() {
  const summary = getInventorySummary(getStoredInventoryItems());
  const availableStock = Math.max(
    summary.totalItems - summary.outStockItems,
    0,
  );
  const pendingRequests = summary.lowStockItems + summary.outStockItems;

  return (
    <section className="flex flex-col gap-1">
      <div className="flex gap-6 items-center justify-between w-full">
        <div className="flex flex-col ">
          <h1 className="text-primary text-lg font-bold ">Store Dashboard</h1>
          <p className="text-secondary font-semibold">
            overview of current ICT assets and pending administrative tasks
          </p>
        </div>

        <div className="ml-auto">
          <button className=" flex items-center gap-2 px-4 py-2 bg-surface-container-highest hover:bg-primary text-primary border border-primary/20 rounded-lg hover:text-white transition-all">
            <CiCalendarDate /> Last 30 Days
          </button>
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
            <FaCalendarCheck style={{ color: "#003b72", fontSize: "24px" }} />
          </span>
        </span>
        <span className="flex p-4 gap-6 shadow-lg rounded-lg border items-center space-between bg-white w-64 h-24">
          <span className="flex flex-col flex-1 mr-2 ">
            <h2 className="text-gray-600 text-lg flex-1 font-semibold">
              Available Stock
            </h2>
            <h1 className="text-green-600 flex-1 font-bold">
              {availableStock}
            </h1>
            <p className="text-green-600 flex flex-1 items-center gap-1">
              <span>
                <FaRegCircleCheck style={{ color: "green" }} />
              </span>
              healthy level
            </p>
          </span>
          <span className="p-3 items-center rounded-lg bg-green-300 ">
            <MdOutlineEventAvailable
              style={{ color: "green", fontSize: "24px" }}
            />
          </span>
        </span>
        <span className="flex p-4 gap-6 shadow-lg items-center rounded-lg border bg-white w-64 h-24">
          <span className="flex flex-col flex-1 mr-2">
            <h2 className="text-gray-600 text-lg flex-1 font-semibold">
              Low Stocks Alert
            </h2>
            <h1 className="text-red-600 flex-1 font-bold">
              {summary.lowStockItems}
            </h1>
            <p className="text-sm text-red-600 flex flex-auto items-center gap-1 font-semibold">
              <span>
                <IoWarning />
              </span>
              require action
            </p>
          </span>
          <span className="p-3 items-center rounded-lg bg-red-300  ">
            <MdAddAlert style={{ color: "#b91f1f", fontSize: "24px" }} />
          </span>
        </span>
        <span className="flex p-4 gap-6 shadow-lg rounded-lg border items-center space-between bg-white w-64 h-24">
          <span className="flex flex-col flex-auto ">
            <h2 className="text-gray-600 text-lg flex-1 font-semibold">
              pending requests
            </h2>
            <h1 className="text-sm text-amber-600 font-semibold">
              {pendingRequests}
            </h1>
            <p className="text-amber-600 text-sm font-semibold">
              {pendingRequests} flagged items
            </p>
          </span>
          <span className="p-3 items-center rounded-lg bg-amber-300">
            <MdOutlinePendingActions
              style={{ color: "#d97706", fontSize: "24px" }}
            />
          </span>
        </span>
      </div>
    </section>
  );
}

export default Stats;

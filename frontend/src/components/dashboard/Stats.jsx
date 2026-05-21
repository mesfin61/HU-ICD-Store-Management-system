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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
        <div className="flex flex-col ">
          <h1 className="text-primary text-lg font-bold ">Store Dashboard</h1>
          <p className="text-secondary font-semibold">
            overview of current ICT assets and pending administrative tasks
          </p>
        </div>

        <div className="ml-0 md:ml-auto">
          <button className=" flex items-center gap-2 px-4 py-2 bg-surface-container-highest hover:bg-primary text-primary border border-primary/20 rounded-lg hover:text-white transition-all">
            <CiCalendarDate /> Last 30 Days
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <span className="flex p-4 gap-4 shadow-lg items-center rounded-lg border bg-white w-full min-h-[96px]">
          <span className="flex flex-col mr-2 flex-auto min-w-0">
            <h2 className="text-gray-600 text-lg flex-1 font-semibold">
              Total items
            </h2>
            <h1 className="text-2xl font-bold text-primary">
              {summary.totalItems}
            </h1>
          </span>
          <span className="p-3 items-center rounded-lg bg-slate-400 ">
            <FaCalendarCheck style={{ color: "#003b72", fontSize: "24px" }} />
          </span>
        </span>
        <span className="flex p-4 gap-4 shadow-lg rounded-lg border items-center bg-white w-full min-h-[96px]">
          <span className="flex flex-col flex-1 mr-2 min-w-0">
            <h2 className="text-gray-600 text-lg flex-1 font-semibold">
              Available Stock
            </h2>
            <h1 className="text-2xl text-green-600 flex-1 font-bold">
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
        <span className="flex p-4 gap-4 shadow-lg items-center rounded-lg border bg-white w-full min-h-[96px]">
          <span className="flex flex-col flex-1 mr-2 min-w-0">
            <h2 className="text-gray-600 text-lg flex-1 font-semibold">
              Low Stocks Alert
            </h2>
            <h1 className="text-2xl text-red-600 flex-1 font-bold">
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
        <span className="flex p-4 gap-4 shadow-lg rounded-lg border items-center bg-white w-full min-h-[96px]">
          <span className="flex flex-col flex-auto min-w-0">
            <h2 className="text-gray-600 text-lg flex-1 font-semibold">
              pending requests
            </h2>
            <h1 className="text-2xl text-amber-600 font-semibold">
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

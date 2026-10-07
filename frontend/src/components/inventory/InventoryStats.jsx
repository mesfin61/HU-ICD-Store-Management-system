import React from "react";
import { Link } from "react-router-dom";
import { PiStorefront } from "react-icons/pi";
import { GoAlert } from "react-icons/go";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { MdCategory } from "react-icons/md";
import { useUser } from "../../context/AuthContext";

function InventoryStats({ items = [], isLoading = false }) {
  const { user } = useUser();
  const totalItems = items.length;

  const lowStockItems = items.filter(
    (item) =>
      Number(item.current_stock) > 0 &&
      Number(item.current_stock) <= Number(item.minimum_stock),
  ).length;

  const outStockItems = items.filter(
    (item) => Number(item.current_stock) === 0,
  ).length;

  const activeCategories = new Set(
    items.map((item) => item.category_id).filter(Boolean),
  ).size;

  return (
    <div className="flex flex-col gap-1">
      {" "}
      <div className="flex gap-6 items-center justify-between w-full">
        {" "}
        <div className="flex flex-col">
          {" "}
          <h1 className="text-primary text-lg font-bold">
            Inventory Management{" "}
          </h1>
          <p className="text-secondary font-semibold">
            Monitor and manage institutional technical assets across
            departments.
          </p>
        </div>
        {user?.role === "Store Manager" && (
          <div className="ml-auto">
            <Link
              to="/inventory/add-new-item"
              className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest hover:bg-primary text-primary border border-primary/20 rounded-lg hover:text-white transition-all"
            >
              Add New Item
            </Link>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-2">
        <span className="flex p-4 gap-6 shadow-lg items-center rounded-lg border bg-white min-h-24">
          <span className="flex flex-col mr-2 flex-auto">
            <h2 className="text-gray-600 text-lg font-semibold">Total items</h2>

            <h1 className="text-2xl font-bold text-primary">
              {isLoading ? "—" : totalItems}
            </h1>
          </span>

          <span className="p-3 rounded-lg bg-slate-400">
            <PiStorefront
              style={{
                color: "#003b72",
                fontSize: "24px",
              }}
            />
          </span>
        </span>

        <span className="flex p-4 gap-6 shadow-lg rounded-lg border items-center bg-white min-h-24">
          <span className="flex flex-col flex-1 mr-2">
            <h2 className="text-gray-600 text-lg font-semibold">
              Low Stock Items
            </h2>

            <h1 className="text-2xl text-amber-600 font-bold">
              {isLoading ? "—" : lowStockItems}
            </h1>
          </span>

          <span className="p-3 rounded-lg bg-amber-100">
            <GoAlert
              style={{
                color: "#d97706",
                fontSize: "24px",
              }}
            />
          </span>
        </span>

        <span className="flex p-4 gap-6 shadow-lg items-center rounded-lg border bg-white min-h-24">
          <span className="flex flex-col flex-1 mr-2">
            <h2 className="text-gray-600 text-lg font-semibold">
              Out of Stock
            </h2>

            <h1 className="text-2xl text-red-600 font-bold">
              {isLoading ? "—" : outStockItems}
            </h1>

            {!isLoading && outStockItems > 0 ? (
              <p className="text-sm text-red-600 font-semibold">
                require action
              </p>
            ) : null}
          </span>

          <span className="p-3 rounded-lg bg-red-300">
            <IoMdCloseCircleOutline
              style={{
                color: "#b91f1f",
                fontSize: "24px",
              }}
            />
          </span>
        </span>

        <span className="flex p-4 gap-6 shadow-lg rounded-lg border items-center bg-white min-h-24">
          <span className="flex flex-col flex-auto">
            <h2 className="text-gray-600 text-lg font-semibold">
              Active Categories
            </h2>

            <h1 className="text-2xl text-primary font-bold">
              {isLoading ? "—" : activeCategories}
            </h1>
          </span>

          <span className="p-3 rounded-lg bg-amber-300">
            <MdCategory
              style={{
                color: "#d97706",
                fontSize: "24px",
              }}
            />
          </span>
        </span>
      </div>
    </div>
  );
}

export default InventoryStats;

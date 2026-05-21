import React, { useMemo, useState } from "react";
import { getStoredInventoryItems } from "./inventoryStorage";

function ItemLists() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const items = useMemo(() => {
    const storedItems = getStoredInventoryItems();

    const filteredItems = categoryFilter
      ? storedItems.filter((item) => item.category === categoryFilter)
      : storedItems;

    return [...filteredItems].sort((leftItem, rightItem) => {
      if (sortBy === "name-asc") {
        return leftItem.itemName.localeCompare(rightItem.itemName);
      }

      if (sortBy === "name-desc") {
        return rightItem.itemName.localeCompare(leftItem.itemName);
      }

      if (sortBy === "oldest") {
        return new Date(leftItem.createdAt) - new Date(rightItem.createdAt);
      }

      return new Date(rightItem.createdAt) - new Date(leftItem.createdAt);
    });
  }, [categoryFilter, sortBy]);

  return (
    <div className="flex flex-col rounded border-black shadow bg-white">
      <div className="flex gap-2 bg-secondary-container p-2 border-b-2 border-b-gray-600">
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="mt-1 block w-full border border-primary rounded-md p-2 text-primary font-medium"
        >
          <option className="text-primary font-medium" value="">
            All Categories
          </option>
          <option className="text-primary font-medium" value="Hardware">
            Hardware
          </option>
          <option className="text-primary font-medium" value="Network">
            Network
          </option>
          <option className="text-primary font-medium" value="Software">
            Software
          </option>
          <option className="text-primary font-medium" value="Consumables">
            Consumables
          </option>
        </select>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="mt-1 block w-full border border-primary rounded-md p-2 text-primary font-medium"
        >
          <option className="text-primary font-medium" value="latest">
            Sort By: Date Added (Newest)
          </option>
          <option className="text-primary font-medium" value="name-desc">
            Name (Z-A)
          </option>
          <option className="text-primary font-medium" value="name-asc">
            Name (A-Z)
          </option>
          <option className="text-primary font-medium" value="oldest">
            Date Added (Oldest)
          </option>
        </select>
      </div>

      <table className="w-full min-w-[720px] table-auto text-sm">
        <thead>
          <tr className="bg-secondary-container text-left text-xs tracking-wider text-primary font-medium">
            <th className="p-3">Code</th>
            <th className="p-3">Item Name</th>
            <th className="p-3">Category</th>
            <th className="p-3">Qty</th>
            <th className="p-3">Unit</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b last:border-b-0 hover:bg-gray-50"
            >
              <td className="p-3 font-medium text-primary">{item.itemCode}</td>
              <td className="p-3">{item.itemName}</td>
              <td className="p-3">{item.category}</td>
              <td className="p-3">{item.initialQty}</td>
              <td className="p-3">{item.unit}</td>
              <td className="p-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === "In Stock"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.status === "Low Stock"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ItemLists;

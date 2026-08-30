import React, { useMemo, useState } from "react";

function deriveStatus(currentStock, minimumStock) {
const stock = Number(currentStock) || 0;
const minimum = Number(minimumStock) || 0;

if (stock === 0) {
return "Out of Stock";
}

if (stock <= minimum) {
return "Low Stock";
}

return "In Stock";
}

function ItemLists({
items = [],
isLoading = false,
}) {
const [categoryFilter, setCategoryFilter] =
useState("");

const [sortBy, setSortBy] =
useState("latest");

const categories = useMemo(() => {
const unique = new Map();


for (const item of items) {
  if (item.category_id) {
    unique.set(
      item.category_id,
      item.category_name,
    );
  }
}

return Array.from(
  unique.entries(),
)
  .map(([id, name]) => ({
    id,
    name,
  }))
  .sort((a, b) =>
    a.name.localeCompare(b.name),
  );


}, [items]);

const filteredItems = useMemo(() => {
const filtered = categoryFilter
? items.filter(
(item) =>
item.category_id ===
categoryFilter,
)
: items;


return [...filtered].sort(
  (leftItem, rightItem) => {
    if (sortBy === "name-asc") {
      return leftItem.name.localeCompare(
        rightItem.name,
      );
    }

    if (sortBy === "name-desc") {
      return rightItem.name.localeCompare(
        leftItem.name,
      );
    }

    if (sortBy === "oldest") {
      return (
        new Date(leftItem.created_at) -
        new Date(rightItem.created_at)
      );
    }

    return (
      new Date(rightItem.created_at) -
      new Date(leftItem.created_at)
    );
  },
);


}, [
items,
categoryFilter,
sortBy,
]);

return ( <div className="flex flex-col rounded border-black shadow bg-white"> <div className="flex flex-col md:flex-row gap-2 bg-secondary-container p-2 border-b-2 border-b-gray-600">
<select
value={categoryFilter}
onChange={(event) =>
setCategoryFilter(
event.target.value,
)
}
className="mt-1 block w-full border border-primary rounded-md p-2 text-primary font-medium"
> <option value="">
All Categories </option>


      {categories.map((category) => (
        <option
          key={category.id}
          value={category.id}
        >
          {category.name}
        </option>
      ))}
    </select>

    <select
      value={sortBy}
      onChange={(event) =>
        setSortBy(event.target.value)
      }
      className="mt-1 block w-full border border-primary rounded-md p-2 text-primary font-medium"
    >
      <option value="latest">
        Sort By: Date Added (Newest)
      </option>

      <option value="name-desc">
        Name (Z-A)
      </option>

      <option value="name-asc">
        Name (A-Z)
      </option>

      <option value="oldest">
        Date Added (Oldest)
      </option>
    </select>
  </div>

  {isLoading ? (
    <div className="p-8 text-center text-sm text-slate-500">
      Loading inventory...
    </div>
  ) : filteredItems.length === 0 ? (
    <div className="p-8 text-center text-sm text-slate-500">
      {categoryFilter
        ? "No inventory items exist in this category."
        : "No inventory items found."}
    </div>
  ) : (
    <>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-secondary-container text-left text-xs tracking-wider text-primary font-medium">
                <th className="p-3">
                  Code
                </th>

                <th className="p-3">
                  Item Name
                </th>

                <th className="p-3">
                  Category
                </th>

                <th className="p-3">
                  Qty
                </th>

                <th className="p-3">
                  Unit
                </th>

                <th className="p-3">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.map(
                (item) => {
                  const status =
                    deriveStatus(
                      item.current_stock,
                      item.minimum_stock,
                    );

                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="p-3 font-medium text-primary">
                        {item.item_code}
                      </td>

                      <td className="p-3">
                        {item.name}
                      </td>

                      <td className="p-3">
                        {item.category_name}
                      </td>

                      <td className="p-3 font-semibold">
                        {item.current_stock}
                      </td>

                      <td className="p-3">
                        {item.unit}
                      </td>

                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            status ===
                            "In Stock"
                              ? "bg-emerald-100 text-emerald-700"
                              : status ===
                                  "Low Stock"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="block md:hidden p-2">
        <div className="space-y-3">
          {filteredItems.map(
            (item) => {
              const status =
                deriveStatus(
                  item.current_stock,
                  item.minimum_stock,
                );

              return (
                <div
                  key={item.id}
                  className="rounded-md border bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-primary font-medium truncate">
                        {item.name}
                      </div>

                      <div className="text-xs text-slate-500 truncate">
                        {item.item_code} •{" "}
                        {item.category_name}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">
                        {item.current_stock}{" "}
                        {item.unit}
                      </div>

                      <div className="mt-1">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            status ===
                            "In Stock"
                              ? "bg-emerald-100 text-emerald-700"
                              : status ===
                                  "Low Stock"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </>
  )}
</div>


);
}

export default ItemLists;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCircleInfo } from "react-icons/fa6";
import { FaClipboardCheck } from "react-icons/fa";
import { MdOutlineSettingsSuggest } from "react-icons/md";
import {
  buildInventoryItem,
  getStoredInventoryItems,
  saveStoredInventoryItems,
} from "./inventoryStorage";

function AddItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    itemName: "",
    itemCode: "",
    category: "Network",
    description: "",
    initialQty: 0,
    unit: "Units",
    minStock: 5,
    vendor: "",
    modelNumber: "",
    warranty: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]:
        name === "initialQty" || name === "minStock" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newItem = buildInventoryItem(form);
    const currentItems = getStoredInventoryItems();

    // Ensure the itemCode/id is unique to avoid duplicate React keys
    let uniqueItem = { ...newItem };
    const originalId = uniqueItem.id;
    let attempt = 0;
    while (currentItems.some((it) => it.id === uniqueItem.id)) {
      attempt += 1;
      const suffix = `${Date.now().toString().slice(-6)}${attempt > 1 ? `-${attempt}` : ""}`;
      const base =
        (form.itemCode || form.itemName || "ITEM").toString().trim() || "ITEM";
      const candidate = `${base}-${suffix}`;
      uniqueItem.itemCode = candidate;
      uniqueItem.id = candidate;
    }

    if (uniqueItem.id !== originalId) {
      console.info(
        `[Inventory] AddItem: resolved id collision, original="${originalId}", new="${uniqueItem.id}"`,
      );
    }

    saveStoredInventoryItems([...currentItems, uniqueItem]);
    navigate("/inventory", {
      state: {
        savedItemName: uniqueItem.itemName,
        savedItemCode: uniqueItem.itemCode,
      },
    });
  };

  const previewItemName = form.itemName.trim() || "New inventory item";
  const previewItemCode = form.itemCode.trim() || "Auto-generated code";
  const previewVendor = form.vendor.trim() || "Vendor not specified";

  return (
    <div className="flex flex-col lg:flex-row gap-6 px-4 py-4">
      <form
        onSubmit={handleSubmit}
        className="w-full lg:w-2/3 rounded-lg bg-white p-6 shadow"
      >
        <div className="mb-6 mt-0 bg-secondary-container p-2">
          <h2 className="text-2xl font-bold text-primary">Item Registration</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter the technical specifications and stock details for the new
            asset.
          </p>
        </div>

        <section className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-primary">
              <FaCircleInfo />
            </div>
            <h3 className="text-lg font-bold text-primary">
              Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block font-medium text-primary">
                Item Name
              </label>
              <input
                name="itemName"
                value={form.itemName}
                onChange={handleChange}
                placeholder="Cisco Catalyst 9200L"
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-primary">
                Item Code
              </label>
              <input
                name="itemCode"
                value={form.itemCode}
                onChange={handleChange}
                placeholder="ICT-2024-0882"
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-primary">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              >
                <option>Network</option>
                <option>Hardware</option>
                <option>Software</option>
                <option>Electrical</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block font-medium text-primary">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Briefly describe the item purpose and location..."
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              />
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-primary">
              <FaClipboardCheck />
            </div>
            <h3 className="font-bold text-primary">Stock Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary">
                Initial Quantity
              </label>
              <input
                type="number"
                name="initialQty"
                value={form.initialQty}
                onChange={handleChange}
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary">
                Unit
              </label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              >
                <option>Units</option>
                <option>Boxes</option>
                <option>Pieces</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary">
                Min. Stock Level
              </label>
              <input
                type="number"
                name="minStock"
                value={form.minStock}
                onChange={handleChange}
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              />
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-primary">
              <MdOutlineSettingsSuggest />
            </div>
            <h3 className="font-bold text-primary">Specifications</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary">
                Vendor/Manufacturer
              </label>
              <input
                name="vendor"
                value={form.vendor}
                onChange={handleChange}
                placeholder="Cisco Systems"
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary">
                Model Number
              </label>
              <input
                name="modelNumber"
                value={form.modelNumber}
                onChange={handleChange}
                placeholder="C9200L-24T-4G"
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary">
                Warranty Period
              </label>
              <input
                name="warranty"
                value={form.warranty}
                onChange={handleChange}
                placeholder="36 Months"
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="rounded border border-primary px-6 py-2 text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-primary font-bold px-6 py-2 text-white shadow"
          >
            Save Item
          </button>
        </div>
      </form>

      <aside className="w-full lg:w-1/3 space-y-4">
        <div className="rounded-lg bg-white pb-4 shadow pt-0">
          <h1 className="bg-primary p-3 text-lg font-bold text-white">
            LIVE PREVIEW
          </h1>

          <div className="flex items-start gap-3 p-4">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <h4 className="truncate text-xl font-bold text-primary">
                    {previewItemName}
                  </h4>
                  <div className="truncate text-xs text-primary">
                    {previewItemCode}
                  </div>
                </div>
              </div>

              <div className="mt-5 text-sm text-slate-600">
                <div className="flex justify-between border-b pb-3">
                  <span className="text-primary">Category</span>
                  <span className="font-semibold text-primary">
                    {form.category}
                  </span>
                </div>
                <div className="mt-3 flex justify-between gap-4 border-b pb-3">
                  <span className="text-primary">Manufacturer</span>
                  <span className="text-right font-semibold text-primary">
                    {previewVendor}
                  </span>
                </div>
                <div className="mt-3 flex justify-between border-b pb-3">
                  <span className="text-primary">Stock Level</span>
                  <span className="font-semibold text-primary">
                    {form.initialQty} {form.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AddItem;

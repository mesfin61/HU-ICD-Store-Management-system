import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCircleInfo } from "react-icons/fa6";
import { FaClipboardCheck } from "react-icons/fa";
import { MdOutlineSettingsSuggest } from "react-icons/md";

import { createInventoryItem } from "../../services/inventoryService";
import { getCategories } from "../../services/categoryService";

function AddItem() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    itemName: "",
    itemCode: "",
    categoryId: "",
    description: "",
    initialQty: 0,
    unit: "pcs",
    minStock: 5,
    vendor: "",
  });

  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        setCategoryLoading(true);
        setErrorMessage("");

        const data = await getCategories();

        if (mounted) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error(
          "[Inventory] load categories:",
          error,
        );

        if (mounted) {
          setErrorMessage(
            error.response?.data?.message ||
              "Failed to load inventory categories.",
          );
        }
      } finally {
        if (mounted) {
          setCategoryLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]:
        name === "initialQty" || name === "minStock"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (!form.itemName.trim()) {
      setErrorMessage("Item name is required.");
      return;
    }

    if (!form.itemCode.trim()) {
      setErrorMessage("Item code is required.");
      return;
    }

    if (!form.categoryId) {
      setErrorMessage("Please select a category.");
      return;
    }

    if (
      !Number.isInteger(form.initialQty) ||
      form.initialQty < 0
    ) {
      setErrorMessage(
        "Initial quantity must be a non-negative whole number.",
      );
      return;
    }

    if (
      !Number.isInteger(form.minStock) ||
      form.minStock < 0
    ) {
      setErrorMessage(
        "Minimum stock must be a non-negative whole number.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const createdItem =
        await createInventoryItem({
          itemCode: form.itemCode,
          name: form.itemName,
          categoryId: form.categoryId,
          description: form.description,
          unit: form.unit,
          minimumStock: form.minStock,
          initialQuantity: form.initialQty,
          isAsset: false,
          vendor: form.vendor,
          referenceNo: "",
          remarks: "",
        });

      navigate("/inventory", {
        state: {
          savedItemName: createdItem.name,
          savedItemCode: createdItem.item_code,
        },
      });
    } catch (error) {
      console.error(
        "[Inventory] AddItem:",
        error,
      );

      setErrorMessage(
        error.response?.data?.message ||
          "Failed to register inventory item.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === form.categoryId,
    )?.name || "No category selected";

  const previewItemName =
    form.itemName.trim() ||
    "New inventory item";

  const previewItemCode =
    form.itemCode.trim() ||
    "Enter item code";

  const previewVendor =
    form.vendor.trim() ||
    "Vendor not specified";

  return (
    <div className="flex flex-col lg:flex-row gap-6 px-4 py-4">
      <form
        onSubmit={handleSubmit}
        className="w-full lg:w-2/3 rounded-lg bg-white p-6 shadow"
      >
        <div className="mb-6 mt-0 bg-secondary-container p-2">
          <h2 className="text-2xl font-bold text-primary">
            Item Registration
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Register a new inventory item in the store database.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

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
                required
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
                required
                placeholder="ICT-2024-0882"
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-medium text-primary">
                Category
              </label>

              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
                disabled={categoryLoading}
                className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
              >
                <option value="">
                  {categoryLoading
                    ? "Loading categories..."
                    : "Select a category"}
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
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
                placeholder="Briefly describe the item."
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

            <h3 className="font-bold text-primary">
              Stock Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary">
                Initial Quantity
              </label>

              <input
                type="number"
                min="0"
                step="1"
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
                <option value="pcs">Pieces</option>
                <option value="boxes">Boxes</option>
                <option value="units">Units</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary">
                Minimum Stock Level
              </label>

              <input
                type="number"
                min="0"
                step="1"
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

            <h3 className="font-bold text-primary">
              Supplier Information
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary">
              Vendor / Manufacturer
            </label>

            <input
              name="vendor"
              value={form.vendor}
              onChange={handleChange}
              placeholder="Cisco Systems"
              className="mt-1 block w-full rounded border px-3 py-2 text-primary bg-slate-50"
            />
          </div>
        </section>

        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            disabled={isSubmitting}
            className="rounded border border-primary px-6 py-2 text-primary disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              categoryLoading
            }
            className="rounded bg-primary font-bold px-6 py-2 text-white shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving..."
              : "Save Item"}
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
                  <span className="text-primary">
                    Category
                  </span>

                  <span className="font-semibold text-primary">
                    {selectedCategory}
                  </span>
                </div>

                <div className="mt-3 flex justify-between gap-4 border-b pb-3">
                  <span className="text-primary">
                    Manufacturer
                  </span>

                  <span className="text-right font-semibold text-primary">
                    {previewVendor}
                  </span>
                </div>

                <div className="mt-3 flex justify-between border-b pb-3">
                  <span className="text-primary">
                    Stock Level
                  </span>

                  <span className="font-semibold text-primary">
                    {form.initialQty}{" "}
                    {form.unit}
                  </span>
                </div>

                <div className="mt-3 flex justify-between">
                  <span className="text-primary">
                    Minimum Stock
                  </span>

                  <span className="font-semibold text-primary">
                    {form.minStock}{" "}
                    {form.unit}
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
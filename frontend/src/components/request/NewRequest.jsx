import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRequest } from "../../services/requestService";
import { getInventoryItems } from "../../services/inventoryService";

function NewRequest() {
  const navigate = useNavigate();

  const [inventoryItems, setInventoryItems] = useState([]);

  const [inventoryLoading, setInventoryLoading] = useState(true);

  const [submitError, setSubmitError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    purpose: "",
    itemId: "",
    quantity: "",
  });

  useEffect(() => {
    let mounted = true;

    const loadInventory = async () => {
      try {
        setInventoryLoading(true);
        setSubmitError("");

        const data = await getInventoryItems();

        if (mounted) {
          setInventoryItems(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("[Request] load inventory:", error);

        if (mounted) {
          setSubmitError(
            error.response?.data?.message || "Failed to load inventory.",
          );
        }
      } finally {
        if (mounted) {
          setInventoryLoading(false);
        }
      }
    };

    loadInventory();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "quantity" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitError("");

    const selectedItem = inventoryItems.find(
      (item) => item.id === form.itemId,
    );

    if (!form.purpose.trim()) {
      setSubmitError("A reason for the request is required.");
      return;
    }

    if (!form.itemId) {
      setSubmitError("Please select an inventory item.");
      return;
    }

    if (!Number.isInteger(form.quantity) || form.quantity <= 0) {
      setSubmitError("Quantity must be a positive whole number.");
      return;
    }

    if (selectedItem && form.quantity > Number(selectedItem.current_stock)) {
      setSubmitError(
        `Quantity cannot exceed the available stock of ${selectedItem.current_stock} ${selectedItem.unit}.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await createRequest({
        purpose: form.purpose.trim(),

        items: [
          {
            itemId: form.itemId,
            quantity: form.quantity,
          },
        ],
      });

      navigate("/requests");
    } catch (error) {
      console.error("[Request] create request:", error);

      setSubmitError(
        error.response?.data?.message || "Failed to submit request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-primary">
              New Supply Request
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Submit a request for inventory from the store.
            </p>
          </div>

          {submitError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {submitError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Inventory Item
              </span>

              <select
                name="itemId"
                value={form.itemId}
                onChange={handleChange}
                required
                disabled={inventoryLoading || isSubmitting}
                className="rounded-lg border border-gray-300 bg-slate-50 px-4 py-3 text-primary outline-none transition focus:border-blue-500"
              >
                <option value="">
                  {inventoryLoading ? "Loading inventory..." : "Select an item"}
                </option>

                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_code} — {item.name} ({item.current_stock}{" "}
                    {item.unit} available)
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Quantity
              </span>

              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="1"
                max={
                  inventoryItems.find((item) => item.id === form.itemId)
                    ?.current_stock
                }
                step="1"
                required
                disabled={isSubmitting}
                className="rounded-lg border border-gray-300 bg-slate-50 px-4 py-3 text-primary outline-none transition focus:border-blue-500"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Availability
              </span>

              <div className="flex h-full items-center rounded-lg border border-gray-200 bg-slate-50 px-4 py-3">
                {(() => {
                  const item = inventoryItems.find(
                    (entry) => entry.id === form.itemId,
                  );

                  if (!item) {
                    return (
                      <span className="text-sm text-slate-500">
                        Select an item
                      </span>
                    );
                  }

                  return (
                    <span className="text-sm font-semibold text-primary">
                      {item.current_stock} {item.unit} available
                    </span>
                  );
                })()}
              </div>
            </div>

            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-semibold uppercase text-primary">
                Request Purpose
              </span>

              <textarea
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                required
                rows={5}
                disabled={isSubmitting}
                placeholder="Explain why the inventory is needed."
                className="rounded-lg border border-gray-300 bg-slate-50 px-4 py-3 text-primary outline-none transition focus:border-blue-500"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={() => navigate("/requests")}
              disabled={isSubmitting}
              className="rounded-md border border-primary px-6 py-3 text-sm font-semibold text-primary disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={inventoryLoading || isSubmitting}
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewRequest;

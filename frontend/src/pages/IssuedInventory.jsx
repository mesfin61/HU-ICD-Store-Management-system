import React, { useEffect, useState } from "react";

import ReturnInventoryModal from "../components/request/ReturnInventoryModal";

import { getOutstandingIssuedItems } from "../services/issuanceService";

function IssuedInventory() {
  const [issuedItems, setIssuedItems] = useState([]);

  const [selectedIssuedItem, setSelectedIssuedItem] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const loadIssuedItems = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getOutstandingIssuedItems();

      setIssuedItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[IssuedInventory] load:", error);

      setErrorMessage(
        error.response?.data?.message || "Failed to load issued inventory.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIssuedItems();
  }, []);

  const handleReturnSuccess = async () => {
    setSelectedIssuedItem(null);
    await loadIssuedItems();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) {
      return false;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDate);

    due.setHours(0, 0, 0, 0);

    return due < today;
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-primary">Issued Inventory</h1>

        <p className="text-sm font-semibold text-primary">
          Monitor inventory currently issued to departments and process returns
          when equipment is physically returned.
        </p>
      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {/* =====================================================
          LOADING
          ===================================================== */}

      {isLoading ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-slate-500">
          Loading issued inventory...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white shadow-sm">
          <table className="w-full min-w-[950px] text-sm">
            <thead>
              <tr className="bg-secondary-container text-left text-xs font-semibold uppercase tracking-wider text-primary">
                <th className="p-3">Item</th>

                <th className="p-3">Recipient</th>

                <th className="p-3">Department</th>

                <th className="p-3">Issued</th>

                <th className="p-3">Returned</th>

                <th className="p-3">Remaining</th>

                <th className="p-3">Issued Date</th>

                <th className="p-3">Due Date</th>

                <th className="p-3">Status</th>

                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {issuedItems.length > 0 ? (
                issuedItems.map((item) => {
                  const overdue = isOverdue(item.due_date);

                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0 hover:bg-slate-50"
                    >
                      {/* ITEM */}

                      <td className="p-3">
                        <div className="font-semibold text-primary">
                          {item.item_name}
                        </div>

                        <div className="text-xs text-slate-500">
                          {item.item_code}
                        </div>
                      </td>

                      {/* RECIPIENT */}

                      <td className="p-3">{item.issued_to_name}</td>

                      {/* DEPARTMENT */}

                      <td className="p-3">{item.department_name}</td>

                      {/* ISSUED */}

                      <td className="p-3 font-semibold text-primary">
                        {item.quantity_issued} {item.unit}
                      </td>

                      {/* RETURNED */}

                      <td className="p-3">
                        {item.quantity_returned} {item.unit}
                      </td>

                      {/* REMAINING */}

                      <td className="p-3 font-bold text-primary">
                        {item.quantity_remaining} {item.unit}
                      </td>

                      {/* ISSUED DATE */}

                      <td className="p-3">
                        {item.issued_date
                          ? new Date(item.issued_date).toLocaleDateString()
                          : "—"}
                      </td>

                      {/* DUE DATE */}

                      <td className="p-3">
                        {item.due_date
                          ? new Date(item.due_date).toLocaleDateString()
                          : "—"}
                      </td>

                      {/* STATUS */}

                      <td className="p-3">
                        {overdue ? (
                          <span className="inline-flex rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            OVERDUE
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            ISSUED
                          </span>
                        )}
                      </td>

                      {/* ACTION */}

                      <td className="p-3">
                        {item.quantity_remaining > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedIssuedItem(item)}
                            className="rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            Return Inventory
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Fully returned
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="p-10 text-center text-sm text-slate-500"
                  >
                    No inventory is currently issued.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================
          RETURN MODAL
          ===================================================== */}

      {selectedIssuedItem && (
        <ReturnInventoryModal
          issuedItem={selectedIssuedItem}
          onClose={() => setSelectedIssuedItem(null)}
          onSuccess={handleReturnSuccess}
        />
      )}
    </div>
  );
}

export default IssuedInventory;

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaDownload, FaFilePdf, FaTimes } from "react-icons/fa";
import ReportGeneratedModal from "./ReportGeneratedModal";
import apiClient from "../../services/apiClient";

const fieldClass =
  "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function formatPreviewDate(value) {
  if (!value) return "";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value).slice(0, 10);
  }

  return parsedDate.toISOString().slice(0, 10);
}

function DateField({ label, placeholder, value, onChange, error }) {
  const handleChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 8);

    const month = digits.slice(0, 2);
    const day = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    const parts = [];

    if (digits.length > 0) {
      parts.push(month);
    }

    if (digits.length > 2) {
      parts.push(day);
    }

    if (digits.length > 4) {
      parts.push(year);
    }

    onChange(parts.join("/"));
  };

  return (
    <div className="w-full">
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label} <span className="text-rose-500">*</span>
      </label>

      <div className="relative">
        <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

        <input
          type="text"
          placeholder={placeholder}
          className={`${fieldClass} pl-9 pr-9`}
          inputMode="numeric"
          maxLength={10}
          value={value}
          onChange={handleChange}
        />

        <FaCalendarAlt className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
      </div>

      {error && <p className="mt-1 text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}

function OutputFormatButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-medium transition ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {children}
    </button>
  );
}

function GenerateReportModal({ isOpen = true, onClose }) {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState("");

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const [formValues, setFormValues] = useState({
    reportType: "",
    startDate: "",
    endDate: "",
    categoryFilter: "",
    outputFormat: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const successTimerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    let mounted = true;

    async function loadInventoryPreview() {
      try {
        setLoadingInventory(true);
        setInventoryError("");

        const response = await apiClient.get("/api/inventory");

        if (!mounted) return;

        const items = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setInventory(items);
      } catch (loadError) {
        console.error(
          "[GenerateReportModal] Failed to load inventory preview:",
          loadError,
        );

        if (mounted) {
          setInventoryError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Failed to load inventory preview.",
          );
        }
      } finally {
        if (mounted) {
          setLoadingInventory(false);
        }
      }
    }

    loadInventoryPreview();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const previewRows = inventory.slice(0, 3).map((item) => ({
    itemName: item.name || item.itemName || item.item_code || "Unknown Item",

    category: item.category_name || item.category || "Uncategorized",

    qty: Number(item.current_stock) || 0,

    date: formatPreviewDate(item.created_at || item.createdAt),
  }));

  const categories = [
    ...new Set(
      inventory
        .map((item) =>
          String(item.category_name || item.category || "Uncategorized").trim(),
        )
        .filter(Boolean),
    ),
  ];

  const handleClose = (navState) => {
    const isEvent =
      navState &&
      typeof navState === "object" &&
      ("nativeEvent" in navState || "preventDefault" in navState);

    const safeState = isEvent ? {} : navState;

    navigate("/reports", {
      replace: true,
      state: safeState,
    });
  };

  const handleGenerate = () => {
    const nextErrors = {};

    if (!formValues.reportType) {
      nextErrors.reportType = "Report type is required.";
    }

    if (!formValues.startDate) {
      nextErrors.startDate = "Start date is required.";
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formValues.startDate)) {
      nextErrors.startDate = "Use the mm/dd/yyyy format.";
    }

    if (!formValues.endDate) {
      nextErrors.endDate = "End date is required.";
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formValues.endDate)) {
      nextErrors.endDate = "Use the mm/dd/yyyy format.";
    }

    if (!formValues.categoryFilter) {
      nextErrors.categoryFilter = "Category filter is required.";
    }

    if (!formValues.outputFormat) {
      nextErrors.outputFormat = "Output format is required.";
    }

    setFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setShowSuccessBanner(true);
  };

  if (!isOpen) {
    return null;
  }

  if (showSuccessBanner) {
    return (
      <ReportGeneratedModal
        onClose={handleClose}
        onGenerateAnother={() => setShowSuccessBanner(false)}
        data={{
          reportType: formValues.reportType || "Inventory Summary",

          dateRange: `${formValues.startDate} - ${formValues.endDate}`,

          category: formValues.categoryFilter || "All Categories",

          format: (formValues.outputFormat || "PDF").toUpperCase(),
        }}
        previewRows={previewRows}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-[2px]">
      <div className="relative w-full max-w-[620px] overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
          aria-label="Close report modal"
        >
          <FaTimes className="text-sm" />
        </button>

        <div className="border-b border-slate-200 px-6 py-5 pr-14">
          <h2 className="text-xl font-semibold text-blue-900">
            Generate Report
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create and export inventory reports
          </p>
        </div>

        <div className="px-6 py-5">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Report Type <span className="text-rose-500">*</span>
              </label>

              <select
                className={fieldClass}
                value={formValues.reportType}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    reportType: event.target.value,
                  }))
                }
              >
                <option value="">Select report type</option>
                <option>Inventory Summary</option>
                <option>Procurement Summary</option>
                <option>Consumption Summary</option>
              </select>

              {formErrors.reportType && (
                <p className="mt-1 text-[11px] text-rose-600">
                  {formErrors.reportType}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateField
                label="Start Date"
                placeholder="mm/dd/yyyy"
                value={formValues.startDate}
                onChange={(nextValue) =>
                  setFormValues((current) => ({
                    ...current,
                    startDate: nextValue,
                  }))
                }
                error={formErrors.startDate}
              />

              <DateField
                label="End Date"
                placeholder="mm/dd/yyyy"
                value={formValues.endDate}
                onChange={(nextValue) =>
                  setFormValues((current) => ({
                    ...current,
                    endDate: nextValue,
                  }))
                }
                error={formErrors.endDate}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Category Filter <span className="text-rose-500">*</span>
                </label>

                <select
                  className={fieldClass}
                  value={formValues.categoryFilter}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      categoryFilter: event.target.value,
                    }))
                  }
                >
                  <option value="">All Categories</option>

                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                {formErrors.categoryFilter && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {formErrors.categoryFilter}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Output Format <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-3 gap-2 rounded-md bg-slate-100 p-1">
                  <OutputFormatButton
                    active={formValues.outputFormat === "pdf"}
                    onClick={() =>
                      setFormValues((current) => ({
                        ...current,
                        outputFormat: "pdf",
                      }))
                    }
                  >
                    <FaFilePdf className="text-[11px]" />
                    PDF
                  </OutputFormatButton>

                  <OutputFormatButton
                    active={formValues.outputFormat === "csv"}
                    onClick={() =>
                      setFormValues((current) => ({
                        ...current,
                        outputFormat: "csv",
                      }))
                    }
                  >
                    <span className="text-[11px] font-semibold">CSV</span>
                  </OutputFormatButton>

                  <OutputFormatButton
                    active={formValues.outputFormat === "excel"}
                    onClick={() =>
                      setFormValues((current) => ({
                        ...current,
                        outputFormat: "excel",
                      }))
                    }
                  >
                    <span className="text-[11px] font-semibold">Excel</span>
                  </OutputFormatButton>
                </div>

                {formErrors.outputFormat && (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {formErrors.outputFormat}
                  </p>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 text-xs text-slate-500">
                <span>Preview (First 3 Records)</span>

                <span className="text-slate-400">Database</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-white text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-2 font-semibold">Item Name</th>
                      <th className="px-4 py-2 font-semibold">Category</th>
                      <th className="px-4 py-2 font-semibold">Qty</th>
                      <th className="px-4 py-2 font-semibold">Date</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white text-slate-700">
                    {loadingInventory ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          Loading inventory...
                        </td>
                      </tr>
                    ) : inventoryError ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-rose-600"
                        >
                          {inventoryError}
                        </td>
                      </tr>
                    ) : previewRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          No inventory records yet.
                        </td>
                      </tr>
                    ) : (
                      previewRows.map((row) => (
                        <tr
                          key={`${row.itemName}-${row.date}`}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="px-4 py-2 font-medium text-slate-600">
                            {row.itemName}
                          </td>

                          <td className="px-4 py-2">{row.category}</td>

                          <td className="px-4 py-2">{row.qty}</td>

                          <td className="px-4 py-2">{row.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-blue-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-[0_1px_0_rgba(255,255,255,0.7)] transition hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-md bg-blue-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-950"
          >
            <FaDownload className="text-xs" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenerateReportModal;

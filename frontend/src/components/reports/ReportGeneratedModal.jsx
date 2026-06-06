import React, { useEffect } from "react";
import {
  FaDownload,
  FaFilePdf,
  FaRegCheckCircle,
  FaEye,
  FaTimes,
} from "react-icons/fa";

export default function ReportGeneratedModal({
  onClose,
  onGenerateAnother,
  data = {},
  previewRows = [],
}) {
  const {
    reportType = "Inventory Summary",
    dateRange = "May 1, 2024 - May 30, 2024",
    category = "All Categories",
    format = "PDF",
  } = data;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function escapeCSV(value) {
    if (value == null) return "";
    const str = String(value);
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function generateCSV(rows) {
    const headers = ["Item Name", "Category", "Quantity", "Date"];
    const lines = [headers.join(",")];
    (rows || []).forEach((r) => {
      lines.push(
        [
          escapeCSV(r.itemName),
          escapeCSV(r.category),
          escapeCSV(r.qty),
          escapeCSV(r.date),
        ].join(","),
      );
    });
    return lines.join("\n");
  }

  function handleDownload() {
    // CSV/Excel -> download CSV file; PDF -> open printable view
    const targetFormat = (format || "PDF").toLowerCase();
    if (targetFormat === "pdf") {
      handleView();
      return;
    }

    const csv = generateCSV(previewRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = targetFormat === "excel" ? "csv" : "csv";
    a.download = `${reportType.replace(/\s+/g, "_")}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (onClose) onClose({ downloaded: true });
  }

  function handleView() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${reportType}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Inter,system-ui,Arial,Helvetica,sans-serif;padding:24px;color:#0f172a}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{padding:10px;border:1px solid #e6edf3;text-align:left}th{background:#f8fafc;color:#475569;font-weight:700}</style></head><body><h1>${reportType}</h1><p style="color:#64748b">${dateRange} — ${category} — ${format}</p><table><thead><tr><th>Item Name</th><th>Category</th><th>Quantity</th><th>Date</th></tr></thead><tbody>${(previewRows || []).map((r) => `<tr><td>${r.itemName}</td><td>${r.category}</td><td>${r.qty}</td><td>${r.date}</td></tr>`).join("")}</tbody></table></body></html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    if (onClose) onClose({ viewed: true });
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-[680px] rounded-xl bg-white shadow-[0_30px_80px_rgba(2,6,23,0.35)] z-[10000] overflow-auto mx-4"
        style={{ maxHeight: "calc(100vh - 4vh)" }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Generate Report
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"
          >
            <FaTimes />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FaRegCheckCircle className="text-2xl" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">
              Report Generated Successfully
            </h4>
            <p className="text-sm text-slate-500">
              Your report is ready to download or view in your browser.
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-500">
                  REPORT TYPE
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {reportType}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-500">
                  DATE RANGE
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {dateRange}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-500">
                  CATEGORY
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {category}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-500">
                  FORMAT
                </div>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FaFilePdf className="text-sm text-rose-600" />
                  <span>{format}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="px-4 py-3 text-xs text-slate-500">
              REPORT DATA PREVIEW
            </div>
            <div className="overflow-x-auto px-4 pb-4">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-2 font-semibold">Item Name</th>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 font-semibold">Quantity</th>
                    <th className="px-3 py-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {previewRows.length ? (
                    previewRows.map((r) => (
                      <tr
                        key={r.itemName}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-3 py-2 font-medium text-slate-600">
                          {r.itemName}
                        </td>
                        <td className="px-3 py-2">{r.category}</td>
                        <td className="px-3 py-2">
                          {r.qty} {r.qty && r.qty + " Units"}
                        </td>
                        <td className="px-3 py-2">{r.date}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No preview available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded bg-[#0b4a8b] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#083c71]"
              >
                <FaDownload />
                Download Report
              </button>
              <button
                onClick={handleView}
                className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FaEye />
                View Report
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() =>
                  onGenerateAnother ? onGenerateAnother() : onClose && onClose()
                }
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Generate Another Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

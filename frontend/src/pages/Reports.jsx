import React, { useEffect, useMemo, useState } from "react";
import { FaDownload, FaFileAlt, FaPrint, FaSyncAlt } from "react-icons/fa";
import PageTransition from "../animated_motion/PageTransition";
import apiClient from "../services/apiClient";
import { useUser } from "../context/AuthContext";

const REPORTS = {
  inventory: {
    label: "Inventory",
    endpoint: "/api/reports/inventory",
    description: "Current stock levels, low-stock items, and movement totals.",
  },
  transactions: {
    label: "Transactions",
    endpoint: "/api/reports/transactions",
    description: "Every receipt, issue, return, adjustment, and write-off.",
  },
  issuances: {
    label: "Issuances",
    endpoint: "/api/reports/issuances",
    description: "Inventory issued to staff and outstanding returns.",
  },
  returns: {
    label: "Returns",
    endpoint: "/api/reports/returns",
    description: "Returned inventory and recorded item conditions.",
  },
  requests: {
    label: "Requests",
    endpoint: "/api/reports/requests",
    description: "Request volume, approval progress, and issued quantities.",
  },
};

const STORE_MANAGER_REPORTS = ["inventory", "transactions", "issuances", "returns"];

const tableColumns = {
  inventory: [
    ["item_code", "Code"],
    ["name", "Item"],
    ["category_name", "Category"],
    ["current_stock", "Current stock"],
    ["minimum_stock", "Minimum"],
    ["inbound_quantity", "Inbound"],
    ["outbound_quantity", "Outbound"],
  ],
  transactions: [
    ["transaction_date", "Date"],
    ["transaction_type", "Type"],
    ["item_name", "Item"],
    ["quantity", "Quantity"],
    ["performed_by", "Performed by"],
    ["reference_no", "Reference"],
  ],
  requests: [
    ["requested_at", "Date"],
    ["requester", "Requester"],
    ["department_name", "Department"],
    ["status", "Status"],
    ["quantity_requested", "Requested"],
    ["quantity_approved", "Approved"],
    ["quantity_issued", "Issued"],
  ],
  issuances: [
    ["issued_date", "Issued"],
    ["item_name", "Item"],
    ["issued_to", "Issued to"],
    ["quantity", "Quantity"],
    ["due_date", "Due date"],
    ["returned", "Returned"],
  ],
  returns: [
    ["return_date", "Date"],
    ["item_name", "Item"],
    ["issued_to", "Issued to"],
    ["quantity_returned", "Quantity"],
    ["condition_status", "Condition"],
    ["remarks", "Remarks"],
  ],
};

const filterClass =
  "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function formatValue(value, key) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key.endsWith("_date") || key === "requested_at" || key === "transaction_date") {
    return new Date(value).toLocaleDateString();
  }
  return String(value);
}

function csvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[,\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function ReportTable({ reportType, rows }) {
  const columns = tableColumns[reportType];

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 px-4 py-14 text-center text-sm text-slate-500">
        No records match the selected filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map(([, label]) => (
              <th key={label} className="whitespace-nowrap px-4 py-3 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
          {rows.map((row, index) => (
            <tr key={row.id || `${reportType}-${index}`} className="hover:bg-slate-50">
              {columns.map(([key]) => (
                <td key={key} className="whitespace-nowrap px-4 py-3">
                  {formatValue(row[key], key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const { user } = useUser();
  const isDirectorate = user?.role === "Directorate";
  const availableReportTypes = isDirectorate ? ["requests"] : STORE_MANAGER_REPORTS;
  const [reportType, setReportType] = useState(availableReportTypes[0]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    transactionType: "",
    status: "",
    returned: "",
    conditionStatus: "",
  });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const report = REPORTS[reportType];

  useEffect(() => {
    if (!availableReportTypes.includes(reportType)) {
      setReportType(availableReportTypes[0]);
    }
  }, [availableReportTypes, reportType]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  async function loadReport() {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(
        `${REPORTS[reportType].endpoint}${queryString ? `?${queryString}` : ""}`,
      );
      setRows(Array.isArray(response.data?.data) ? response.data.data : []);
      setSummary(response.data?.summary || {});
    } catch (loadError) {
      setRows([]);
      setSummary({});
      setError(
        loadError.response?.data?.message || "Unable to load this report.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user && availableReportTypes.includes(reportType)) loadReport();
  }, [user, reportType]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function downloadCsv() {
    const columns = tableColumns[reportType];
    const csv = [
      columns.map(([, label]) => csvValue(label)).join(","),
      ...rows.map((row) => columns.map(([key]) => csvValue(row[key])).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${reportType}-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageTransition>
      <div className="space-y-5 px-4 py-2 print:p-0">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Store intelligence
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Reports</h1>
            <p className="mt-1 text-sm text-slate-500">{report.description}</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button type="button" onClick={loadReport} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button type="button" onClick={downloadCsv} disabled={!rows.length} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
              <FaDownload /> CSV
            </button>
            <button type="button" onClick={() => window.print()} disabled={!rows.length} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <FaPrint /> Print
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 print:hidden">
          {availableReportTypes.map((type) => (
            <button key={type} type="button" onClick={() => setReportType(type)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold ${reportType === type ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
              {REPORTS[type].label}
            </button>
          ))}
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm print:hidden">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FaFileAlt className="text-blue-600" /> Report filters
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold text-slate-500">From<input type="date" name="startDate" value={filters.startDate} onChange={updateFilter} className={`${filterClass} mt-1 block w-full`} /></label>
            <label className="text-xs font-semibold text-slate-500">To<input type="date" name="endDate" value={filters.endDate} onChange={updateFilter} className={`${filterClass} mt-1 block w-full`} /></label>
            {reportType === "transactions" && <label className="text-xs font-semibold text-slate-500">Transaction type<select name="transactionType" value={filters.transactionType} onChange={updateFilter} className={`${filterClass} mt-1 block w-full`}><option value="">All types</option><option value="RECEIPT">Receipt</option><option value="ISSUE">Issue</option><option value="RETURN">Return</option><option value="ADJUSTMENT_IN">Adjustment in</option><option value="ADJUSTMENT_OUT">Adjustment out</option><option value="WRITE_OFF">Write-off</option></select></label>}
            {reportType === "requests" && <label className="text-xs font-semibold text-slate-500">Status<select name="status" value={filters.status} onChange={updateFilter} className={`${filterClass} mt-1 block w-full`}><option value="">All statuses</option><option>PENDING</option><option>APPROVED</option><option>PARTIALLY_APPROVED</option><option>REJECTED</option><option>FULFILLED</option><option>CANCELLED</option></select></label>}
            {reportType === "issuances" && <label className="text-xs font-semibold text-slate-500">Return status<select name="returned" value={filters.returned} onChange={updateFilter} className={`${filterClass} mt-1 block w-full`}><option value="">All issuances</option><option value="false">Outstanding</option><option value="true">Returned</option></select></label>}
            {reportType === "returns" && <label className="text-xs font-semibold text-slate-500">Condition<select name="conditionStatus" value={filters.conditionStatus} onChange={updateFilter} className={`${filterClass} mt-1 block w-full`}><option value="">All conditions</option><option>GOOD</option><option>DAMAGED</option><option>PARTIAL</option></select></label>}
          </div>
          <button type="button" onClick={loadReport} className="mt-4 h-10 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">Apply filters</button>
        </section>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Object.entries(summary).slice(0, 4).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key.replace(/([A-Z])/g, " $1")}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">{report.label} report</h2><span className="text-sm text-slate-500">{loading ? "Loading..." : `${rows.length} records`}</span></div>
          {loading ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-14 text-center text-sm text-slate-500">Loading report data...</div> : <ReportTable reportType={reportType} rows={rows} />}
        </section>
      </div>
    </PageTransition>
  );
}

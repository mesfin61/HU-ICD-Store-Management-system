import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaFilePdf } from "react-icons/fa";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import apiClient from "../../services/apiClient";

const fieldClass =
  "h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white";

function CustomReportCard({
  categories,
  departments,
  loading,
  error,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <div className="mb-4 text-sm font-semibold text-slate-800">
        Generate Custom Report
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-400">
            Item Category
          </label>

          <select className={fieldClass} defaultValue="All Categories">
            <option>All Categories</option>

            {!loading &&
              !error &&
              categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-400">
            Department
          </label>

          <select className={fieldClass} defaultValue="All Departments">
            <option>All Departments</option>

            {!loading &&
              !error &&
              departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-400">
            Report Frequency
          </label>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              className="h-8 rounded border border-slate-300 bg-white text-[11px] font-medium text-slate-700"
            >
              Daily
            </button>

            <button
              type="button"
              className="h-8 rounded border border-blue-600 bg-blue-50 text-[11px] font-semibold text-blue-700"
            >
              Monthly
            </button>

            <button
              type="button"
              className="h-8 rounded border border-slate-300 bg-white text-[11px] font-medium text-slate-700"
            >
              Annual
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {error}
          </div>
        )}

        <Link
          to="/generate-report"
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-blue-700 bg-blue-700 text-xs font-semibold uppercase tracking-wide text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-blue-800"
        >
          <FaFilePdf className="text-sm" />
          Generate PDF Report
        </Link>
      </div>
    </div>
  );
}

function ReportOverviewPanel() {
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadReportOverviewData() {
      try {
        setLoading(true);
        setError("");

        const [inventoryResponse, requestsResponse] =
          await Promise.all([
            apiClient.get("/api/inventory"),
            apiClient.get("/api/requests"),
          ]);

        if (!mounted) return;

        const inventoryData = Array.isArray(inventoryResponse.data?.data)
          ? inventoryResponse.data.data
          : [];

        const requestData = Array.isArray(requestsResponse.data?.data)
          ? requestsResponse.data.data
          : [];

        setInventory(inventoryData);
        setRequests(requestData);
      } catch (loadError) {
        console.error(
          "[ReportOverviewPanel] Failed to load report overview data:",
          loadError,
        );

        if (mounted) {
          setError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Failed to load report overview data.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReportOverviewData();

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    return [
      ...new Set(
        inventory
          .map(
            (item) =>
              String(
                item.category_name ||
                  item.category ||
                  "Uncategorized",
              ).trim(),
          )
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [inventory]);

  const departments = useMemo(() => {
    return [
      ...new Set(
        requests
          .map(
            (request) =>
              String(
                request.department_name ||
                  request.department ||
                  "Unknown Department",
              ).trim(),
          )
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [requests]);

  const chartData = useMemo(() => {
    const categoryMap = inventory.reduce(
      (accumulator, item) => {
        const category = String(
          item.category_name ||
            item.category ||
            "Uncategorized",
        ).trim();

        const quantity = Number(item.current_stock) || 0;

        accumulator[category] =
          (accumulator[category] || 0) + quantity;

        return accumulator;
      },
      {},
    );

    return Object.entries(categoryMap)
      .map(([category, units]) => ({
        category,
        units,
      }))
      .sort((left, right) => right.units - left.units);
  }, [inventory]);

  return (
    <section className="w-full">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Stock Distribution by Category
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Current stock quantity from the inventory database.
              </p>
            </div>
          </div>

          <div className="h-[220px] w-full px-1 pt-1">
            {loading ? (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
                Loading report data...
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 text-center text-sm text-red-700">
                {error}
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 25,
                  }}
                  barCategoryGap="18%"
                >
                  <XAxis
                    dataKey="category"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tick={{
                      fill: "#64748b",
                      fontSize: 9,
                    }}
                    angle={-25}
                    textAnchor="end"
                    dy={8}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#64748b",
                      fontSize: 9,
                    }}
                    width={35}
                  />

                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    formatter={(value) => [
                      Number(value).toLocaleString(),
                      "Current Stock",
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: "#e2e8f0",
                      fontSize: 12,
                    }}
                  />

                  <Bar
                    dataKey="units"
                    name="Current Stock"
                    fill="#0B4A8B"
                    radius={[4, 4, 0, 0]}
                    barSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
                No inventory data yet.
              </div>
            )}
          </div>
        </div>

        <CustomReportCard
          categories={categories}
          departments={departments}
          loading={loading}
          error={error}
        />
      </div>
    </section>
  );
}

export default ReportOverviewPanel;
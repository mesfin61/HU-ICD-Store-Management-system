import React from "react";
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

const chartData = [
  { department: "Computer Science", units: 68 },
  { department: "Engineering", units: 56 },
  { department: "Administration", units: 92 },
  { department: "Medicine", units: 38 },
  { department: "Agriculture", units: 62 },
];

const fieldClass =
  "w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white";

function CustomReportCard() {
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
            <option>Consumables</option>
            <option>Equipment</option>
            <option>Office Supplies</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-400">
            Department
          </label>
          <select className={fieldClass} defaultValue="All Departments">
            <option>All Departments</option>
            <option>Computer Science</option>
            <option>Engineering</option>
            <option>Administration</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-400">
            Report Frequency
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button className="h-8 rounded border border-slate-300 bg-white text-[11px] font-medium text-slate-700">
              Daily
            </button>
            <button className="h-8 rounded border border-blue-600 bg-blue-50 text-[11px] font-semibold text-blue-700">
              Monthly
            </button>
            <button className="h-8 rounded border border-slate-300 bg-white text-[11px] font-medium text-slate-700">
              Annual
            </button>
          </div>
        </div>

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
  return (
    <section className="w-full">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Stock Consumption by Department
            </h2>
          </div>

          <div className="h-[175px] w-full px-1 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                barCategoryGap="0%"
                barGap={0}
              >
                <XAxis
                  dataKey="department"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  dy={8}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="units"
                  fill="#0B4A8B"
                  radius={[2, 2, 0, 0]}
                  barSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <CustomReportCard />
      </div>
    </section>
  );
}

export default ReportOverviewPanel;

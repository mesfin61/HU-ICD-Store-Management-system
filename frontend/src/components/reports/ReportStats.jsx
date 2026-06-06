import React from "react";
import {
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExchangeAlt,
  FaMoneyBillWave,
} from "react-icons/fa";

const iconMap = {
  money: FaMoneyBillWave,
  chart: FaChartLine,
  turnover: FaExchangeAlt,
  warning: FaExclamationTriangle,
};

const StatIcon = ({ type }) => {
  const Icon = iconMap[type] ?? FaCheckCircle;

  return <Icon className="w-6 h-6 text-slate-700" aria-hidden="true" />;
};

function ReportStats() {
  const stats = [
    {
      id: 1,
      title: "TOTAL PROCUREMENT VALUE",
      value: "ETB 1.24M",
      percent: "+12.5%",
      pctColor: "bg-green-100 text-green-700",
      subtitle: "Current fiscal quarter",
      icon: "money",
    },
    {
      id: 2,
      title: "CONSUMPTION RATE",
      value: "84.2%",
      percent: "+4.2%",
      pctColor: "bg-green-100 text-green-700",
      subtitle: "Avg. monthly utilization",
      icon: "chart",
    },
    {
      id: 3,
      title: "STOCK TURNOVER",
      value: "4.2x",
      tag: "STABLE",
      tagColor: "bg-gray-100 text-gray-700",
      subtitle: "Annual frequency",
      icon: "turnover",
    },
    {
      id: 4,
      title: "WASTE/DAMAGE RATE",
      value: "1.14%",
      percent: "-0.8%",
      pctColor: "bg-red-100 text-red-700",
      subtitle: "Reported technical loss",
      icon: "warning",
    },
  ];

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.id}
            className="relative bg-white rounded-lg shadow p-4 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-md">
                  <StatIcon type={s.icon} />
                </div>
              </div>
              <div>
                {s.percent && (
                  <div
                    className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded ${s.pctColor}`}
                  >
                    {s.percent}
                  </div>
                )}
                {s.tag && (
                  <div
                    className={`inline-flex items-center px-2 py-1 text-sm font-medium rounded ${s.tagColor}`}
                  >
                    {s.tag}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-500 tracking-widest">
                {s.title}
              </div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-gray-400">{s.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ReportStats;

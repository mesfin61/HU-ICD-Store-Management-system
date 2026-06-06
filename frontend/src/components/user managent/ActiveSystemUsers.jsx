import React from "react";
import {
  FaDownload,
  FaEllipsisV,
  FaFilter,
  FaShieldAlt,
  FaUserShield,
  FaClipboardCheck,
  FaBoxes,
  FaExclamationTriangle,
  FaChevronRight,
} from "react-icons/fa";

const users = [
  {
    name: "Abebe Kebede",
    email: "abebe.k@haramaya.edu.et",
    department: "Network Infrastructure",
    role: "Administrator",
    status: "Active",
    lastLogin: "10 mins ago",
    accent: "bg-sky-500",
    roleTone: "blue",
  },
  {
    name: "Martha Tilahun",
    email: "martha.t@haramaya.edu.et",
    department: "Central Store",
    role: "Store Manager",
    status: "Active",
    lastLogin: "Yesterday, 4:20 PM",
    accent: "bg-emerald-500",
    roleTone: "green",
  },
  {
    name: "Daniel Solomon",
    email: "daniel.s@haramaya.edu.et",
    department: "Maintenance Unit",
    role: "Store Officer",
    status: "Inactive",
    lastLogin: "2 weeks ago",
    accent: "bg-amber-500",
    roleTone: "orange",
  },
  {
    name: "Hirut Bekele",
    email: "hirut.b@haramaya.edu.et",
    department: "Directorate Admin",
    role: "Staff",
    status: "Active",
    lastLogin: "05 Oct 2024",
    accent: "bg-violet-500",
    roleTone: "slate",
  },
];

const roleDefinitions = [
  {
    title: "Administrator",
    description:
      "Full unrestricted access to system configuration and auditing.",
    tone: "blue",
    Icon: FaShieldAlt,
    bullets: [
      "User management & access control",
      "Global inventory configuration",
      "Full data export/import rights",
    ],
  },
  {
    title: "Store Manager",
    description: "Operational oversight for departmental inventory.",
    tone: "green",
    Icon: FaBoxes,
    bullets: [
      "Approve item requests",
      "Manage stock levels & thresholds",
      "Generate departmental reports",
    ],
  },
  {
    title: "Store Officer",
    description: "Record and validate stock movements quickly.",
    tone: "orange",
    Icon: FaClipboardCheck,
    bullets: ["Record item movements", "Physical inventory count updates"],
  },
];

function Avatar({ name, accent }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm ${accent}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function Pill({ children, tone }) {
  const toneClass =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "orange"
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}
    >
      {children}
    </span>
  );
}

function UserActions() {
  return (
    <div className="flex items-center gap-2 text-slate-500">
      <button
        type="button"
        className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white transition hover:bg-slate-50"
        aria-label="Filter users"
      >
        <FaFilter className="text-xs" />
      </button>
      <button
        type="button"
        className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white transition hover:bg-slate-50"
        aria-label="Download users"
      >
        <FaDownload className="text-xs" />
      </button>
    </div>
  );
}

function RoleDefinitionCard({ title, description, tone, Icon, bullets }) {
  const iconClass =
    tone === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
        : "bg-orange-50 text-orange-700 border-orange-100";

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-8 w-8 place-items-center rounded-md border ${iconClass}`}
          >
            <Icon className="text-[12px]" />
          </div>
          <div>
            <h4
              className={`text-[11px] font-bold uppercase tracking-wide ${tone === "blue" ? "text-blue-700" : tone === "green" ? "text-emerald-700" : "text-orange-700"}`}
            >
              {title}
            </h4>
          </div>
        </div>
        <span className="text-slate-400">
          <FaChevronRight className="text-[10px]" />
        </span>
      </div>

      <p className="mb-2 text-[11px] leading-5 text-slate-500">{description}</p>

      <ul className="space-y-1.5">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-2 text-[11px] text-slate-600"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SecurityAuditCard() {
  return (
    <div className="rounded-xl bg-[#0b4a8b] p-4 text-white shadow-sm">
      <div className="mb-3 text-base font-semibold">Security Audit</div>
      <p className="text-sm font-medium text-blue-100">
        You have 3 users who haven't enabled Two-Factor Authentication.
      </p>

      <button
        type="button"
        className="mt-4 w-full rounded-md bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-[#0b4a8b] transition hover:bg-blue-50"
      >
        Enforce Security Policy
      </button>
    </div>
  );
}

function ActiveSystemUsers() {
  return (
    <section className="w-full">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2.1fr)_minmax(290px,0.9fr)]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
            <h2 className="text-base font-semibold text-slate-900">
              Active System Users
            </h2>
            <UserActions />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#f7f9ff] text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 sm:px-5">User Details</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map((user) => (
                  <tr
                    key={user.email}
                    className="align-top text-sm text-slate-700"
                  >
                    <td className="px-4 py-4 sm:px-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} accent={user.accent} />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">
                            {user.name}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {user.department}
                    </td>
                    <td className="px-4 py-4">
                      <Pill tone={user.roleTone}>{user.role}</Pill>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            user.status === "Active"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />
                        <span
                          className={
                            user.status === "Active"
                              ? "text-emerald-600"
                              : "text-slate-500"
                          }
                        >
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {user.lastLogin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p>Showing 4 of 24 users</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-md bg-[#0b4a8b] px-4 py-1.5 font-semibold text-white transition hover:bg-[#083c71]"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-sky-50 text-sky-700">
                <FaUserShield className="text-sm" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Role Definitions
              </h2>
            </div>

            <div className="space-y-3">
              {roleDefinitions.map((role) => (
                <RoleDefinitionCard key={role.title} {...role} />
              ))}
            </div>
          </div>

          <SecurityAuditCard />
        </div>
      </div>
    </section>
  );
}

export default ActiveSystemUsers;

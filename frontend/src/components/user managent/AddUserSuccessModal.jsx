import React, { useEffect, useState } from "react";
import {
  FaTimes,
  FaCheck,
  FaEnvelope,
  FaBuilding,
  FaBox,
  FaExchangeAlt,
  FaCheckSquare,
  FaChartBar,
  FaUserPlus,
  FaEdit,
} from "react-icons/fa";

const PERMISSION_CONFIG = [
  { key: "viewInventory", label: "View Inventory", icon: FaBox },
  { key: "manageStock", label: "Manage Stock", icon: FaExchangeAlt },
  { key: "approveRequests", label: "Approve Requests", icon: FaCheckSquare },
  { key: "generateReports", label: "Generate Reports", icon: FaChartBar },
];

export default function AddUserSuccessModal({
  data = {},
  onConfirm,
  onSave,
  onEditInForm, // "Add Another User" — reuses original prop
  onClose,
}) {
  const [local, setLocal] = useState({ ...data });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocal({ ...data });
  }, [data]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  if (!data) return null;

  // "Edit Profile" opens the form pre-filled with current data
  const handleEditProfile = () => {
    if (onSave) onSave(local); // persist any in-memory changes
    if (onEditInForm) onEditInForm(local); // hand back to parent form
    onClose && onClose();
  };

  // "Add Another User" clears the form and closes the modal
  const handleAddAnother = () => {
    if (onEditInForm) onEditInForm(null); // null signals "reset form"
    onClose && onClose();
  };

  const wrapperClass = `relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl z-[10000] border border-slate-100 transition-all duration-300 ease-out transform ${
    mounted
      ? "opacity-100 translate-y-0 scale-100"
      : "opacity-0 -translate-y-3 scale-95"
  }`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={wrapperClass}>
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-green-50 text-green-700">
              <FaCheck className="text-lg" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                User Added Successfully
              </h3>
              <p className="text-xs text-slate-500">
                The new administrator profile has been indexed in the directory.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 mt-1"
          >
            <FaTimes />
          </button>
        </div>

        {/* User Card */}
        <div className="border border-slate-200 rounded-lg p-3 flex items-center gap-4 mb-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-slate-200 overflow-hidden">
            {local.photo ? (
              <img
                src={local.photo}
                alt="profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-slate-300" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-0.5">
              {local.fullName}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
              <FaEnvelope className="text-slate-400 text-[11px]" />
              <span>{local.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <FaBuilding className="text-slate-400 text-[11px]" />
              <span>{local.department}</span>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Permissions Granted
            </span>
            <span className="text-[11px] font-semibold bg-[#0b4a8b] text-white px-2.5 py-0.5 rounded">
              Admin Access
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PERMISSION_CONFIG.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="flex items-center gap-2 border border-slate-200 rounded-md px-3 py-2.5 text-sm text-slate-700"
              >
                <Icon className="text-slate-400 text-sm shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddAnother}
            className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white hover:bg-slate-50"
          >
            <FaUserPlus className="text-xs" /> Add Another User
          </button>
          <button
            onClick={handleEditProfile}
            className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white hover:bg-slate-50"
          >
            <FaEdit className="text-xs" /> Edit Profile
          </button>
          <button
            onClick={() => onConfirm && onConfirm(local)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold bg-[#0b4a8b] text-white hover:bg-[#093d75]"
          >
            <FaCheck className="text-xs" /> Confirm & Close
          </button>
        </div>
      </div>
    </div>
  );
}

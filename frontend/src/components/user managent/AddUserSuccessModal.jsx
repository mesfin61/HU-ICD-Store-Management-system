import React, { useEffect, useState } from "react";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaBriefcase,
  FaShieldAlt,
  FaCheck,
} from "react-icons/fa";

export default function AddUserSuccessModal({
  data = {},
  onConfirm,
  onSave,
  onEditInForm,
  onClose,
}) {
  const [local, setLocal] = useState({ ...data });
  const [isEditing, setIsEditing] = useState(false);
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
    // trigger entrance animation
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  if (!data) return null;

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transform transition-all duration-300"
              style={{ transform: mounted ? "scale(1)" : "scale(0.9)" }}
            >
              <FaCheck className="text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">User Added</h3>
              <p className="text-xs text-slate-500">
                User has been created successfully
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-50">
              {local.photo ? (
                <img
                  src={local.photo}
                  alt="profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-slate-200" />
              )}
            </div>

            <div className="flex-1">
              {!isEditing ? (
                <>
                  <div className="flex items-center gap-2">
                    <FaUser className="text-slate-400" />
                    <div className="text-sm font-semibold text-slate-900">
                      {local.fullName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <FaEnvelope className="text-slate-400" />
                    <div className="text-xs text-slate-500">{local.email}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <FaBriefcase className="text-slate-400" />
                    <div className="mt-1 text-xs text-slate-600">
                      {local.role} • {local.department}
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <input
                    value={local.fullName || ""}
                    onChange={(e) =>
                      setLocal({ ...local, fullName: e.target.value })
                    }
                    className="rounded border border-slate-200 px-2 py-1 text-sm"
                  />
                  <input
                    value={local.email || ""}
                    onChange={(e) =>
                      setLocal({ ...local, email: e.target.value })
                    }
                    className="rounded border border-slate-200 px-2 py-1 text-sm"
                  />
                  <input
                    value={local.role || ""}
                    onChange={(e) =>
                      setLocal({ ...local, role: e.target.value })
                    }
                    className="rounded border border-slate-200 px-2 py-1 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
            <div className="mb-1 text-xs font-semibold text-slate-500">
              Permissions
            </div>
            <div className="grid gap-1 text-xs">
              {(local.permissions && Object.keys(local.permissions))?.map(
                (k) => (
                  <div key={k} className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${local.permissions[k] ? "bg-emerald-500" : "bg-slate-300"}`}
                    />
                    <span className="capitalize">
                      {k.replace(/([A-Z])/g, " $1")}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => onEditInForm && onEditInForm(local)}
                  className="rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                >
                  Edit in Form
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onConfirm && onConfirm(local)}
                  className="rounded bg-[#0b4a8b] px-4 py-1 text-sm font-semibold text-white"
                >
                  Confirm
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onSave) onSave(local);
                    setIsEditing(false);
                  }}
                  className="rounded bg-[#0b4a8b] px-4 py-1 text-sm font-semibold text-white"
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

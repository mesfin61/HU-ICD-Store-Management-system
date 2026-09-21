import React, { useEffect, useState } from "react";
import {
  FaTimes,
  FaCheck,
  FaEnvelope,
  FaBuilding,
  FaUserPlus,
  FaEdit,
  FaShieldAlt,
} from "react-icons/fa";

export default function AddUserSuccessModal({
  data = {},
  onConfirm,
  onSave,
  onEditInForm,
  onClose,
}) {
  const [local, setLocal] = useState({ ...data });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocal({ ...data });
  }, [data]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  if (!data) {
    return null;
  }

  const roleName = local.role || local.role_name || "user";

  const displayName = local.fullName || local.full_name || "User";

  const displayEmail = local.email || "Not provided";

  const displayDepartment = local.department || "Not specified";

  /*
   * The frontend does NOT calculate permissions.
   *
   * The role is displayed only as information.
   * Actual authorization is determined by the backend
   * from the user's database role.
   */
  const handleEditProfile = () => {
    if (typeof onSave === "function") {
      onSave(local);
    }

    if (typeof onEditInForm === "function") {
      onEditInForm(local);
    }

    if (typeof onClose === "function") {
      onClose();
    }
  };

  /*
   * Reset the parent form so another user can be created.
   */
  const handleAddAnother = () => {
    if (typeof onEditInForm === "function") {
      onEditInForm(null);
    }

    if (typeof onClose === "function") {
      onClose();
    }
  };

  const wrapperClass = `
    relative
    z-[10000]
    w-full
    max-w-md
    rounded-xl
    border
    border-slate-100
    bg-white
    p-6
    shadow-xl
    transition-all
    duration-300
    ease-out
    transform
    ${
      mounted
        ? "translate-y-0 scale-100 opacity-100"
        : "-translate-y-3 scale-95 opacity-0"
    }
  `;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (typeof onClose === "function") {
            onClose();
          }
        }}
      />

      <div className={wrapperClass}>
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-700">
              <FaCheck className="text-lg" />
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">
                User Added Successfully
              </h3>

              <p className="text-xs text-slate-500">
                The user account has been created successfully.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-1 text-slate-400 transition hover:text-slate-600"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* User Card */}
        <div className="mb-4 flex items-center gap-4 rounded-lg border border-slate-200 p-3">
          <div className="min-w-0">
            <p className="mb-0.5 truncate text-sm font-semibold text-slate-900">
              {displayName}
            </p>

            <div className="mb-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <FaEnvelope className="shrink-0 text-[11px] text-slate-400" />

              <span className="truncate">{displayEmail}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <FaBuilding className="shrink-0 text-[11px] text-slate-400" />

              <span className="truncate">{displayDepartment}</span>
            </div>
          </div>
        </div>

        {/* Account Role */}
        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <FaShieldAlt className="text-sm text-[#0b4a8b]" />

            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Assigned System Role
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold capitalize text-slate-900">
                {roleName}
              </p>

              <p className="mt-0.5 text-[11px] text-slate-500">
                Access privileges are determined by the backend according to
                this role.
              </p>
            </div>

            <span className="rounded bg-[#0b4a8b] px-2.5 py-1 text-[11px] font-semibold text-white">
              {roleName}
            </span>
          </div>
        </div>

        {/* Security Information */}
        <div className="mb-5 rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5">
          <p className="text-[11px] leading-5 text-blue-800">
            This account's password is securely processed by the backend. The
            frontend does not retain the password after account creation.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddAnother}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <FaUserPlus className="text-xs" />
            Add Another
          </button>

          <button
            type="button"
            onClick={handleEditProfile}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <FaEdit className="text-xs" />
            Edit Profile
          </button>

          <button
            type="button"
            onClick={() => {
              if (typeof onConfirm === "function") {
                onConfirm(local);
              }
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#0b4a8b] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#093d75]"
          >
            <FaCheck className="text-xs" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

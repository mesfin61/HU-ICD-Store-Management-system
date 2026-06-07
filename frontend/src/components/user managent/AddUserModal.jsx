import React, { useState } from "react";
import { FaCamera, FaTimes, FaShieldAlt } from "react-icons/fa";
import AddUserSuccessModal from "./AddUserSuccessModal";
import { addStoredUser, buildUserRecord } from "./userStorage";

function Checkbox({ label, name, checked, onChange }) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-200 text-[#0b4a8b]"
      />
      <div>
        <div className="text-sm font-semibold text-slate-700">{label}</div>
        <div className="text-xs text-slate-500">
          {/* optional description */}
        </div>
      </div>
    </label>
  );
}

export default function AddUserModal({ isOpen, onClose, onUserCreated }) {
  const [photo, setPhoto] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [permissions, setPermissions] = useState({
    viewInventory: false,
    manageStock: false,
    approveRequests: false,
    generateReports: false,
    systemConfig: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  if (!isOpen) return null;

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    const fileDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read selected file"));
      reader.readAsDataURL(f);
    });

    setPhoto(fileDataUrl);
  }

  function togglePerm(key) {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  }

  async function handleCreate() {
    setSubmitting(true);
    const user = buildUserRecord({
      photo,
      fullName,
      email,
      department,
      role,
      permissions,
      twoFactorEnabled: false,
    });
    addStoredUser(user);
    if (typeof onUserCreated === "function") {
      onUserCreated(user);
    }
    setSubmitting(false);
    setCreatedUser(user);
    setShowSuccess(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            User Profile Information
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="col-span-1">
              <div className="rounded-md border border-dashed border-slate-200 p-4 text-center">
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded bg-slate-50">
                  {photo ? (
                    <img
                      src={photo}
                      alt="profile photo"
                      className="h-20 w-20 rounded object-cover"
                    />
                  ) : (
                    <FaCamera className="text-slate-400" />
                  )}
                </div>
                <div className="mb-2 text-xs text-slate-600">
                  Upload a clear passport-sized photo. JPG or PNG, max 2MB.
                </div>

                <div className="flex items-center justify-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded bg-[#f1f5fb] px-3 py-1 text-sm font-medium text-slate-700 hover:bg-[#e8f0fb]">
                    Browse Files
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFile}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="rounded border border-slate-200 px-3 py-1 text-sm text-slate-600"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="grid gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Full Name
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Enter user's full name"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Institutional Email
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    placeholder="username@haramaya.edu.et"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="">Select Department</option>
                      <option>Network Infrastructure</option>
                      <option>Central Store</option>
                      <option>Maintenance Unit</option>
                      <option>Directorate Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      System Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="">Assign a Role</option>
                      <option>Administrator</option>
                      <option>Store Manager</option>
                      <option>Store Officer</option>
                      <option>Staff</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-[#f8fbff] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FaShieldAlt className="text-sm text-slate-500" />
              <span>PERMISSIONS & ACCESS CONTROL</span>
            </div>

            <div className="grid gap-3">
              <div className="rounded-md border border-slate-100 bg-white p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Checkbox
                    label="View Inventory"
                    checked={permissions.viewInventory}
                    onChange={() => togglePerm("viewInventory")}
                  />
                  <Checkbox
                    label="Manage Stock"
                    checked={permissions.manageStock}
                    onChange={() => togglePerm("manageStock")}
                  />
                </div>
              </div>

              <div className="rounded-md border border-slate-100 bg-white p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <Checkbox
                    label="Approve Requests"
                    checked={permissions.approveRequests}
                    onChange={() => togglePerm("approveRequests")}
                  />
                  <Checkbox
                    label="Generate Reports"
                    checked={permissions.generateReports}
                    onChange={() => togglePerm("generateReports")}
                  />
                </div>
              </div>

              <div className="rounded-md border border-slate-100 bg-white p-3">
                <Checkbox
                  label="System Configuration"
                  checked={permissions.systemConfig}
                  onChange={() => togglePerm("systemConfig")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-4 py-3">
          <button
            onClick={onClose}
            type="button"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            type="button"
            disabled={submitting}
            className="rounded-md bg-[#0b4a8b] px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add User"}
          </button>
        </div>
      </div>
      {showSuccess && (
        <AddUserSuccessModal
          data={createdUser}
          onConfirm={(user) => {
            // final confirm: close success modal and close the add modal
            setShowSuccess(false);
            if (onClose) onClose(user);
          }}
          onEditInForm={(user) => {
            // push user values back to form and return to form view
            if (user) {
              setPhoto(user.photo);
              setFullName(user.fullName || "");
              setEmail(user.email || "");
              setDepartment(user.department || "");
              setRole(user.role || "");
              setPermissions(user.permissions || {});
            }
            setShowSuccess(false);
          }}
          onSave={(user) => {
            // inline save pushes updates back to the parent form state
            if (user) {
              setCreatedUser(user);
              setPhoto(user.photo);
              setFullName(user.fullName || "");
              setEmail(user.email || "");
              setDepartment(user.department || "");
              setRole(user.role || "");
              setPermissions(user.permissions || {});
            }
          }}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { FaCamera, FaTimes } from "react-icons/fa";

import AddUserSuccessModal from "./AddUserSuccessModal";

import { getDepartments } from "../../services/departmentService";
import { getRoles } from "../../services/roleService";
import { createUser } from "../../services/userService";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  password: "",
  departmentId: "",
  roleId: "",
};

export default function AddUserModal({
  isOpen,
  onClose,
  onUserCreated,
}) {
  const [photo, setPhoto] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState("");

  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  /*
   * Load departments and roles from the backend whenever
   * the Add User modal opens.
   *
   * Departments and roles are database data.
   * The frontend does not maintain its own authoritative
   * copies of either.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    async function loadFormData() {
      setDepartmentsLoading(true);
      setRolesLoading(true);

      setDepartmentsError("");
      setRolesError("");

      try {
        const [departmentData, roleData] = await Promise.all([
          getDepartments(),
          getRoles(),
        ]);

        if (cancelled) {
          return;
        }

        const activeDepartments = Array.isArray(departmentData)
          ? departmentData.filter(
              (department) =>
                department &&
                department.id &&
                department.name &&
                department.is_active !== false,
            )
          : [];

        const availableRoles = Array.isArray(roleData)
          ? roleData.filter(
              (role) =>
                role &&
                role.id !== undefined &&
                role.name,
            )
          : [];

        setDepartments(activeDepartments);
        setRoles(availableRoles);
      } catch (error) {
        console.error(
          "[AddUserModal] Failed to load departments/roles:",
          error,
        );

        if (cancelled) {
          return;
        }

        const message =
          error?.message ||
          "Failed to load departments and roles.";

        /*
         * We don't invent fallback department or role data.
         * If the backend cannot provide them, the form remains
         * unavailable rather than silently creating invalid data.
         */
        setDepartments([]);
        setRoles([]);

        setDepartmentsError(message);
        setRolesError(message);
      } finally {
        if (!cancelled) {
          setDepartmentsLoading(false);
          setRolesLoading(false);
        }
      }
    }

    loadFormData();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  /*
   * Reset transient form state after the modal is closed.
   *
   * This prevents the previous user's values from appearing
   * when Add User is opened again.
   */
  useEffect(() => {
    if (isOpen) {
      return;
    }

    setPhoto(null);
    setFullName(EMPTY_FORM.fullName);
    setEmail(EMPTY_FORM.email);
    setPassword(EMPTY_FORM.password);
    setDepartmentId(EMPTY_FORM.departmentId);
    setRoleId(EMPTY_FORM.roleId);

    setSubmitError("");
    setShowSuccess(false);
    setCreatedUser(null);
  }, [isOpen]);

  /*
   * Do not render the modal while it is closed.
   */
  if (!isOpen) {
    return null;
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Profile picture must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      const fileDataUrl = await new Promise(
        (resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            resolve(String(reader.result || ""));
          };

          reader.onerror = () => {
            reject(
              new Error("Failed to read selected file."),
            );
          };

          reader.readAsDataURL(file);
        },
      );

      setPhoto(fileDataUrl);
    } catch (error) {
      console.error(
        "[AddUserModal] Failed to read profile image:",
        error,
      );

      alert(
        error?.message ||
          "Failed to read the selected image.",
      );
    }
  }

  function getSelectedDepartment() {
    return departments.find(
      (department) =>
        String(department.id) === String(departmentId),
    );
  }

  function getSelectedRole() {
    return roles.find(
      (role) =>
        String(role.id) === String(roleId),
    );
  }

  function resetForm() {
    setPhoto(null);
    setFullName("");
    setEmail("");
    setPassword("");
    setDepartmentId("");
    setRoleId("");
    setSubmitError("");
  }

  async function handleCreate() {
    if (submitting) {
      return;
    }

    setSubmitError("");

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    /*
     * Client-side validation.
     *
     * The backend remains authoritative and validates
     * everything again.
     */
    if (!cleanFullName) {
      setSubmitError("Full name is required.");
      return;
    }

    if (!cleanEmail) {
      setSubmitError("Email address is required.");
      return;
    }

    if (!password) {
      setSubmitError("An initial password is required.");
      return;
    }

    if (password.length < 8) {
      setSubmitError(
        "Password must be at least 8 characters.",
      );
      return;
    }

    if (!departmentId) {
      setSubmitError("Please select a department.");
      return;
    }

    if (!roleId) {
      setSubmitError("Please select a role.");
      return;
    }

    const selectedDepartment = getSelectedDepartment();
    const selectedRole = getSelectedRole();

    if (!selectedDepartment) {
      setSubmitError(
        "The selected department is no longer available. Please select another department.",
      );
      return;
    }

    if (!selectedRole) {
      setSubmitError(
        "The selected role is no longer available. Please select another role.",
      );
      return;
    }

    try {
      setSubmitting(true);

      /*
       * REAL USER CREATION
       *
       * This sends the account to the backend:
       *
       * POST /api/users
       *
       * The backend is responsible for:
       * - authentication
       * - authorization
       * - role validation
       * - department validation
       * - password hashing
       * - PostgreSQL insertion
       */
      const created = await createUser({
        fullName: cleanFullName,
        email: cleanEmail,
        password,
        departmentId: selectedDepartment.id,
        roleId: selectedRole.id,
      });

      /*
       * Normalize the backend response for the existing
       * success modal.
       *
       * This is UI state only. PostgreSQL remains the source
       * of truth for the account.
       */
      const userForDisplay = {
        ...created,

        id:
          created?.id ||
          created?.user_id ||
          "",

        fullName:
          created?.fullName ||
          created?.full_name ||
          cleanFullName,

        full_name:
          created?.full_name ||
          created?.fullName ||
          cleanFullName,

        email:
          created?.email ||
          cleanEmail,

        department:
          created?.department ||
          created?.department_name ||
          selectedDepartment.name,

        departmentName:
          created?.departmentName ||
          created?.department_name ||
          selectedDepartment.name,

        departmentId:
          created?.departmentId ||
          created?.department_id ||
          selectedDepartment.id,

        department_id:
          created?.department_id ||
          created?.departmentId ||
          selectedDepartment.id,

        role:
          created?.role ||
          created?.role_name ||
          selectedRole.name,

        role_name:
          created?.role_name ||
          created?.role ||
          selectedRole.name,

        roleId:
          created?.roleId ||
          created?.role_id ||
          selectedRole.id,

        role_id:
          created?.role_id ||
          created?.roleId ||
          selectedRole.id,

        photo: photo || null,
      };

      /*
       * Never retain the initial password after the request
       * has completed.
       */
      setPassword("");

      setCreatedUser(userForDisplay);

      if (typeof onUserCreated === "function") {
        onUserCreated(userForDisplay);
      }

      setShowSuccess(true);
    } catch (error) {
      console.error(
        "[AddUserModal] User creation failed:",
        error,
      );

      setSubmitError(
        error?.message ||
          "Failed to create the user account.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleSuccessConfirm(user) {
    setShowSuccess(false);
    resetForm();

    if (typeof onClose === "function") {
      onClose(user);
    }
  }

  function handleSuccessClose() {
    setShowSuccess(false);
  }

  function handleAddAnother() {
    setShowSuccess(false);
    resetForm();
  }

  function handleEditInForm(user) {
    if (!user) {
      setShowSuccess(false);
      resetForm();
      return;
    }

    setPhoto(user.photo || null);

    setFullName(
      user.fullName ||
        user.full_name ||
        "",
    );

    setEmail(user.email || "");

    setDepartmentId(
      user.departmentId ||
        user.department_id ||
        "",
    );

    setRoleId(
      user.roleId ||
        user.role_id ||
        "",
    );

    /*
     * Never restore the password.
     *
     * The password is not returned by the backend.
     */
    setPassword("");

    setShowSuccess(false);
    setSubmitError("");
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                User Profile Information
              </h3>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Create a new institutional user account.
              </p>
            </div>

            <button
              onClick={onClose}
              type="button"
              disabled={submitting}
              className="text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          {/* Main form */}
          <div className="max-h-[75vh] overflow-y-auto p-5">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Profile picture */}
              <div className="col-span-1">
                <div className="rounded-md border border-dashed border-slate-200 p-4 text-center">
                  <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded bg-slate-50">
                    {photo ? (
                      <img
                        src={photo}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FaCamera className="text-xl text-slate-400" />
                    )}
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                    <FaCamera />

                    <span>
                      {photo
                        ? "Change Photo"
                        : "Upload Photo"}
                    </span>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFile}
                      disabled={submitting}
                      className="hidden"
                    />
                  </label>

                  <p className="mt-2 text-[11px] text-slate-400">
                    JPG, PNG or other image formats.
                    <br />
                    Maximum 5 MB.
                  </p>
                </div>
              </div>

              {/* User information */}
              <div className="col-span-2">
                <div className="grid gap-4">
                  {/* Full name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-1 block text-xs font-semibold text-slate-600"
                    >
                      Full Name
                    </label>

                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(event.target.value)
                      }
                      placeholder="Enter full name"
                      disabled={submitting}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#0b4a8b] focus:ring-1 focus:ring-[#0b4a8b] disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-xs font-semibold text-slate-600"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="name@haramaya.edu.et"
                      disabled={submitting}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#0b4a8b] focus:ring-1 focus:ring-[#0b4a8b] disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>

                  {/* Initial password */}
                  <div>
                    <label
                      htmlFor="initialPassword"
                      className="mb-1 block text-xs font-semibold text-slate-600"
                    >
                      Initial Password
                    </label>

                    <input
                      id="initialPassword"
                      type="password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Minimum 8 characters"
                      disabled={submitting}
                      autoComplete="new-password"
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#0b4a8b] focus:ring-1 focus:ring-[#0b4a8b] disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <p className="mt-1 text-[11px] text-slate-400">
                      The password is sent securely to the
                      backend and hashed before storage.
                    </p>
                  </div>

                  {/* Department */}
                  <div>
                    <label
                      htmlFor="department"
                      className="mb-1 block text-xs font-semibold text-slate-600"
                    >
                      Department
                    </label>

                    <select
                      id="department"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      disabled={departmentsLoading}
                      required
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#0b4a8b] focus:ring-1 focus:ring-[#0b4a8b] disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      <option value="" disabled>
                        {departmentsLoading
                          ? "Loading departments..."
                          : "Select Department"}
                      </option>

                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>

                    {departmentsError && (
                      <p className="mt-1 text-xs text-red-600">
                        {departmentsError}
                      </p>
                    )}

                    {!departmentsLoading &&
                      !departmentsError &&
                      departments.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          No active departments were found.
                        </p>
                      )}
                  </div>

                  {/* Role */}
                  <div>
                    <label
                      htmlFor="role"
                      className="mb-1 block text-xs font-semibold text-slate-600"
                    >
                      Role
                    </label>

                    <select
                      id="role"
                      value={roleId}
                      onChange={(e) => setRoleId(e.target.value)}
                      disabled={rolesLoading}
                      required
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#0b4a8b] focus:ring-1 focus:ring-[#0b4a8b] disabled:cursor-not-allowed disabled:bg-slate-50"
                    >
                      <option value="" disabled>
                        {rolesLoading ? "Loading roles..." : "Assign a Role"}
                      </option>

                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>

                    {rolesError && (
                      <p className="mt-1 text-xs text-red-600">
                        {rolesError}
                      </p>
                    )}

                    {!rolesLoading &&
                      !rolesError &&
                      roles.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          No roles were returned by the
                          system.
                        </p>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Authorization notice */}
            <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold text-blue-900">
                Role-Based Access Control
              </p>

              <p className="mt-1 text-[11px] leading-5 text-blue-800">
                Access privileges are determined by the
                user's database role. The frontend does not
                independently create or persist permission
                assignments.
              </p>
            </div>

            {/* Submission error */}
            {submitError && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-xs leading-5 text-red-700">
                  {submitError}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-4 py-3">
            <button
              onClick={onClose}
              type="button"
              disabled={submitting}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              onClick={handleCreate}
              type="button"
              disabled={
                submitting ||
                departmentsLoading ||
                rolesLoading ||
                departments.length === 0 ||
                roles.length === 0
              }
              className="rounded-md bg-[#0b4a8b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#083c71] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Creating Account..."
                : "Add User"}
            </button>
          </div>
        </div>
      </div>

      {/* Success modal */}
      {showSuccess && (
        <AddUserSuccessModal
          data={createdUser}
          onConfirm={handleSuccessConfirm}
          onClose={handleSuccessClose}
          onEditInForm={handleEditInForm}
          onSave={handleEditInForm}
        />
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import PageTransition from "../animated_motion/PageTransition";
import Profile from "./Profile";
import {
  FaUser,
  FaLock,
  FaTags,
  FaBuilding,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaTimes,
} from "react-icons/fa";
import apiClient from "../services/apiClient";
import {
  activateCategory,
  deactivateCategory,
  getCategories,
  updateCategory,
} from "../services/categoryService";
import {
  getDepartments,
  updateDepartment,
  activateDepartment,
  deactivateDepartment,
} from "../services/departmentService";
import { getUsers, transferOwnership } from "../services/userService";
import { useUser } from "../context/AuthContext";

const settingsOptions = [
  {
    key: "profile",
    label: "Profile",
    description: "Manage personal information",
    icon: FaUser,
  },
  {
    key: "security",
    label: "Security",
    description: "Change password",
    icon: FaLock,
  },
  {
    key: "transfer-ownership",
    label: "Transfer Ownership",
    description: "Move Super Admin ownership",
    icon: FaShieldAlt,
  },
  {
    key: "category",
    label: "Category",
    description: "Manage categories",
    icon: FaTags,
  },
  {
    key: "category-update",
    label: "Update Category",
    description: "Update or activate categories",
    icon: FaTags,
  },
  {
    key: "departments",
    label: "Departments",
    description: "Manage departments",
    icon: FaBuilding,
  },
  {
    key: "department-update",
    label: "Update Departments",
    description: "Update or Activate departments",
    icon: FaBuilding,
  },
];

function SettingPlaceholder({ title, description }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-bold text-primary">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visiblePassword, setVisiblePassword] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.patch("/api/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setSuccess(response.data.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Failed to change password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl rounded-lg border bg-white p-5 shadow-sm sm:p-8"
    >
      <div className="text-center">
        <h3 className="text-xl font-bold text-primary">Change password</h3>
        <p className="mt-1 text-sm text-slate-500">
          Keep your account secure with a new password.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}

      <div className="mx-auto mt-6 grid max-w-lg gap-4">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Current password
          <PasswordInput
            name="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            visible={visiblePassword === "current"}
            onToggle={() =>
              setVisiblePassword((active) =>
                active === "current" ? null : "current",
              )
            }
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          New password
          <PasswordInput
            name="new-password"
            value={newPassword}
            onChange={setNewPassword}
            visible={visiblePassword === "new"}
            onToggle={() =>
              setVisiblePassword((active) => (active === "new" ? null : "new"))
            }
            minLength={8}
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Confirm new password
          <PasswordInput
            name="confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={visiblePassword === "confirm"}
            onToggle={() =>
              setVisiblePassword((active) =>
                active === "confirm" ? null : "confirm",
              )
            }
            minLength={8}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-fit rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </div>
    </form>
  );
}

function PasswordInput({
  name,
  value,
  onChange,
  visible,
  onToggle,
  minLength,
}) {
  return (
    <div className="relative">
      <input
        id={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        minLength={minLength}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 outline-none focus:border-blue-700"
      />

      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 transition hover:text-blue-700"
        aria-label={visible ? `Hide ${name}` : `Show ${name}`}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}

/*==================================================================================================
     CATEGORY CREATE BY STORE MANAGEMENT
==================================================================================================
*/

function CreateCategory() {
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!categoryName.trim()) {
      setError("Category name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post("/api/categories/create-category", {
        name: categoryName,
        description: categoryDescription,
      });

      setSuccess(response.data.message || "Category created successfully.");
      setCategoryName("");
      setCategoryDescription("");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-bold text-primary">Create category</h3>
        <p className="mt-1 text-sm text-slate-500">
          Add a category for inventory items.
        </p>
      </div>

      <div className="px-6 py-6">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        )}

        <div className="grid max-w-3xl gap-5">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Category name
            <input
              type="text"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              maxLength={100}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Description
            <textarea
              value={categoryDescription}
              onChange={(event) => setCategoryDescription(event.target.value)}
              rows={4}
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-fit rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create category"}
          </button>
        </div>
      </div>
    </form>
  );
}

/*==================================================================================================
     CATEGORY MANAGEMENT
==================================================================================================
*/

function CategoryManagement() {
  const [activeTab, setActiveTab] = useState("update");
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Failed to load categories.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const selectedCategory = categories.find(
    (category) => String(category.id) === String(selectedId),
  );

  const handleSelect = (event) => {
    const id = event.target.value;
    const category = categories.find((item) => String(item.id) === String(id));

    setSelectedId(id);
    setName(category?.name || "");
    setDescription(category?.description || "");
    setMessage("");
    setError("");
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!selectedId) {
      setError("Select a category to update.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const updatedCategory = await updateCategory(selectedId, {
        name,
        description,
      });

      setCategories((current) =>
        current.map((category) =>
          category.id === updatedCategory.id ? updatedCategory : category,
        ),
      );
      setMessage("Category updated successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Failed to update category.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      setIsSubmitting(true);
      setError("");
      await activateCategory(id);
      await loadCategories();
      setMessage("Category activated successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Failed to activate category.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      setIsSubmitting(true);
      setError("");
      await deactivateCategory(id);
      await loadCategories();
      setMessage("Category deactivated successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Failed to deactivate category.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50 px-6 py-4">
        <button
          type="button"
          onClick={() => setActiveTab("update")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === "update"
              ? "bg-blue-700 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Update Category
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("activate")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === "activate"
              ? "bg-blue-700 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Activate Category
        </button>
      </div>

      <div className="px-6 py-6">
        {message && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading categories...</p>
        ) : activeTab === "update" ? (
          <form onSubmit={handleUpdate} className="grid max-w-3xl gap-5">
            <h3 className="text-lg font-bold text-primary">Update category</h3>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Category
              <select
                value={selectedId}
                onChange={handleSelect}
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedCategory && (
              <>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Category name
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={100}
                    required
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Description
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-fit rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Updating..." : "Update category"}
                </button>
              </>
            )}
          </form>
        ) : (
          <div className="grid max-w-3xl gap-3">
            <h3 className="text-lg font-bold text-primary">
              Activate category
            </h3>
            {categories.length === 0 ? (
              <p className="text-sm text-slate-500">There are no categories.</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {category.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {category.description || "No description"}
                    </p>
                  </div>
                  {category.is_active ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDeactivate(category.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleActivate(category.id)}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Activate
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/*
==================================================================================================
     DEPARTMENT CREATE MANAGE BY ADMINISTRATOR AND SUPER ADMIN
==================================================================================================
*/

function Department() {
  const [departmentName, setDepartmentName] = useState("");
  const [departmentDescription, setDepartmentDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanName = departmentName.trim();

    if (!cleanName) {
      setError("Department name is required.");
      return;
    }

    if (cleanName.length > 150) {
      setError("Department name must not exceed 150 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post("/api/departments/", {
        name: cleanName,
        description: departmentDescription.trim() || null,
      });

      setSuccess(response.data.message || "Department created successfully.");
      setDepartmentName("");
      setDepartmentDescription("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Failed to create department.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-bold text-primary">Create department</h3>
        <p className="mt-1 text-sm text-slate-500">
          Add a department for system users.
        </p>
      </div>

      <div className="px-6 py-6">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        )}

        <div className="grid max-w-3xl gap-5">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Department name
            <input
              type="text"
              value={departmentName}
              onChange={(event) => setDepartmentName(event.target.value)}
              maxLength={150}
              required
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Description
            <textarea
              value={departmentDescription}
              onChange={(event) => setDepartmentDescription(event.target.value)}
              rows={4}
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-fit rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create department"}
          </button>
        </div>
      </div>
    </form>
  );
}

/*
 =======================================================================================================
                 UPDATE, ACTIVATE AND DEACTIVATE DEPARTMENT EXECUTED ONLY BY SUPER ADMIN
 ======================================================================================================= 
 */

function DepartmentManagement() {
  const [activeTab, setActiveTab] = useState("update");
  const [departments, setDepartments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDepartments = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await getDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Failed to load departments.",
      );
    } finally {
      setIsLoading(false);
    }
  };

    useEffect(() => {
    loadDepartments();
  }, []);

  const selectedDepartment = departments.find(
    (department) => String(department.id) === String(selectedId),
  );

  const handleSelect = (event) => {
    const id = event.target.value;
    const department = departments.find((item) => String(item.id) === String(id));

    setSelectedId(id);
    setName(department?.name || "");
    setDescription(department?.description || "");
    setMessage("");
    setError("");
  };

   const handleUpdate = async (event) => {
    event.preventDefault();

    if (!selectedId) {
      setError("Select a department to update.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const updatedDepartment = await updateDepartment(selectedId, {
        name,
        description,
      });

      setDepartments((current) =>
        current.map((department) =>
          department.id === updatedDepartment.id ? updatedDepartment : department,
        ),
      );
      setMessage("department updated successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Failed to update department.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      setIsSubmitting(true);
      setError("");
      await activateDepartment(id);
      await loadDepartments();
      setMessage("Department activated successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Failed to activate department.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      setIsSubmitting(true);
      setError("");
      await deactivateDepartment(id);
      await loadDepartments();
      setMessage("Department deactivated successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Failed to deactivate department.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-slate-100 bg-slate-50 px-6 py-4">
        <button
          type="button"
          onClick={() => setActiveTab("update")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === "update"
              ? "bg-blue-700 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Update Department
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("activate")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            activeTab === "activate"
              ? "bg-blue-700 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Activate Department
        </button>
      </div>

      <div className="px-6 py-6">
        {message && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading departments...</p>
        ) : activeTab === "update" ? (
          <form onSubmit={handleUpdate} className="grid max-w-3xl gap-5">
            <h3 className="text-lg font-bold text-primary">Update department</h3>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Department
              <select
                value={selectedId}
                onChange={handleSelect}
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
              >
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedDepartment && (
              <>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Department name
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={100}
                    required
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Description
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-fit rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Updating..." : "Update department"}
                </button>
              </>
            )}
          </form>
        ) : (
          <div className="grid max-w-3xl gap-3">
            <h3 className="text-lg font-bold text-primary">
              Activate department
            </h3>
            {departments.length === 0 ? (
              <p className="text-sm text-slate-500">There are no departments.</p>
            ) : (
              departments.map((department) => (
                <div
                  key={department.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {department.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {department.description || "No description"}
                    </p>
                  </div>
                  {department.is_active ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDeactivate(department.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleActivate(department.id)}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Activate
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TransferOwnership({ currentUser, onTransferComplete }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError("");
      const loadedUsers = await getUsers();
      setUsers(loadedUsers.filter((candidate) => candidate.id !== currentUser.id));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Failed to load users.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser.id]);

  const openTransferModal = (candidate) => {
    setSelectedUser(candidate);
    setCurrentPassword("");
    setError("");
  };

  const closeTransferModal = () => {
    if (isSubmitting) {
      return;
    }

    setSelectedUser(null);
    setCurrentPassword("");
  };

  const handleTransfer = async (event) => {
    event.preventDefault();

    if (!currentPassword) {
      setError("Enter your current password to continue.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await transferOwnership(selectedUser.id, currentPassword);
      setSuccess(`Ownership transferred to ${selectedUser.full_name}.`);
      setSelectedUser(null);
      setCurrentPassword("");
      await onTransferComplete();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Failed to transfer ownership.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-bold text-primary">Transfer ownership</h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Give another active user full Super Admin control. Your account will
          become a Store Manager after the transfer.
        </p>
      </div>

      <div className="px-6 py-6">
        {success && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        )}

        {error && !selectedUser && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-500">No other users are available.</p>
        ) : (
          <div className="grid gap-3">
            {users.map((candidate) => (
              <div
                key={candidate.id}
                className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {candidate.full_name}
                  </p>
                  <p className="text-sm text-slate-500">{candidate.email}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {candidate.role_name || "No role"}
                    {candidate.department_name
                      ? ` - ${candidate.department_name}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!candidate.is_active}
                  onClick={() => openTransferModal(candidate)}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {candidate.is_active ? "Transfer ownership" : "Inactive user"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedUser && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-ownership-title"
        >
          <form
            onSubmit={handleTransfer}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4
                  id="transfer-ownership-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Confirm ownership transfer
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  This action changes system-wide administrative control.
                </p>
              </div>
              <button
                type="button"
                onClick={closeTransferModal}
                disabled={isSubmitting}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close transfer confirmation"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Are you sure you want to transfer ownership to{" "}
              <strong>{selectedUser.full_name}</strong>? Your account will lose
              Super Admin access and cannot undo this change by itself.
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <label className="mt-5 grid gap-2 text-sm font-medium text-slate-700">
              Confirm with your current password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-100"
              />
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeTransferModal}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                No, cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Transferring..." : "Yes, transfer ownership"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default function Settings() {
  const { user, refreshUser } = useUser();
  const [activeSetting, setActiveSetting] = useState("profile");
  const canManageCategories = user?.role === "Store Manager";
  const canManageDepartments =
    user?.role === "Super Admin" || user?.role === "Administrator";
  const canTransferOwnership = user?.role === "Super Admin";
  const visibleSettings = settingsOptions.filter(
    (setting) =>
      ((setting.key !== "category" && setting.key !== "category-update") ||
        canManageCategories) &&
      ((setting.key !== "departments" && setting.key !== "department-update") ||
        canManageDepartments) &&
      (setting.key !== "transfer-ownership" || canTransferOwnership),
  );
  const selectedSetting = visibleSettings.find(
    (setting) => setting.key === activeSetting,
  );

  return (
    <PageTransition>
      <div className="px-0 pt-1 pb-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-primary">Settings</h2>
          <p className="text-sm font-semibold text-primary">
            Manage your account settings.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="grid grid-cols-1 gap-3">
            {visibleSettings.map(({ key, label, description, icon: Icon }) => {
              const active = activeSetting === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveSetting(key)}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                    active
                      ? "border-blue-700 bg-blue-700 text-white"
                      : "border-gray-300 bg-white text-primary hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />

                  <div>
                    <div className="font-semibold">{label}</div>
                    <div
                      className={`text-xs ${
                        active ? "text-blue-100" : "text-slate-500"
                      }`}
                    >
                      {description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="min-w-0">
            {activeSetting === "profile" ? (
              <Profile />
            ) : activeSetting === "security" ? (
              <ChangePassword />
            ) : activeSetting === "category" && canManageCategories ? (
              <CreateCategory />
            ) : activeSetting === "category-update" && canManageCategories ? (
              <CategoryManagement />
            ) : activeSetting === "departments" && canManageDepartments ? (
              <Department />
            ) : activeSetting === "department-update" && canManageDepartments ? (
              <DepartmentManagement />
            ) : activeSetting === "transfer-ownership" && canTransferOwnership ? (
              <TransferOwnership
                currentUser={user}
                onTransferComplete={refreshUser}
              />
            ) : selectedSetting ? (
              <SettingPlaceholder
                title={selectedSetting.label}
                description={selectedSetting.description}
              />
            ) : (
              <Profile />
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

import React, { useState, useEffect } from "react";
import API_URL from "../config/api";
import {
  updateProfile,
  uploadProfilePicture,
} from "../services/profileService";
import { FiMapPin, FiMail, FiPhone, FiCalendar } from "react-icons/fi";
import { MdOutlineVerifiedUser, MdModeEdit } from "react-icons/md";
import { useUser } from "../context/AuthContext";
import PageTransition from "../animated_motion/PageTransition";

export default function Profile() {
  const { user, setUser } = useUser();
  const [edit, setEdit] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    officeLocation: user?.officeLocation || "",
  });

  useEffect(() => {
    if (user) {
      setData({
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        officeLocation: user.officeLocation || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
      setError(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, [message]);

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);

  const formattedName = user?.fullName
    ?.split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setEdit(true);
  };

  const handleSave = async () => {
    try {
      setError(false);
      setMessage("");

      const updatedUser = await updateProfile(data);

      setUser((prev) => ({
        ...prev,
        fullName: updatedUser.full_name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phone_number,
        officeLocation: updatedUser.office_location,
      }));

      setMessage("Profile updated successfully");
      setEdit(false);
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];

      if (!file) return;

      const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

      const extension = file.name
        .substring(file.name.lastIndexOf("."))
        .toLowerCase();

      if (!allowedExtensions.includes(extension)) {
        setError(true);
        setMessage(
          "Only JPG, JPEG, PNG, and WEBP images are allowed. Please convert HEIC images before uploading.",
        );
        return;
      }

      const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

      if (file.size > MAX_SIZE) {
        setError(true);
        setMessage("Image size must be less than 5 MB.");
        return;
      }

      const formData = new FormData();
      formData.append("profilePicture", file);

      const updatedUser = await uploadProfilePicture(formData);

      setUser((prev) => ({
        ...prev,
        profilePicture: updatedUser.profile_picture,
      }));

      setError(false);
      setMessage("Profile picture updated successfully");
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || "Failed to upload image");
    }
  };

  return (
    <PageTransition>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
            <div className="h-32 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600" />

            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-12">
                <div className="flex items-end gap-4">
                  <div className="relative rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                    {user?.profilePicture ? (
                      <img
                        src={`${API_URL}/${user.profilePicture.replace(/^\/+/, "")}`}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">
                        {initials}
                      </div>
                    )}

                    {edit && (
                      <label className="absolute bottom-2 right-4 cursor-pointer text-black hover:text-gray-800 bg-white rounded">
                        <MdModeEdit className="text-2xl" />
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          hidden
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </div>

                  <div className="pb-2">
                    <h1 className="text-2xl font-bold text-primary">
                      {formattedName}
                    </h1>

                    <p className="text-sm text-primary">
                      {user?.role} • ICT Directorate
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {edit ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="px-5 py-2 rounded-lg bg-green-600 text-white"
                      >
                        Save Changes
                      </button>

                      <button
                        onClick={() => setEdit(false)}
                        className="px-5 py-2 rounded-lg bg-gray-200"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="px-5 py-2 rounded-lg bg-blue-700 text-white"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`flex justify-between items-center mb-4 rounded-lg p-3 ${
                error
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              <span>{message}</span>

              <button
                onClick={() => {
                  setMessage("");
                  setError(false);
                }}
                className="font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">
                  Personal Information
                </h2>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {edit ? (
                  <input
                    type="text"
                    name="fullName"
                    value={data.fullName}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                ) : (
                  <InfoItem
                    label="Full Name"
                    value={formattedName}
                    icon={<MdOutlineVerifiedUser />}
                  />
                )}

                {edit ? (
                  <input
                    type="text"
                    name="email"
                    value={data.email}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                ) : (
                  <InfoItem
                    label="Email Address"
                    value={user?.email}
                    icon={<FiMail />}
                  />
                )}

                {edit ? (
                  <input
                    type="text"
                    name="phoneNumber"
                    value={data.phoneNumber || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                ) : (
                  <InfoItem
                    label="Phone Number"
                    value={user?.phoneNumber || "Not Provided"}
                    icon={<FiPhone />}
                  />
                )}

                <InfoItem
                  label="Role"
                  value={user?.role}
                  icon={<MdOutlineVerifiedUser />}
                />

                {edit ? (
                  <input
                    type="text"
                    name="officeLocation"
                    value={data.officeLocation}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                ) : (
                  <InfoItem
                    label="Office Location"
                    value={user?.officeLocation || "Not Provided"}
                    icon={<FiMapPin />}
                  />
                )}

                <InfoItem
                  label="Joined Date"
                  value={
                    user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "-"
                  }
                  icon={<FiCalendar />}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">
                  Roles & Permissions
                </h2>
              </div>

              <div className="p-5">
                <div className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 mb-5">
                  {user?.role}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <PermissionCard
                    title="Inventory Management"
                    description="Full access to create, update and delete inventory records."
                  />

                  <PermissionCard
                    title="Report Generation"
                    description="Generate and export operational reports."
                  />

                  <PermissionCard
                    title="User Management"
                    description="Manage users, roles and permissions."
                  />

                  <PermissionCard
                    title="System Configuration"
                    description="Configure global application settings."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function InfoItem({ label, value, icon }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
        {label}
      </div>

      <div className="flex items-center gap-2 text-gray-700">
        <span className="text-blue-600">{icon}</span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

function PermissionCard({ title, description }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
      <div className="font-semibold text-gray-800 mb-2">{title}</div>

      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

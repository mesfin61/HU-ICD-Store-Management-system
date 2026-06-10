import React, { useState } from "react";
import ActiveSystemUsers from "../components/user managent/ActiveSystemUsers";
import AddUserModal from "../components/user managent/AddUserModal";
import PageTransition from "../animated_motion/PageTransition";
import { FaUserPlus } from "react-icons/fa";

export default function Users() {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUserCreated = () => {
    setRefreshKey((current) => current + 1);
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-4 px-4 py-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-primary">User Management</h2>
            <p className="font-semibold text-secondary">
              Manage administrative access and system permissions across the ICT
              Directorate.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#0b4a8b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#083c71]"
          >
            <FaUserPlus className="text-xs" />
            Add New User
          </button>
        </div>

        <ActiveSystemUsers refreshKey={refreshKey} />
        <AddUserModal
          isOpen={open}
          onClose={() => setOpen(false)}
          onUserCreated={handleUserCreated}
        />
      </div>
    </PageTransition>
  );
}

import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/AuthContext";

// =========================================================
// APPLICATION ROLES
// =========================================================

export const ROLES = Object.freeze({
  SUPER_ADMIN: "Super Admin",
  ADMINISTRATOR: "Administrator",
  STORE_MANAGER: "Store Manager",
  STAFF: "Staff",
});

// =========================================================
// ROLE PROTECTED ROUTE
// =========================================================

function RoleProtectedRoute({ allowedRoles = [], children }) {
  const { user, loading } = useUser();

  // =======================================================
  // AUTHENTICATION STILL LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // =======================================================
  // NOT AUTHENTICATED
  // =======================================================

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // =======================================================
  // CURRENT ROLE
  // =======================================================

  const userRole = user.role;

  const hasAdministratorAccess =
    userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMINISTRATOR;

  // =======================================================
  // ROLE CHECK
  // =======================================================

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(userRole) &&
    !(hasAdministratorAccess && allowedRoles.includes(ROLES.ADMINISTRATOR))
  ) {
    return <Navigate to="/" replace />;
  }

  // =======================================================
  // AUTHORIZED
  // =======================================================

  return children;
}

export default RoleProtectedRoute;

import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/AuthContext";

// =========================================================
// APPLICATION ROLES
// =========================================================

export const ROLES = Object.freeze({
  ADMINISTRATOR: "Administrator",
  STORE_MANAGER: "Store Manager",
  STAFF: "Staff",
});

// =========================================================
// ROLE PROTECTED ROUTE
// =========================================================

function RoleProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const {
    user,
    loading,
  } = useUser();

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
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // =======================================================
  // CURRENT ROLE
  // =======================================================

  const userRole =
    user.role;

  // =======================================================
  // ROLE CHECK
  // =======================================================

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(userRole)
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  // =======================================================
  // AUTHORIZED
  // =======================================================

  return children;
}

export default RoleProtectedRoute;
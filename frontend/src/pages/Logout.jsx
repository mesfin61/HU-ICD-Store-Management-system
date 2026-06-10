import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../animated_motion/PageTransition";

export default function Logout() {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-lg text-gray-700">Logging out...</p>
      </div>
    </PageTransition>
  );
}

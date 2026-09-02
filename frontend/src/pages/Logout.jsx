import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../animated_motion/PageTransition";
import apiClient from "../services/apiClient";

export default function Logout() {
  const navigate = useNavigate();
  const [message, setMessage] = useState(
    "Logging out...",
  );

  useEffect(() => {
    let mounted = true;

    async function logout() {
      try {
        await apiClient.post("/api/auth/logout");

        if (mounted) {
          setMessage("Logged out successfully.");
        }
      } catch (error) {
        console.error(
          "[Logout] Server logout failed:",
          error,
        );

        /*
         * We still redirect to login because a failed
         * logout request must not leave the user trapped
         * on the logout page.
         */
        if (mounted) {
          setMessage("Signing out...");
        }
      } finally {
        if (mounted) {
          navigate("/login", {
            replace: true,
          });
        }
      }
    }

    logout();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-lg text-gray-700">
          {message}
        </p>
      </div>
    </PageTransition>
  );
}
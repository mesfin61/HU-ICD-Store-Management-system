import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTransition from "../animated_motion/PageTransition";
import apiClient from "../services/apiClient";
import { useUser } from "../context/AuthContext";

export default function Logout() {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [message, setMessage] = useState("Logging out...");

  useEffect(() => {
    let mounted = true;

    async function logout() {
      try {
        await apiClient.post("/api/auth/logout");
      } catch (error) {
        console.error("[Logout] Server logout failed:", error);

        /*
         * We still redirect to login because a failed
         * logout request must not leave the user trapped
         * on the logout page.
         */
      } finally {
        if (mounted) {
          setUser(null);
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
        <p className="text-lg text-gray-700">{message}</p>
      </div>
    </PageTransition>
  );
}

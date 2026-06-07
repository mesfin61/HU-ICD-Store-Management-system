import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearStoredCurrentUser } from "../components/user managent/userStorage";

export default function Logout() {
  const nav = useNavigate();
  useEffect(() => {
    clearStoredCurrentUser();
    nav("/login", { replace: true });
  }, [nav]);
  return null;
}

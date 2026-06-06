import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const nav = useNavigate();
  useEffect(() => {
    // placeholder: perform logout then redirect
    nav("/login");
  }, []);
  return null;
}

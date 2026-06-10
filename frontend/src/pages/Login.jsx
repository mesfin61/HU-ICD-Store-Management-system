import React, { useState } from "react";
import API_URL from "../config/api";
import axios from "axios";
import { FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";
import { MdOutlineInventory2, MdOutlineShield } from "react-icons/md";
import { HiOutlineBuildingLibrary } from "react-icons/hi2";
import { Navigate, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCredentials((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError(false);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (token) {
        return <Navigate to="/" replace />;
      }

      const response = await axios.post(
        `${API_URL}/api/auth/login`,
        { email: credentials.email, password: credentials.password },
        { withCredentials: true },
      );

      if (response.data.success) {
        const token = response.data.token;
        console.log("Login successful, token:", token);
        const user = response.data.user;
        console.log("User data:", user);

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        setMessage("Login successful!");

        setError(false);

        navigate("/");
      }
    } catch (error) {
      setError(true);
      setMessage(
        error.response?.data?.message || "Login failed. Please try again.",
      );
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-white font-sans">
      <aside
        className="hidden lg:flex lg:w-[50%] xl:w-[48%] flex-col justify-between p-10 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #0d2d6b 0%, #1141a0 45%, #0a2460 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 48px), repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 48px)",
          }}
        />

        {/* faint diagonal text watermark */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
          style={{ transform: "rotate(-30deg)" }}
        >
          <span
            className="text-white font-bold tracking-widest whitespace-nowrap"
            style={{ fontSize: "clamp(48px,10vw,110px)", opacity: 0.04 }}
          >
            HU-ICT
          </span>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 border border-white/25">
            <HiOutlineBuildingLibrary className="text-white text-2xl" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">
              Haramaya University
            </p>
            <p className="text-white/60 text-xs tracking-widest uppercase">
              ICT Directorate
            </p>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-5">
          <h1
            className="text-white font-extrabold leading-tight"
            style={{ fontSize: "clamp(26px,3.5vw,42px)" }}
          >
            Secure Store
            <br />
            Management System
          </h1>
          <p className="text-white/70 text-sm leading-7 max-w-sm">
            Streamline the lifecycle of institutional assets with precision. Our
            integrated platform ensures real-time tracking, transparent
            auditing, and efficient logistics for the university's technological
            infrastructure.
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {[
            {
              icon: <MdOutlineInventory2 className="text-xl" />,
              label: "Real-time Inventory",
            },
            {
              icon: <MdOutlineShield className="text-xl" />,
              label: "Asset Protection",
            },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm"
            >
              <span className="text-white/80">{icon}</span>
              <span className="text-white text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex flex-1 flex-col items-center justify-between px-6 py-10 sm:px-12 bg-white">
        {/* spacer top */}
        <div />

        {/* Form card */}
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Please enter your credentials to access the system.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username */}
            <div>
              <input
                type="text"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                required
                placeholder="Username or Email"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 outline-none ring-0 transition focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={credentials.password}
                onChange={handleChange}
                required
                placeholder="Password"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-12 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {/* Remember me + forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600">
                <input
                  type="checkbox"
                  name="remember"
                  checked={credentials.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                />
                Remember Me
              </label>
              <button
                type="button"
                className="font-semibold text-blue-700 hover:text-blue-900 transition"
              >
                Forgot Password?
              </button>
            </div>

            {message && (
              <p
                className={`text-sm text-center ${error ? "text-red-500" : "text-green-600"}`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{
                background: "linear-gradient(90deg, #0d2d6b 0%, #1141a0 100%)",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <FiArrowRight size={16} />}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="w-full max-w-md space-y-4">
          <hr className="border-gray-200" />
          <p className="text-center text-sm text-gray-500">
            Need help?{" "}
            <a href="#" className="font-semibold text-blue-700 hover:underline">
              Contact ICT Support
            </a>
          </p>
          <p className="text-center text-xs tracking-widest uppercase text-gray-400">
            © 2024 Haramaya University ICT Directorate
          </p>
        </div>
      </main>
    </div>
  );
}

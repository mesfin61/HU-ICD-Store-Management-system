import React, { useState } from "react";
import { FiLock, FiMail, FiShield, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    remember: true,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCredentials((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.32),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(14,165,233,0.2),_transparent_24%),linear-gradient(135deg,_#07111f_0%,_#0b1b31_50%,_#020817_100%)]" />
      <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-[-6rem] right-[-6rem] h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/8 shadow-[0_30px_120px_rgba(2,6,23,0.55)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative flex flex-col justify-between gap-8 border-b border-white/10 bg-slate-900/70 p-8 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-lg font-bold text-white shadow-lg shadow-blue-500/30">
                HU
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-400">
                  Store Management
                </p>
                <h1 className="text-2xl font-semibold text-white">
                  HU-ICT Secure Access
                </h1>
              </div>
            </div>

            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                <FiShield />
                Modal Login
              </span>
              <div className="space-y-4">
                <h2 className="max-w-sm text-4xl font-semibold leading-tight text-white">
                  Sign in to manage inventory, requests, and stock movement.
                </h2>
                <p className="max-w-md text-sm leading-6 text-slate-300">
                  Use the modal to authenticate before entering the dashboard.
                  This keeps the interface focused while still feeling like a
                  distinct overlay.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Inventory control", "Track item quantities and status."],
                  ["Request approvals", "Review and process supply requests."],
                  ["Live analytics", "Monitor trends and low-stock alerts."],
                  ["Role-based access", "Separate admin and user workflows."],
                ].map(([title, description]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="font-medium text-white">{title}</p>
                    <p className="mt-1 text-sm text-slate-300">{description}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              HU-ICT Store Management System
            </p>
          </section>

          <section className="flex items-center justify-center bg-slate-950/70 p-6 sm:p-10">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-slate-950/40 sm:p-8"
            >
              <div className="mb-6 space-y-2">
                <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">
                  Welcome back
                </p>
                <h2 className="text-3xl font-semibold text-white">Login</h2>
                <p className="text-sm leading-6 text-slate-400">
                  Enter your credentials to continue into the dashboard.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">
                    Email Address
                  </span>
                  <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 focus-within:border-cyan-400/60">
                    <FiMail className="text-cyan-300" />
                    <input
                      type="email"
                      name="email"
                      value={credentials.email}
                      onChange={handleChange}
                      required
                      placeholder="admin@hu-ict.local"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                    />
                  </span>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-200">
                    Password
                  </span>
                  <span className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 focus-within:border-cyan-400/60">
                    <FiLock className="text-cyan-300" />
                    <input
                      type="password"
                      name="password"
                      value={credentials.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                    />
                  </span>
                </label>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-300">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={credentials.remember}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-400"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="font-medium text-cyan-300 transition hover:text-cyan-200"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Sign in
                <FiArrowRight />
              </button>

              <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                Demo access screen only. Hook this form to the backend when the
                auth API is ready.
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

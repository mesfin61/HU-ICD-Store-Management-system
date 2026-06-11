import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiArrowRight,
  FiArrowLeft,
  FiMail,
  FiHelpCircle,
  FiLock,
} from "react-icons/fi";
import API_URL from "../config/api";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email,
      });

      setMessage(response.data.message);
      setStep("otp");
    } catch (err) {
      setError(true);
      setMessage(
        err.response?.data?.message || "Unable to send verification code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError(true);
      setMessage("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError(true);
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
        otp,
        newPassword,
      });

      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200">
          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            <div
              className={`h-2 w-20 rounded-full ${
                step === "email" ? "bg-blue-700" : "bg-green-600"
              }`}
            />

            <div
              className={`h-2 w-20 rounded-full ${
                step === "otp" ? "bg-blue-700" : "bg-slate-200"
              }`}
            />
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900">
              {step === "email" ? "Forgot Password?" : "Verify OTP"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {step === "email"
                ? "Enter your email address and we'll send you a verification code."
                : "Enter the verification code and create a new password."}
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div
              className={`mb-5 text-sm text-center rounded-xl p-3 ${
                error
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-green-50 text-green-600 border border-green-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* STEP 1 */}
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>

                <div className="relative">
                  <FiMail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@haramaya.edu.et"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-200 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
                style={{
                  background: "linear-gradient(90deg,#0d2d6b 0%,#1141a0 100%)",
                }}
              >
                {loading ? "Sending OTP..." : "Send Verification Code"}

                {!loading && <FiArrowRight size={18} />}
              </button>
            </form>
          ) : (
            /* STEP 2 */
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <p className="text-sm text-slate-500 mt-1">
                  Verification code sent to{" "}
                  <span className="text-blue-700 font-medium">{email}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verification Code
                </label>

                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full py-4 rounded-xl border border-slate-300 text-center text-2xl font-bold tracking-[8px] focus:border-blue-700 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  New Password
                </label>

                <div className="relative">
                  <FiLock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>

                <div className="relative">
                  <FiLock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3.5 font-semibold text-white transition hover:opacity-90"
                style={{
                  background: "linear-gradient(90deg,#0d2d6b 0%,#1141a0 100%)",
                }}
              >
                {loading ? "Verifying..." : "Verify OTP & Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setMessage("");
                }}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                Use a different email
              </button>
            </form>
          )}

          {/* Back */}
          <div className="mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-800 hover:text-blue-900"
            >
              <FiArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

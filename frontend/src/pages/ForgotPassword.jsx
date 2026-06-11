import { useState, useEffect } from "react";
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
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (step !== "otp" || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    if (!message || error) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 15000);

    return () => clearTimeout(timer);
  }, [message, error]);

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
      setCountdown(60);
    } catch (err) {
      setError(true);
      setMessage(
        err.response?.data?.message || "Unable to send verification code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResending(true);
      setMessage("");
      setError(false);

      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email,
      });

      setMessage(res.data.message || "Verification code resent.");

      setCountdown(60);
    } catch (err) {
      setError(true);
      setMessage(
        err.response?.data?.message || "Failed to resend verification code.",
      );
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email,
        otp,
      });

      setMessage(res.data.message);
      setStep("resetPassword");
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
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
      const res = await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
        newPassword,
      });

      setMessage(res.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200">
          <div className="flex justify-center gap-2 mb-8">
            {/* Step 1 */}
            <div
              className={`h-2 w-20 rounded-full ${
                step === "email" ? "bg-blue-700" : "bg-green-600"
              }`}
            />

            <div
              className={`h-2 w-20 rounded-full ${
                step === "otp"
                  ? "bg-blue-700"
                  : step === "resetPassword"
                    ? "bg-green-600"
                    : "bg-gray-300"
              }`}
            />

            <div
              className={`h-2 w-20 rounded-full ${
                step === "resetPassword" ? "bg-blue-700" : "bg-gray-300"
              }`}
            />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900">
              {step === "email"
                ? "Forgot Password?"
                : step === "otp"
                  ? "Verify OTP"
                  : "Reset Password"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {step === "email"
                ? "Enter your email address and we'll send you a verification code."
                : step === "otp"
                  ? `Enter the verification code we sent to your email. ${email} `
                  : "Create a new password."}
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
          ) : step === "otp" ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3.5 font-semibold text-white transition hover:opacity-90"
                style={{
                  background: "linear-gradient(90deg,#0d2d6b 0%,#1141a0 100%)",
                }}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-slate-500">
                    Resend code in{" "}
                    <span className="font-medium">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-sm font-medium text-blue-700 hover:text-blue-800"
                  >
                    {resending ? "Resending..." : "Resend verification code"}
                  </button>
                )}
              </div>

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
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
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
                {loading ? "Resetting..." : "Reset Password"}
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

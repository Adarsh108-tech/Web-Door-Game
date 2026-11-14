"use client";

import React, { useState } from "react";
import { X, Mail, Lock, User, LogIn, UserPlus, Train, KeyRound } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: Record<string, unknown>, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("game_jwt", data.token);
        localStorage.setItem("game_user", JSON.stringify(data.user));
      }

      onSuccess(data.user, data.token);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPlay = () => {
    const randomGuestId = "guest_" + Math.random().toString(36).substring(2, 8);
    const guestUser = {
      id: randomGuestId,
      name: `TrackRunner_${Math.floor(100 + Math.random() * 900)}`,
      email: `${randomGuestId}@guest.local`,
      avatar: "#16D466",
      isGuest: true,
    };
    onSuccess(guestUser, "guest_token");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md arcade-panel overflow-hidden text-white">
        {/* Top Hazard Stripe Header Accent */}
        <div className="h-3.5 w-full hazard-stripes border-b-2 border-[#111629]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn-3d btn-3d-gray absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center p-0 z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-[#5CB0FF] to-[#1E88FF] border-3 border-[#111629] shadow-[0_5px_0_#0D52B5] mb-2.5">
              <Train className="w-7 h-7 text-white drop-shadow" />
            </div>
            <h2 className="font-arcade text-3xl sm:text-4xl text-white text-stroke-ink tracking-wide">
              {isLogin ? (
                <>
                  SUBWAY <span className="text-[#FFD21F]">CHECK-IN</span>
                </>
              ) : (
                <>
                  METRO <span className="text-[#16D466]">PASS REGISTRATION</span>
                </>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-semibold mt-1">
              Sign in with your Gmail &amp; password for global runner ranking.
            </p>
          </div>

          {/* 3D Segmented Switcher */}
          <div className="recessed-well p-1.5 rounded-2xl mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`btn-3d py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 ${
                isLogin
                  ? "btn-3d-green text-white"
                  : "bg-transparent border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`btn-3d py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 ${
                !isLogin
                  ? "btn-3d-green text-white"
                  : "bg-transparent border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Register
            </button>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 bg-[#FF4757]/20 border-2 border-[#FF4757] rounded-xl text-red-200 text-xs sm:text-sm text-center font-bold">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Runner Nickname
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. SpeedRunner99"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full recessed-well rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16D466] transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                Gmail / Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="runner@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full recessed-well rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16D466] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full recessed-well rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16D466] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-3d btn-3d-green w-full py-3.5 rounded-2xl text-base tracking-wide flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              <KeyRound className="w-5 h-5" />
              {loading
                ? "VALIDATING..."
                : isLogin
                ? "ENTER SUBWAY PLATFORM"
                : "ISSUE METRO PASS"}
            </button>
          </form>

          {/* Quick Guest Play */}
          <div className="mt-5 pt-3.5 border-t-2 border-[#111629] text-center">
            <button
              type="button"
              onClick={handleGuestPlay}
              className="text-xs text-gray-300 hover:text-[#FFD21F] font-bold underline transition"
            >
              Board Train as Guest (No persistent stats)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

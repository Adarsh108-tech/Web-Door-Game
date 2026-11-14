"use client";

import React, { useState } from "react";
import { X, Server, Wifi, WifiOff, ExternalLink, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ServerStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  currentUrl: string;
  onConnect: (url: string) => void;
}

export default function ServerStatusModal({
  isOpen,
  onClose,
  isConnected,
  currentUrl,
  onConnect,
}: ServerStatusModalProps) {
  const [inputUrl, setInputUrl] = useState(currentUrl);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(inputUrl);
  };

  const isVercelHost =
    typeof window !== "undefined" && window.location.hostname.includes("vercel.app");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg arcade-panel overflow-hidden text-white">
        {/* Top Hazard Trim */}
        <div className={`h-3.5 w-full ${isConnected ? "hazard-stripes" : "hazard-stripes-red"} border-b-2 border-[#111629]`} />

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
          <div className="text-center mb-5">
            <div
              className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border-3 border-[#111629] shadow-[0_5px_0_#111629] mb-2.5 ${
                isConnected
                  ? "bg-gradient-to-b from-[#4EF291] to-[#16D466]"
                  : "bg-gradient-to-b from-[#FF7A85] to-[#FF4757]"
              }`}
            >
              {isConnected ? (
                <Wifi className="w-7 h-7 text-white drop-shadow" />
              ) : (
                <WifiOff className="w-7 h-7 text-white drop-shadow" />
              )}
            </div>
            <h2 className="font-arcade text-2xl sm:text-3xl text-white text-stroke-ink tracking-wide">
              REAL-TIME <span className={isConnected ? "text-[#16D466]" : "text-[#FF4757]"}>SERVER STATUS</span>
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-arcade tracking-wider border-2 border-[#111629] flex items-center gap-1.5 ${
                  isConnected
                    ? "bg-[#16D466] text-white"
                    : "bg-[#FF4757] text-white animate-pulse"
                }`}
              >
                {isConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {isConnected ? "CONNECTED & READY" : "DISCONNECTED / OFFLINE"}
              </span>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="arcade-card p-4 space-y-2 text-xs sm:text-sm text-gray-200 mb-5">
            <div className="font-arcade text-xs text-[#FFD21F] tracking-wide uppercase flex items-center gap-1.5">
              <Server className="w-4 h-4" /> Why is the game server offline?
            </div>
            <p className="leading-relaxed text-gray-300">
              {isVercelHost ? (
                <>
                  You are viewing the app on <strong>Vercel</strong>. Vercel is a
                  stateless serverless host—it executes HTTP APIs but <strong>does not keep persistent WebSockets running</strong>.
                  That is why the buttons work locally on <code className="bg-black/50 px-1 py-0.5 rounded text-[#16D466]">localhost:3000</code>, but Vercel returns <code className="bg-black/50 px-1 py-0.5 rounded text-[#FF4757]">404 Not Found</code> for WebSockets.
                </>
              ) : (
                <>
                  The client cannot establish a WebSocket connection to the real-time multiplayer server.
                </>
              )}
            </p>

            <div className="pt-2 border-t border-white/10 text-xs">
              <strong className="text-[#16D466] font-arcade tracking-wide block mb-1">
                FAST SOLUTION (1-Click Deployment):
              </strong>
              <ol className="list-decimal pl-4 space-y-1 text-gray-300">
                <li>
                  Deploy this repository to <strong>Render</strong> or <strong>Railway</strong> (free tiers available). They run persistent <code className="bg-black/40 px-1 rounded text-[#FFD21F]">node server.js</code> with full WebSocket support.
                </li>
                <li>
                  In your Vercel Project Settings &gt; Environment Variables, add:
                  <div className="bg-[#0D1324] p-2 rounded-lg font-mono text-[11px] text-[#29D8FF] my-1 border border-[#111629] select-all">
                    NEXT_PUBLIC_SOCKET_URL = https://your-server.onrender.com
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Direct Custom WebSocket URL Tester */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider font-arcade mb-1">
                Custom WebSocket Backend URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://your-server.onrender.com or http://localhost:3000"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 recessed-well rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#16D466] transition"
                />
                <button
                  type="submit"
                  className="btn-3d btn-3d-green py-2 px-4 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  CONNECT
                </button>
              </div>
            </div>
          </form>

          {/* Quick Render / Deploy Links */}
          <div className="mt-5 pt-3.5 border-t-2 border-[#111629] flex items-center justify-between text-xs font-bold">
            <a
              href="https://dashboard.render.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5CB0FF] hover:text-[#1E88FF] flex items-center gap-1 underline"
            >
              Deploy on Render <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

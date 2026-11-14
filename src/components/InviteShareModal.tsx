"use client";

import React, { useState } from "react";
import { X, Copy, Check, Share2, ExternalLink, Ticket } from "lucide-react";

interface InviteShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export default function InviteShareModal({
  isOpen,
  onClose,
  roomCode,
}: InviteShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = `${origin}/?room=${roomCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Subway City Door Tag - Boarding Pass",
          text: `Board Track ${roomCode} for Subway City Door Tag! Outrun the catcher across 30 maze rooms!`,
          url: inviteUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md arcade-panel overflow-hidden text-white">
        {/* Top Hazard Stripe Border */}
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
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-b from-[#FFE875] to-[#FFD21F] border-3 border-[#111629] shadow-[0_5px_0_#C99200] mb-2.5">
              <Ticket className="w-7 h-7 text-[#111629] drop-shadow" />
            </div>
            <h2 className="font-arcade text-2xl sm:text-3xl text-white text-stroke-ink tracking-wide">
              DISPATCH <span className="text-[#FFD21F]">BOARDING PASS</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-semibold mt-1">
              Invite up to 5 friends to board Track {roomCode}.
            </p>
          </div>

          {/* Glowing LED Track Code Display */}
          <div className="led-board p-4 text-center mb-4 border-2 border-[#FFD21F]/40">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
              TRANSIT TRACK NUMBER
            </div>
            <div className="font-arcade text-4xl sm:text-5xl tracking-widest text-[#FFD21F] text-arcade-shadow font-mono">
              {roomCode}
            </div>
          </div>

          {/* Invite URL Box */}
          <div className="space-y-1.5 mb-5">
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              Direct Passenger Link
            </label>
            <div className="flex items-center gap-2 recessed-well rounded-xl p-2 pl-3">
              <span className="text-xs text-gray-300 font-mono font-bold truncate flex-1 select-all">
                {inviteUrl}
              </span>
              <button
                onClick={handleCopy}
                className={`btn-3d py-2 px-3 rounded-lg text-xs flex items-center gap-1.5 ${
                  copied ? "btn-3d-green" : "btn-3d-yellow"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    COPIED!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    COPY
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleNativeShare}
              className="btn-3d btn-3d-blue py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              SHARE LINK
            </button>
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Board Track ${roomCode} for Subway City Door Tag! 5-minute match: ${inviteUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-3d btn-3d-green py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              WHATSAPP
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

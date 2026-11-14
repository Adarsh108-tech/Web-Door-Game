"use client";

import React from "react";
import { LeaderboardEntry } from "@/types/game";
import { Trophy, Crown, RotateCcw, Share2, LogOut } from "lucide-react";

interface LeaderboardModalProps {
  isOpen: boolean;
  leaderboard: LeaderboardEntry[];
  currentPlayerId: string;
  isHost?: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
  onShare: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function LeaderboardModal({
  isOpen,
  leaderboard,
  currentPlayerId,
  onPlayAgain,
  onLeave,
  onShare,
}: LeaderboardModalProps) {
  if (!isOpen || !leaderboard || leaderboard.length === 0) return null;

  const winner = leaderboard[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xl arcade-panel overflow-hidden text-white">
        {/* Top Hazard Stripe Bar */}
        <div className="h-3.5 w-full hazard-stripes border-b-2 border-[#111629]" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center relative z-10 mb-5">
            <div className="inline-flex items-center justify-center relative mb-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#FFE875] to-[#FFD21F] border-3 border-[#111629] shadow-[0_6px_0_#C99200] flex items-center justify-center">
                <Trophy className="w-9 h-9 text-[#111629] drop-shadow" />
              </div>
              <Crown className="w-7 h-7 text-[#FFD21F] absolute -top-3.5 -right-2 animate-bounce drop-shadow-[0_2px_0_#111629]" />
            </div>

            <h2 className="font-arcade text-3xl sm:text-4xl text-white text-stroke-ink tracking-wide">
              MATCH OVER! <span className="text-[#FFD21F]">RUNNER PODIUM</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-bold mt-1">
              Final Ranking: <strong className="text-[#16D466]">Maximum Runner Survival Time</strong> across 30 tracks
            </p>
          </div>

          {/* 1st Place Subway Champion Card */}
          {winner && (
            <div className="relative mb-5 p-4 rounded-2xl bg-gradient-to-r from-[#FFD21F]/25 via-[#FFD21F]/10 to-transparent border-3 border-[#FFD21F] shadow-[0_6px_0_#C99200] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Gold Metro Token */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#FFE875] to-[#FFD21F] text-[#111629] border-3 border-[#111629] shadow-[0_3px_0_#C99200] font-arcade text-xl flex items-center justify-center font-black">
                  #1
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-arcade text-lg sm:text-xl text-white tracking-wide">
                      {winner.name}
                    </span>
                    <span className="hazard-stripes-sm px-2 py-0.5 rounded text-[10px] font-arcade text-[#111629] border border-[#111629]">
                      CHAMPION RUNNER
                    </span>
                    {winner.playerId === currentPlayerId && (
                      <span className="bg-[#16D466] text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-[#111629]">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-bold font-mono truncate max-w-[200px]">
                    {winner.email || "GUEST RUNNER"}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-gray-300 uppercase font-black tracking-wider">
                  SURVIVAL TIME
                </div>
                <div className="font-arcade text-2xl sm:text-3xl font-mono text-[#16D466] text-arcade-shadow">
                  {formatTime(winner.runnerTime)}
                </div>
              </div>
            </div>
          )}

          {/* Metro Passenger Rankings Table */}
          <div className="recessed-well rounded-2xl overflow-hidden mb-5 max-h-52 overflow-y-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#1E2B4D] text-[#FFD21F] text-[10px] sm:text-xs font-arcade uppercase border-b-2 border-[#111629]">
                <tr>
                  <th className="py-2.5 px-3">Token Rank</th>
                  <th className="py-2.5 px-3">Passenger</th>
                  <th className="py-2.5 px-3 text-right">Runner Time</th>
                  <th className="py-2.5 px-3 text-right">Catcher Time</th>
                  <th className="py-2.5 px-3 text-right">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#111629] font-mono font-bold">
                {leaderboard.map((entry) => {
                  const isCurrent = entry.playerId === currentPlayerId;
                  return (
                    <tr
                      key={entry.playerId}
                      className={`transition-colors ${
                        isCurrent
                          ? "bg-[#16D466]/20 text-white"
                          : "hover:bg-white/5 text-gray-200"
                      }`}
                    >
                      <td className="py-2.5 px-3 font-arcade">
                        {entry.rank === 1 ? (
                          <span className="text-[#FFD21F] flex items-center gap-1">
                            🥇 #1 GOLD
                          </span>
                        ) : entry.rank === 2 ? (
                          <span className="text-gray-300 flex items-center gap-1">
                            🥈 #2 SILVER
                          </span>
                        ) : entry.rank === 3 ? (
                          <span className="text-amber-500 flex items-center gap-1">
                            🥉 #3 BRONZE
                          </span>
                        ) : (
                          <span className="text-gray-400">#{entry.rank} PASS</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full border border-[#111629]"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="font-bold truncate max-w-[120px] sm:max-w-[150px]">
                            {entry.name}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] bg-[#16D466] text-white px-1 rounded font-black">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-[#16D466]">
                        {formatTime(entry.runnerTime)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#FF7A85]">
                        {formatTime(entry.catcherTime)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-300">
                        {entry.catches}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 3D Action Push Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onPlayAgain}
              className="btn-3d btn-3d-green flex-1 py-3.5 px-4 rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              DEPART NEXT RUN (PLAY AGAIN)
            </button>

            <button
              onClick={onShare}
              className="btn-3d btn-3d-blue py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              INVITE PASSENGERS
            </button>

            <button
              onClick={onLeave}
              className="btn-3d btn-3d-red py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              EXIT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Player } from "@/types/game";
import { Radar, Maximize2, Minimize2, Compass, Train } from "lucide-react";

interface CatcherRadarProps {
  currentRoom: number;
  players: Record<string, Player>;
  currentPlayerId: string;
}

export default function CatcherRadar({
  currentRoom,
  players,
  currentPlayerId,
}: CatcherRadarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter out catcher to find all runners
  const runners = Object.values(players).filter(
    (p) => p.id !== currentPlayerId && !p.isCatcher
  );

  // Group runners by their room index (1..30)
  const runnersByRoom: Record<number, Player[]> = {};
  runners.forEach((r) => {
    if (!runnersByRoom[r.room]) {
      runnersByRoom[r.room] = [];
    }
    runnersByRoom[r.room].push(r);
  });

  // Adjacent track door hints: North (-6), South (+6), West (-1), East (+1)
  const adjacentHints = {
    North: currentRoom - 6 >= 1 && (runnersByRoom[currentRoom - 6]?.length || 0) > 0,
    South: currentRoom + 6 <= 30 && (runnersByRoom[currentRoom + 6]?.length || 0) > 0,
    West: (currentRoom - 1) % 6 !== 0 && (runnersByRoom[currentRoom - 1]?.length || 0) > 0,
    East: currentRoom % 6 !== 0 && (runnersByRoom[currentRoom + 1]?.length || 0) > 0,
  };

  const runnersInSameRoom = runnersByRoom[currentRoom] || [];

  return (
    <aside
      aria-label="Catcher Subway Radar"
      className="fixed top-14 right-3 z-40 flex flex-col items-end pointer-events-auto select-none"
    >
      {/* Header / Toggle Button */}
      <div className="btn-3d btn-3d-red py-1.5 px-3 rounded-full flex items-center gap-2">
        <div className="relative flex items-center justify-center">
          <Radar className="w-4 h-4 text-white animate-spin" style={{ animationDuration: "2.5s" }} />
          <span className="absolute w-2.5 h-2.5 rounded-full bg-white animate-ping opacity-75" />
        </div>
        <span className="font-arcade text-xs tracking-wider uppercase text-white">
          CATCHER RADAR
        </span>
        <span className="bg-[#111629] text-[10px] font-black px-2 py-0.5 rounded-full text-[#FFD21F] border border-[#FFD21F]/40 font-mono">
          {runners.length} RUNNERS
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white hover:text-[#FFE875] p-0.5 transition"
          title={isExpanded ? "Minimize Radar" : "Expand Radar"}
        >
          {isExpanded ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expanded Subway Map Scanner */}
      {isExpanded && (
        <div className="mt-2 w-72 sm:w-80 arcade-panel overflow-hidden p-3.5 text-white animate-fadeIn">
          {/* Radar Header with Alert */}
          <div className="flex justify-between items-center mb-2.5 pb-2 border-b-2 border-[#111629]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200 font-arcade tracking-wide">
              <Train className="w-3.5 h-3.5 text-[#FF4757]" />
              <span>30-STATION METRO GRID</span>
            </div>
            {runnersInSameRoom.length > 0 && (
              <span className="hazard-stripes-red text-[10px] text-white font-arcade px-2 py-0.5 rounded-md border border-[#111629] animate-bounce shadow">
                ⚠️ {runnersInSameRoom.length} IN THIS ROOM!
              </span>
            )}
          </div>

          {/* 5x6 Metro Station Grid (Rooms 1 to 30) */}
          <div className="recessed-well p-2 rounded-xl relative overflow-hidden">
            {/* Subtle radar scanline overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FF4757]/10 to-transparent pointer-events-none opacity-40 animate-pulse" />

            <div className="grid grid-cols-6 gap-1 relative z-10">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((roomNum) => {
                const isCatcherRoom = roomNum === currentRoom;
                const runnersHere = runnersByRoom[roomNum] || [];
                const hasRunners = runnersHere.length > 0;

                return (
                  <div
                    key={roomNum}
                    title={`Station ${roomNum}: ${
                      isCatcherRoom
                        ? "Catcher Location"
                        : `${runnersHere.length} runners detected`
                    }`}
                    className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-[10px] font-mono font-black border-2 transition-all ${
                      isCatcherRoom
                        ? "bg-[#FF4757] text-white border-[#111629] shadow-[0_3px_0_#B81D2B] scale-105 z-10 animate-pulse"
                        : hasRunners
                        ? "bg-[#16D466] text-white border-[#111629] shadow-[0_3px_0_#0B8A40] animate-bounce"
                        : "bg-[#151E36] text-gray-400 border-[#111629] hover:bg-[#1E2B4D]"
                    }`}
                  >
                    <span>{roomNum}</span>

                    {/* Runner Count Badge */}
                    {hasRunners && !isCatcherRoom && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FFD21F] text-[#111629] text-[9px] font-black rounded-full flex items-center justify-center border border-[#111629]">
                        {runnersHere.length}
                      </div>
                    )}

                    {/* Both Catcher and Runner in Same Room! */}
                    {isCatcherRoom && hasRunners && (
                      <span className="absolute bottom-0 text-[7px] text-[#FFD21F] font-black">
                        TAG!
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Adjacent Track Door Signals */}
          <div className="mt-2.5 pt-2 border-t-2 border-[#111629] flex items-center justify-between text-[11px] font-bold">
            <span className="text-gray-300 flex items-center gap-1 font-arcade tracking-wider">
              <Compass className="w-3.5 h-3.5 text-[#FFD21F]" />
              TRACK DOORS:
            </span>
            <div className="flex gap-1.5">
              {adjacentHints.North && (
                <span className="bg-[#16D466] text-[#111629] text-[9px] px-1.5 py-0.5 rounded font-black border border-[#111629]">
                  ▲ NORTH
                </span>
              )}
              {adjacentHints.South && (
                <span className="bg-[#16D466] text-[#111629] text-[9px] px-1.5 py-0.5 rounded font-black border border-[#111629]">
                  ▼ SOUTH
                </span>
              )}
              {adjacentHints.West && (
                <span className="bg-[#16D466] text-[#111629] text-[9px] px-1.5 py-0.5 rounded font-black border border-[#111629]">
                  ◀ WEST
                </span>
              )}
              {adjacentHints.East && (
                <span className="bg-[#16D466] text-[#111629] text-[9px] px-1.5 py-0.5 rounded font-black border border-[#111629]">
                  ▶ EAST
                </span>
              )}
              {!adjacentHints.North &&
                !adjacentHints.South &&
                !adjacentHints.West &&
                !adjacentHints.East && (
                  <span className="text-[10px] text-gray-400 italic font-mono">
                    Runners in distant rooms
                  </span>
                )}
            </div>
          </div>

          {/* Active Runner Location Feed */}
          <div className="mt-2 max-h-24 overflow-y-auto space-y-1 pr-1 font-mono">
            {runners.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between recessed-well px-2 py-1 rounded-lg text-[10px]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0 border border-[#111629]"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="truncate font-bold text-white">{r.name}</span>
                </div>
                <span
                  className={`font-black px-1.5 py-0.2 rounded border ${
                    r.room === currentRoom
                      ? "bg-[#FF4757] text-white border-[#111629] animate-pulse"
                      : "bg-[#1E2B4D] text-[#16D466] border-[#111629]"
                  }`}
                >
                  TRACK {r.room}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

"use client";

import React, { useState } from "react";
import { RoomState } from "@/types/game";
import {
  Copy,
  Check,
  Share2,
  Crown,
  Play,
  LogOut,
  Flame,
  DoorOpen,
  Trophy,
  Snowflake,
  Train,
  Ticket,
  AlertTriangle,
} from "lucide-react";
import SubwayCityBackdrop from "./SubwayCityBackdrop";

interface LobbyProps {
  room: RoomState;
  currentPlayerId: string;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onOpenInvite: () => void;
}

export default function Lobby({
  room,
  currentPlayerId,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
  onOpenInvite,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const players = Object.values(room.players);
  const currentPlayer = room.players[currentPlayerId];
  const isHost = currentPlayer?.isHost;
  const isReady = currentPlayer?.isReady;
  const canStart = players.length >= 1;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = `${origin}/?room=${room.id}`;

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white select-none flex flex-col justify-between p-4 sm:p-7">
      {/* Background Rail Yard */}
      <SubwayCityBackdrop />

      {/* Top Station Header Bar */}
      <header className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between pb-4">
        {/* Station Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#5CB0FF] to-[#1E88FF] border-3 border-[#111629] shadow-[0_5px_0_#0D52B5] flex items-center justify-center">
            <Train className="w-7 h-7 text-white drop-shadow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-arcade text-2xl sm:text-3xl text-white text-stroke-ink tracking-wide">
                SUBWAY <span className="text-[#16D466]">PLATFORM 5</span>
              </h1>
              <span className="hazard-stripes-sm px-2 py-0.5 rounded text-[10px] font-arcade text-[#111629] border border-[#111629]">
                LIVE TRACKS
              </span>
            </div>
            <p className="text-xs text-gray-300 font-bold">
              30-Room Door Maze Tag • 5-Player Express Departure
            </p>
          </div>
        </div>

        {/* Exit Station Button */}
        <button
          onClick={onLeaveRoom}
          className="btn-3d btn-3d-red py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          Leave
        </button>
      </header>

      {/* Main Boarding Area */}
      <main className="relative z-10 max-w-5xl w-full mx-auto my-auto py-4 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Station Departures Sign & Hazard Rules */}
        <div className="lg:col-span-1 space-y-4">
          {/* Track Departure Board (Room Code) */}
          <div className="arcade-panel overflow-hidden p-5">
            {/* Board Header Trim */}
            <div className="h-2.5 -mx-5 -mt-5 mb-4 hazard-stripes border-b-2 border-[#111629]" />

            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase text-[#FFD21F] tracking-widest flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" /> Track Code
              </span>
              <span className="signal-green w-2.5 h-2.5 rounded-full bg-[#16D466]" />
            </div>

            {/* Glowing LED Departure Sign */}
            <div className="led-board py-3 px-4 text-center my-3 border-2 border-[#FFD21F]/40">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                SUBWAY STATION ID
              </div>
              <div className="font-arcade text-4xl sm:text-5xl tracking-widest text-[#FFD21F] text-arcade-shadow font-mono">
                {room.id}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={copyInviteLink}
                className={`btn-3d flex-1 py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 ${
                  copied ? "btn-3d-green" : "btn-3d-yellow"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "TRACK COPIED!" : "COPY TRACK LINK"}
              </button>

              <button
                onClick={onOpenInvite}
                title="Share Boarding Pass"
                className="btn-3d btn-3d-blue p-3 rounded-xl flex items-center justify-center"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Track Hazard Rules Panel */}
          <div className="arcade-card p-4 space-y-2.5 text-xs text-gray-200">
            <div className="flex items-center gap-2 font-arcade text-sm text-[#FFD21F] tracking-wide pb-2 border-b-2 border-[#111629]">
              <AlertTriangle className="w-4 h-4 text-[#FFD21F]" />
              SUBWAY TRANSIT RULES (5 MIN)
            </div>

            <div className="flex items-start gap-2 pt-1">
              <div className="w-6 h-6 rounded-lg bg-[#FF4757]/20 border-2 border-[#FF4757] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Flame className="w-3.5 h-3.5 text-[#FF4757]" />
              </div>
              <div>
                <strong className="text-[#FF4757]">1 Catcher:</strong> Moves
                faster (18px) with a real-time 30-room radar!
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#29D8FF]/20 border-2 border-[#29D8FF] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Snowflake className="w-3.5 h-3.5 text-[#29D8FF]" />
              </div>
              <div>
                <strong className="text-[#29D8FF]">5s Freeze Stun:</strong> Caught
                runners freeze 5s &amp; become the new Catcher!
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#16D466]/20 border-2 border-[#16D466] flex items-center justify-center flex-shrink-0 mt-0.5">
                <DoorOpen className="w-3.5 h-3.5 text-[#16D466]" />
              </div>
              <div>
                <strong className="text-[#16D466]">Track Doors:</strong> Escape
                through North, South, East, West doors.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#FFD21F]/20 border-2 border-[#FFD21F] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trophy className="w-3.5 h-3.5 text-[#FFD21F]" />
              </div>
              <div>
                <strong className="text-[#FFD21F]">1st Place:</strong> Highest
                accumulated Runner Survival Time wins!
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Subway Boarding Passes (Up to 5 Players) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="arcade-panel p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#111629]">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#16D466]" />
                <h2 className="font-arcade text-xl sm:text-2xl text-white text-stroke-sm">
                  BOARDING PASS ROSTER ({players.length}/{room.maxPlayers})
                </h2>
              </div>
              <span className="hazard-stripes-sm px-2.5 py-1 rounded-lg text-xs font-arcade text-[#111629] border-2 border-[#111629]">
                CAR CAPACITY: 5 PASSENGERS
              </span>
            </div>

            {/* Boarding Passes (Slots 1 to 5) */}
            <div className="space-y-3 mt-4">
              {Array.from({ length: room.maxPlayers }).map((_, index) => {
                const player = players[index];
                if (player) {
                  const isCurrent = player.id === currentPlayerId;
                  return (
                    <div
                      key={player.id}
                      className={`transit-ticket p-3.5 sm:p-4 flex items-center justify-between transition-all ${
                        isCurrent
                          ? "ring-2 ring-[#16D466] shadow-[0_6px_0_#0B8A40,0_10px_20px_rgba(22,212,102,0.25)]"
                          : ""
                      }`}
                    >
                      {/* Ticket tear notch left & right */}
                      <div className="ticket-notch-left" />
                      <div className="ticket-notch-right" />

                      {/* Ticket Left Info */}
                      <div className="flex items-center gap-3.5 pl-2">
                        {/* Subway Token / Color Badge */}
                        <div
                          className="w-11 h-11 rounded-2xl border-3 border-[#111629] shadow-[0_3px_0_#111629] flex items-center justify-center font-arcade text-lg text-white font-black"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-arcade text-base sm:text-lg text-white tracking-wide">
                              {player.name}
                            </span>
                            {player.isHost && (
                              <span className="bg-[#FFD21F] text-[#111629] text-[10px] font-black px-1.5 py-0.5 rounded border border-[#111629] flex items-center gap-1 shadow-sm">
                                <Crown className="w-3 h-3 fill-current" /> HOST
                              </span>
                            )}
                            {isCurrent && (
                              <span className="bg-[#16D466] text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-[#111629] shadow-sm">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 font-bold font-mono">
                            TICKET #{index + 1}0{index + 7} • {player.email ? player.email : "GUEST PASS"}
                          </div>
                        </div>
                      </div>

                      {/* Ticket Right: Ready Punch Stamp */}
                      <div className="pr-2">
                        {player.isReady ? (
                          <div className="btn-3d btn-3d-green px-3 py-1.5 rounded-xl text-xs font-arcade tracking-wider">
                            BOARDED ✓
                          </div>
                        ) : (
                          <div className="recessed-well px-3 py-1.5 rounded-xl text-xs font-bold text-gray-400">
                            WAITING...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Empty Boarding Pass Slot
                return (
                  <div
                    key={`empty-${index}`}
                    className="transit-ticket opacity-60 border-dashed p-3.5 flex items-center justify-between text-gray-400 text-xs"
                  >
                    <div className="ticket-notch-left" />
                    <div className="ticket-notch-right" />

                    <div className="flex items-center gap-3 pl-2">
                      <div className="w-10 h-10 rounded-2xl bg-black/40 border-2 border-dashed border-gray-600 flex items-center justify-center font-arcade text-gray-500">
                        {index + 1}
                      </div>
                      <span className="font-bold">
                        Empty Passenger Berth #{index + 1}...
                      </span>
                    </div>

                    <button
                      onClick={onOpenInvite}
                      className="pr-2 text-[#16D466] hover:text-[#4EF291] font-arcade tracking-wide text-xs underline"
                    >
                      + INVITE RUNNER
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="mt-6 pt-4 border-t-2 border-[#111629] flex flex-col sm:flex-row gap-3">
              <button
                onClick={onToggleReady}
                className={`btn-3d flex-1 py-3.5 px-4 rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2 ${
                  isReady ? "btn-3d-yellow" : "btn-3d-gray"
                }`}
              >
                {isReady ? "CANCEL BOARDING" : "CONFIRM BOARDING (READY)"}
              </button>

              {isHost && (
                <button
                  onClick={onStartGame}
                  disabled={!canStart}
                  className="btn-3d btn-3d-green flex-1 py-3.5 px-4 rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Play className="w-5 h-5 fill-white" />
                  DEPART 5-MIN EXPRESS
                </button>
              )}
            </div>

            {!isHost && (
              <p className="text-center text-xs font-bold text-gray-400 mt-3 italic">
                Waiting for Train Conductor (Host) to initiate departure...
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl w-full mx-auto text-center text-xs text-gray-400 font-bold pt-3">
        Subway City Rail Yard • Real-Time Tag Labyrinth • Maximum Runner Time Wins
      </footer>
    </div>
  );
}

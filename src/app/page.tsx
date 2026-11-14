"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import useKeyPress from "./components/useKeyPress";
import useScreenSize from "./functions/getScreenSize";
import Data from "../../public/assets/Data.json";
import { RoomState, Player, LeaderboardEntry } from "@/types/game";
import AuthModal from "@/components/AuthModal";
import Lobby from "@/components/Lobby";
import CatcherRadar from "@/components/CatcherRadar";
import LeaderboardModal from "@/components/LeaderboardModal";
import InviteShareModal from "@/components/InviteShareModal";
import SubwayCityBackdrop from "@/components/SubwayCityBackdrop";
import {
  Play,
  Share2,
  Clock,
  Flame,
  Shield,
  Zap,
  Snowflake,
  LogOut,
  User,
  Crown,
  Train,
} from "lucide-react";

interface DoorConfig {
  id: string;
  name: string;
  direction: "North" | "South" | "East" | "West";
  change: number;
}

const ALL_DOORS: DoorConfig[] = [
  { id: "north", name: "North Door", direction: "North", change: -6 },
  { id: "west", name: "West Door", direction: "West", change: -1 },
  { id: "east", name: "East Door", direction: "East", change: 1 },
  { id: "south", name: "South Door", direction: "South", change: 6 },
];

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function Home() {
  const player_right = "/assets/left_walk.gif";
  const player_left = "/assets/right_walk.gif";
  const player_front = "/assets/walk_front.gif";
  const player_back = "/assets/walk_up.gif";

  const { screenWidth, screenHeight, isClient } = useScreenSize();

  // Socket & Auth State
  const socketRef = useRef<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [errorBanner, setErrorBanner] = useState("");

  // Room State
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [tagBanner, setTagBanner] = useState<string>("");

  // Local Player Movement State
  const [currentRoom, setCurrentRoom] = useState<number>(16);
  const [playerSprite, setPlayerSprite] = useState<string>(player_front);
  const [top, setTop] = useState<number>(280);
  const [left, setLeft] = useState<number>(490);
  const [hasInitializedPosition, setHasInitializedPosition] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [notification, setNotification] = useState<string>("");

  // Responsiveness checks
  const isMobile = isClient && screenWidth < 768;
  const isLandscape = isClient && screenWidth > screenHeight && screenHeight < 550;

  const playerSize = useMemo(() => {
    if (isMobile) return { w: 48, h: 62 };
    return { w: 60, h: 76 };
  }, [isMobile]);

  const doorSize = useMemo(() => {
    if (isMobile) return { w: 68, h: 68 };
    return { w: 90, h: 90 };
  }, [isMobile]);

  const bottomReserved = useMemo(() => {
    if (!showControls) return 20;
    if (isLandscape) return 80;
    if (isMobile) return 175;
    return 20;
  }, [isMobile, isLandscape, showControls]);

  const playableHeight = Math.max(180, screenHeight - bottomReserved);
  const maxX = Math.max(0, screenWidth - playerSize.w);
  const maxY = Math.max(0, playableHeight - playerSize.h);

  // Current player from room state
  const myPlayer: Player | undefined = room?.players?.[playerId];
  const isCatcher = myPlayer?.isCatcher || false;
  const isStunned = myPlayer?.isStunned || false;

  // Catcher has slightly greater speed than runners!
  // Runner: 13px, Catcher: 18px
  const currentSpeed = useMemo(() => {
    if (isCatcher) return 18;
    return 13;
  }, [isCatcher]);

  // Check stored auth on client load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("game_user");
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch {
          // ignore
        }
      }

      // Check URL parameters for ?room=ROOM_CODE
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get("room") || params.get("r");
      if (urlRoom) {
        setRoomCodeInput(urlRoom.toUpperCase());
      }
    }
  }, []);

  // Initialize Socket.io Connection
  useEffect(() => {
    const socket = io({
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setPlayerId(socket.id || "");
    });

    socket.on("room_joined", ({ room, playerId }: { room: RoomState; playerId: string }) => {
      setRoom(room);
      setPlayerId(playerId);
      setErrorBanner("");
    });

    socket.on("room_state", (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
    });

    socket.on("game_started", ({ room: updatedRoom }: { room: RoomState }) => {
      setRoom(updatedRoom);
      setCurrentRoom(16);
      if (screenWidth > 0 && screenHeight > 0) {
        setLeft(Math.floor((screenWidth - playerSize.w) / 2));
        setTop(Math.floor((playableHeight - playerSize.h) / 2));
      }
      setTagBanner("🚆 EXPRESS DEPARTED! 5-MINUTE COUNTDOWN STARTED!");
      setTimeout(() => setTagBanner(""), 3500);
    });

    socket.on("timer_tick", ({ remainingTime, players }: { remainingTime: number; players: Record<string, Player> }) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          remainingTime,
          players,
        };
      });
    });

    socket.on(
      "player_tagged",
      (data: {
        newCatcherId: string;
        newCatcherName: string;
        previousCatcherId: string;
        previousCatcherName: string;
        stunDuration: number;
        room: RoomState;
      }) => {
        setRoom(data.room);
        const isMeCaught = data.newCatcherId === socket.id;

        if (isMeCaught) {
          setTagBanner("❄️ YOU WERE CAUGHT! STUNNED FOR 5s... YOU ARE THE NEW CATCHER!");
        } else {
          setTagBanner(
            `💥 ${data.previousCatcherName} CAUGHT ${data.newCatcherName}! ${data.newCatcherName} is frozen 5s & is now the CATCHER!`
          );
        }
        setTimeout(() => setTagBanner(""), 4500);
      }
    );

    socket.on("player_unstunned", ({ playerId: unstunnedId }: { playerId: string }) => {
      setRoom((prev) => {
        if (!prev) return null;
        const p = prev.players[unstunnedId];
        if (p) p.isStunned = false;
        return { ...prev };
      });
      if (unstunnedId === socket.id) {
        setTagBanner("🔥 THAW COMPLETE! HUNT THE RUNNERS!");
        setTimeout(() => setTagBanner(""), 2500);
      }
    });

    socket.on("player_moved", ({ playerId: remotePid, x, y, sprite, room: remoteRoom }) => {
      setRoom((prev) => {
        if (!prev) return null;
        const p = prev.players[remotePid];
        if (!p) return prev;
        p.x = x;
        p.y = y;
        if (sprite) p.sprite = sprite;
        if (remoteRoom) p.room = remoteRoom;
        return { ...prev };
      });
    });

    socket.on("player_room_changed", ({ playerId: remotePid, room: targetRoom, x, y }) => {
      setRoom((prev) => {
        if (!prev) return null;
        const p = prev.players[remotePid];
        if (!p) return prev;
        p.room = targetRoom;
        if (typeof x === "number") p.x = x;
        if (typeof y === "number") p.y = y;
        return { ...prev };
      });
    });

    socket.on("catcher_reassigned", ({ message }: { message: string }) => {
      setTagBanner(`⚠️ ${message}`);
      setTimeout(() => setTagBanner(""), 3500);
    });

    socket.on("game_over", ({ leaderboard, room: finalRoom }: { leaderboard: LeaderboardEntry[]; room: RoomState }) => {
      setRoom({
        ...finalRoom,
        status: "ended",
        leaderboard,
      });
    });

    socket.on("error_message", ({ message }: { message: string }) => {
      setErrorBanner(message);
      setTimeout(() => setErrorBanner(""), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, [playableHeight, playerSize.h, playerSize.w, screenHeight, screenWidth]);

  // Center player on load
  useEffect(() => {
    if (isClient && !hasInitializedPosition && screenWidth > 0 && screenHeight > 0) {
      setLeft(Math.floor((screenWidth - playerSize.w) / 2));
      setTop(Math.floor((playableHeight - playerSize.h) / 2));
      setHasInitializedPosition(true);
    }
  }, [isClient, hasInitializedPosition, screenWidth, screenHeight, playableHeight, playerSize.w, playerSize.h]);

  // Keep player inside bounds on resize
  useEffect(() => {
    if (!hasInitializedPosition) return;
    setLeft((prev) => Math.min(Math.max(0, prev), maxX));
    setTop((prev) => Math.min(Math.max(0, prev), maxY));
  }, [maxX, maxY, hasInitializedPosition]);

  // Valid doors based on maze grid topology
  const validDoors = useMemo(() => {
    return ALL_DOORS.filter((door) => {
      if (door.direction === "North") return currentRoom > 6;
      if (door.direction === "South") return currentRoom <= 24;
      if (door.direction === "West") return (currentRoom - 1) % 6 !== 0;
      if (door.direction === "East") return currentRoom % 6 !== 0;
      return true;
    });
  }, [currentRoom]);

  // Responsive Door calculations
  const doors = useMemo(() => {
    return validDoors.map((config) => {
      let doorTop = 16;
      let doorLeft = Math.floor((screenWidth - doorSize.w) / 2);

      if (config.direction === "North") {
        doorTop = isMobile ? 12 : 24;
        doorLeft = Math.floor((screenWidth - doorSize.w) / 2);
      } else if (config.direction === "South") {
        doorTop = Math.max(16, playableHeight - doorSize.h - (isMobile ? 12 : 24));
        doorLeft = Math.floor((screenWidth - doorSize.w) / 2);
      } else if (config.direction === "West") {
        doorTop = Math.max(16, Math.floor((playableHeight - doorSize.h) / 2));
        doorLeft = isMobile ? 10 : 24;
      } else if (config.direction === "East") {
        doorTop = Math.max(16, Math.floor((playableHeight - doorSize.h) / 2));
        doorLeft = Math.max(10, screenWidth - doorSize.w - (isMobile ? 10 : 24));
      }

      const playerCenterX = left + playerSize.w / 2;
      const playerCenterY = top + playerSize.h / 2;
      const doorCenterX = doorLeft + doorSize.w / 2;
      const doorCenterY = doorTop + doorSize.h / 2;
      const distance = Math.hypot(doorCenterX - playerCenterX, doorCenterY - playerCenterY);

      const threshold = (doorSize.w + playerSize.w) / 2 + (isMobile ? 24 : 32);
      const isNearby = distance <= threshold;
      const targetRoom = currentRoom + config.change;

      return {
        ...config,
        top: doorTop,
        left: doorLeft,
        distance,
        isNearby,
        targetRoom,
      };
    });
  }, [validDoors, screenWidth, playableHeight, doorSize, playerSize, isMobile, left, top, currentRoom]);

  const nearbyDoor = useMemo(() => {
    return doors.find((d) => d.isNearby);
  }, [doors]);

  // Emit movement updates to socket
  const broadcastMovement = useCallback(
    (newX: number, newY: number, newSprite: string) => {
      if (socketRef.current && room?.status === "playing") {
        socketRef.current.emit("player_move", {
          x: newX,
          y: newY,
          sprite: newSprite,
          room: currentRoom,
        });
      }
    },
    [room?.status, currentRoom]
  );

  // Movement Functions (disabled when stunned!)
  const setUpDirection = useCallback(() => {
    if (isStunned) return;
    setTop((prev) => {
      const nextY = Math.max(prev - currentSpeed, 0);
      broadcastMovement(left, nextY, player_back);
      return nextY;
    });
    setPlayerSprite(player_back);
  }, [isStunned, currentSpeed, broadcastMovement, left, player_back]);

  const setDownDirection = useCallback(() => {
    if (isStunned) return;
    setTop((prev) => {
      const nextY = Math.min(prev + currentSpeed, maxY);
      broadcastMovement(left, nextY, player_front);
      return nextY;
    });
    setPlayerSprite(player_front);
  }, [isStunned, currentSpeed, maxY, broadcastMovement, left, player_front]);

  const setRightDirection = useCallback(() => {
    if (isStunned) return;
    setLeft((prev) => {
      const nextX = Math.min(prev + currentSpeed, maxX);
      broadcastMovement(nextX, top, player_left);
      return nextX;
    });
    setPlayerSprite(player_left);
  }, [isStunned, currentSpeed, maxX, broadcastMovement, top, player_left]);

  const setLeftDirection = useCallback(() => {
    if (isStunned) return;
    setLeft((prev) => {
      const nextX = Math.max(prev - currentSpeed, 0);
      broadcastMovement(nextX, top, player_right);
      return nextX;
    });
    setPlayerSprite(player_right);
  }, [isStunned, currentSpeed, broadcastMovement, top, player_right]);

  // Enter Door
  const enterDoor = useCallback(
    (doorToEnter?: (typeof doors)[0]) => {
      if (isStunned) {
        setNotification("❄️ You are frozen for 5 seconds!");
        setTimeout(() => setNotification(""), 1200);
        return;
      }

      const target = doorToEnter || nearbyDoor;
      if (!target || !target.isNearby) return;

      const newPage = target.targetRoom;
      setCurrentRoom(newPage);

      const newX = Math.floor((screenWidth - playerSize.w) / 2);
      const newY = Math.floor((playableHeight - playerSize.h) / 2);
      setLeft(newX);
      setTop(newY);

      if (socketRef.current) {
        socketRef.current.emit("change_room", {
          targetRoom: newPage,
          x: newX,
          y: newY,
        });
      }

      setNotification(`🚪 Switched to Track Room ${newPage}`);
      setTimeout(() => setNotification(""), 1400);
    },
    [isStunned, nearbyDoor, screenWidth, playerSize.w, playerSize.h, playableHeight]
  );

  // Key Bindings
  useKeyPress(["ArrowUp", "KeyW", "w", "W"], setUpDirection);
  useKeyPress(["ArrowDown", "KeyS", "s", "S"], setDownDirection);
  useKeyPress(["ArrowLeft", "KeyA", "a", "A"], setLeftDirection);
  useKeyPress(["ArrowRight", "KeyD", "d", "D"], setRightDirection);
  useKeyPress(["Enter", "NumpadEnter"], () => enterDoor());

  // Continuous movement for touch
  const activeMovementRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMoving = useCallback((directionFn: () => void) => {
    directionFn();
    if (intervalRef.current) clearInterval(intervalRef.current);
    activeMovementRef.current = directionFn;
    intervalRef.current = setInterval(() => {
      if (activeMovementRef.current) {
        activeMovementRef.current();
      }
    }, 60);
  }, []);

  const stopMoving = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    activeMovementRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Room Background
  const currentBackground = useMemo(() => {
    const item = Data.find((d) => d.index === currentRoom);
    return (
      (item as Record<string, string> | undefined)?.["background_img "] ||
      (item as Record<string, string> | undefined)?.["background_img"] ||
      "/assets/back16.gif"
    );
  }, [currentRoom]);

  // Other players in current room
  const otherPlayersInRoom = useMemo(() => {
    if (!room?.players) return [];
    return Object.values(room.players).filter(
      (p) => p.id !== playerId && p.room === currentRoom
    );
  }, [room?.players, playerId, currentRoom]);

  // Check if Catcher is in same room (Runner proximity warning)
  const isCatcherInMyRoom = useMemo(() => {
    if (isCatcher) return false;
    return otherPlayersInRoom.some((p) => p.isCatcher);
  }, [isCatcher, otherPlayersInRoom]);

  // Room Actions
  const handleJoinOrCreate = (code?: string) => {
    const targetRoomCode = code || roomCodeInput;
    if (socketRef.current) {
      socketRef.current.emit("join_room", {
        roomId: targetRoomCode ? targetRoomCode.trim().toUpperCase() : "",
        user: currentUser
          ? {
              userId: currentUser.id,
              name: currentUser.name,
              email: currentUser.email,
              avatar: currentUser.avatar,
            }
          : {
              name: `TrackRunner_${Math.floor(100 + Math.random() * 900)}`,
            },
      });
    }
  };

  const handleToggleReady = () => {
    if (socketRef.current) socketRef.current.emit("toggle_ready");
  };

  const handleStartGame = () => {
    if (socketRef.current) socketRef.current.emit("start_game");
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) socketRef.current.emit("leave_room");
    setRoom(null);
  };

  const handlePlayAgain = () => {
    if (socketRef.current) socketRef.current.emit("play_again");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("game_jwt");
      localStorage.removeItem("game_user");
    }
    setCurrentUser(null);
  };

  // Remaining time formatted (mm:ss)
  const formattedTime = useMemo(() => {
    const t = room?.remainingTime ?? 300;
    const mins = Math.floor(t / 60);
    const secs = t % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [room?.remainingTime]);

  // ================= RENDER LOGIC =================

  // 1. WELCOME / JOIN ROOM SCREEN (When not in any room)
  if (!room) {
    return (
      <div className="relative h-screen w-screen overflow-y-auto select-none flex flex-col justify-between p-4 sm:p-7 text-white">
        {/* Subway City Rail Yard Backdrop */}
        <SubwayCityBackdrop />

        {/* Top Station Header */}
        <header className="relative z-10 max-w-5xl w-full mx-auto flex justify-between items-center pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#5CB0FF] to-[#1E88FF] border-3 border-[#111629] shadow-[0_5px_0_#0D52B5] flex items-center justify-center">
              <Train className="w-7 h-7 text-white drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-arcade text-2xl sm:text-3xl text-white text-stroke-ink tracking-wide">
                  DOOR MAZE TAG <span className="text-[#FFD21F]">SUBWAY CITY</span>
                </h1>
                <span className="hazard-stripes-sm px-2 py-0.5 rounded text-[10px] font-arcade text-[#111629] border border-[#111629]">
                  30-TRACKS
                </span>
              </div>
              <p className="text-xs text-gray-300 font-bold">
                5-Player Multiplayer Tag Arena • 5-Minute Express
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="recessed-well flex items-center gap-2 px-3 py-1.5 rounded-full">
                <User className="w-4 h-4 text-[#16D466]" />
                <span className="text-xs font-bold font-arcade tracking-wider truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="text-gray-400 hover:text-[#FF4757] ml-1 p-0.5 rounded transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="btn-3d btn-3d-green py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                METRO PASS (SIGN IN)
              </button>
            )}
          </div>
        </header>

        {/* Error notification banner */}
        {errorBanner && (
          <div className="relative z-10 max-w-md mx-auto my-3 p-3 bg-[#FF4757] border-3 border-[#111629] shadow-[0_4px_0_#111629] rounded-xl text-white text-xs sm:text-sm text-center font-arcade tracking-wider animate-bounce">
            ⚠️ {errorBanner}
          </div>
        )}

        {/* Hero Card & Room Actions */}
        <main className="relative z-10 max-w-5xl w-full mx-auto my-auto py-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: About Game */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111629] border-2 border-[#16D466] text-[#4EF291] text-xs font-arcade tracking-wider shadow">
              <Zap className="w-4 h-4 text-[#FFD21F]" />
              ARCADE MULTIPLAYER ESCAPE
            </div>

            <h2 className="font-arcade text-4xl sm:text-6xl text-white text-stroke-ink tracking-tight leading-none">
              OUTRUN THE <br />
              <span className="text-[#FF4757]">CATCHER.</span> <br />
              SURVIVE THE <span className="text-[#16D466]">MAZE.</span>
            </h2>

            <p className="text-sm sm:text-base text-gray-200 font-semibold leading-relaxed drop-shadow">
              Up to <strong>5 players</strong> enter a 30-station labyrinth. One player is
              the faster <strong>Catcher</strong> with a map radar. When caught, you
              freeze for <strong>5 seconds</strong> and become the new Catcher! The passenger
              with the maximum Runner time wins the match!
            </p>

            {/* Feature Tokens Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="arcade-card p-3">
                <Clock className="w-5 h-5 text-[#FFD21F] mb-1 drop-shadow" />
                <div className="font-arcade text-xs text-white tracking-wider">5-MIN TIME LIMIT</div>
                <div className="text-[11px] text-gray-300 font-bold">Strict match duration</div>
              </div>
              <div className="arcade-card p-3">
                <Snowflake className="w-5 h-5 text-[#29D8FF] mb-1 drop-shadow" />
                <div className="font-arcade text-xs text-white tracking-wider">5s FREEZE STUN</div>
                <div className="text-[11px] text-gray-300 font-bold">Stunned upon tag</div>
              </div>
              <div className="arcade-card p-3">
                <Flame className="w-5 h-5 text-[#FF4757] mb-1 drop-shadow" />
                <div className="font-arcade text-xs text-white tracking-wider">CATCHER RADAR</div>
                <div className="text-[11px] text-gray-300 font-bold">30-room live scanner</div>
              </div>
              <div className="arcade-card p-3">
                <Crown className="w-5 h-5 text-[#FFD21F] mb-1 drop-shadow" />
                <div className="font-arcade text-xs text-white tracking-wider">RUNNER PODIUM</div>
                <div className="text-[11px] text-gray-300 font-bold">Max runner time wins</div>
              </div>
            </div>
          </div>

          {/* Right: Join & Create Track Box */}
          <div className="arcade-panel overflow-hidden p-6 sm:p-8 space-y-6">
            {/* Top Hazard Trim */}
            <div className="h-3 -mx-8 -mt-8 mb-5 hazard-stripes border-b-2 border-[#111629]" />

            <div className="text-center">
              <h3 className="font-arcade text-2xl sm:text-3xl text-white text-stroke-sm">
                SUBWAY STATION ACCESS
              </h3>
              <p className="text-xs text-gray-300 font-bold mt-1">
                Dispatch a new track or board with an invite code
              </p>
            </div>

            {/* Create Room Button */}
            <button
              onClick={() => handleJoinOrCreate("")}
              className="btn-3d btn-3d-green w-full py-4 rounded-2xl text-base sm:text-lg tracking-wide flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" />
              CREATE NEW TRACK (HOST)
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t-2 border-[#111629] w-full" />
              <span className="bg-[#1E2B4D] border-2 border-[#111629] rounded-full px-3 py-0.5 text-[10px] font-arcade text-[#FFD21F] uppercase tracking-widest absolute">
                OR
              </span>
            </div>

            {/* Join Existing Room with Code */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider font-arcade">
                Track Code / Invite ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. ABC123"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 recessed-well rounded-xl px-4 py-3 text-sm font-arcade tracking-widest text-white placeholder-gray-500 uppercase focus:outline-none focus:ring-2 focus:ring-[#16D466] transition"
                />
                <button
                  onClick={() => handleJoinOrCreate(roomCodeInput)}
                  disabled={!roomCodeInput.trim()}
                  className="btn-3d btn-3d-blue py-3 px-6 rounded-xl text-xs sm:text-sm font-arcade disabled:opacity-50"
                >
                  BOARD
                </button>
              </div>
            </div>

            {/* Sign in prompt */}
            {!currentUser && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="text-xs text-gray-300 hover:text-[#FFD21F] font-bold underline transition"
                >
                  Sign in with Gmail for persistent stats &amp; podium rank
                </button>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 max-w-5xl w-full mx-auto text-center text-xs text-gray-400 font-bold pt-4">
          Door Maze Tag • Subway City Edition • Real-Time 5-Player Express
        </footer>

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user as unknown as UserProfile);
          }}
        />
      </div>
    );
  }

  // 2. LOBBY VIEW (In room, waiting to start)
  if (room.status === "lobby") {
    return (
      <>
        <Lobby
          room={room}
          currentPlayerId={playerId}
          onToggleReady={handleToggleReady}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
          onOpenInvite={() => setIsInviteOpen(true)}
        />
        <InviteShareModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          roomCode={room.id}
        />
      </>
    );
  }

  // 3. IN-GAME VIEW (Playing) & ENDED VIEW (Leaderboard)
  return (
    <div
      className={`h-screen h-[100dvh] w-screen relative overflow-hidden select-none bg-black bg-center bg-cover bg-no-repeat transition-all duration-300 ${
        isStunned ? "freeze-vignette" : ""
      }`}
      style={{ backgroundImage: `url(${currentBackground})` }}
    >
      {/* 5-Second Stun Freeze Fullscreen Overlay */}
      {isStunned && (
        <div className="absolute inset-0 z-40 bg-[#0B2545]/60 backdrop-blur-sm pointer-events-none flex flex-col items-center justify-center">
          <div className="arcade-panel border-4 border-[#29D8FF] p-6 sm:p-8 text-center animate-bounce shadow-[0_0_50px_rgba(41,216,255,0.7)]">
            <Snowflake className="w-14 h-14 text-[#29D8FF] mx-auto animate-spin mb-2" />
            <h3 className="font-arcade text-2xl sm:text-4xl text-white text-stroke-ink tracking-wide">
              ❄️ YOU ARE FROZEN!
            </h3>
            <p className="text-xs sm:text-sm text-cyan-100 font-bold mt-1.5 max-w-xs mx-auto">
              You were tagged and are immobilized for 5 seconds while runners escape.
              You are the <strong className="text-[#FF4757]">NEW CATCHER!</strong>
            </p>
            <div className="mt-4 font-arcade text-3xl sm:text-4xl text-[#29D8FF] text-stroke-ink font-mono">
              THAWING IN: 5s
            </div>
          </div>
        </div>
      )}

      {/* Tag Announcement Banner */}
      {tagBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="btn-3d btn-3d-red px-5 py-2.5 rounded-full text-xs sm:text-sm font-arcade tracking-wide animate-bounce text-center">
            {tagBanner}
          </div>
        </div>
      )}

      {/* Top Station Header Bar */}
      <header className="absolute top-2 left-0 right-0 z-30 px-3 flex justify-between items-center pointer-events-none">
        {/* Left: Station Room Info & 5-Minute LED Departure Clock */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Station Room Badge */}
          <div className="arcade-card py-1.5 px-3 rounded-full flex items-center gap-1.5 border-2 border-[#111629]">
            <span className="font-arcade text-xs sm:text-sm text-[#FFD21F] tracking-wide">
              TRACK {currentRoom}
            </span>
            <span className="text-[10px] text-gray-400 font-bold">/ 30</span>
          </div>

          {/* 5-Minute LED Departure Timer */}
          <div
            className={`led-board py-1.5 px-3.5 rounded-full flex items-center gap-2 font-mono font-black text-xs sm:text-sm ${
              (room?.remainingTime ?? 300) < 60
                ? "border-2 border-[#FF4757] text-[#FF4757] animate-pulse"
                : "border-2 border-[#FFD21F]/40 text-[#FFD21F]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="tracking-widest">{formattedTime}</span>
          </div>

          {/* Role Indicator Pill */}
          <div
            className={`btn-3d py-1.5 px-3 rounded-full text-xs flex items-center gap-1.5 ${
              isCatcher ? "btn-3d-red animate-pulse" : "btn-3d-green"
            }`}
          >
            {isCatcher ? (
              <>
                <Flame className="w-3.5 h-3.5 text-[#FFE875]" />
                <span>CATCHER (18px)</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-white" />
                <span>RUNNER ({myPlayer?.runnerTime ?? 0}s)</span>
              </>
            )}
          </div>
        </div>

        {/* Center: Dynamic Notification or Warning */}
        {notification ? (
          <div className="hidden sm:flex btn-3d btn-3d-green py-1.5 px-4 rounded-full text-xs animate-bounce pointer-events-auto">
            {notification}
          </div>
        ) : isCatcherInMyRoom ? (
          <div className="btn-3d btn-3d-red py-1.5 px-4 rounded-full text-xs sm:text-sm animate-ping pointer-events-auto">
            ⚠️ DANGER: CATCHER ON PLATFORM! RUN!
          </div>
        ) : nearbyDoor ? (
          <div className="hidden sm:flex btn-3d btn-3d-yellow py-1.5 px-3.5 rounded-full text-xs items-center gap-1.5 animate-pulse pointer-events-auto">
            <span>🚪 Near Track Door</span>
            <span className="font-black underline">[Press Enter]</span>
          </div>
        ) : null}

        {/* Right: Quick Controls & Invite */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            title="Invite Link"
            className="btn-3d btn-3d-blue py-1.5 px-3 rounded-full text-xs flex items-center gap-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite</span>
          </button>

          <button
            type="button"
            onClick={() => setShowControls((prev) => !prev)}
            title="Toggle Controls"
            className={`btn-3d p-2 rounded-full text-xs ${
              showControls ? "btn-3d-blue" : "btn-3d-gray"
            }`}
          >
            🎮
          </button>
        </div>
      </header>

      {/* CATCHER RADAR HUD (Exclusively visible to Catcher) */}
      {isCatcher && (
        <CatcherRadar
          currentRoom={currentRoom}
          players={room.players}
          currentPlayerId={playerId}
        />
      )}

      {/* Main Player Character */}
      <div
        id="player-wrapper"
        style={{
          top: `${top}px`,
          left: `${left}px`,
          width: `${playerSize.w}px`,
          height: `${playerSize.h}px`,
        }}
        className={`absolute duration-75 z-20 pointer-events-none transition-all ${
          isCatcher ? "catcher-aura" : ""
        }`}
      >
        {/* Overhead Player Tag */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-lg text-[10px] font-arcade shadow-md flex items-center gap-1 text-white bg-[#111629] border-2 border-[#16D466]">
          <span
            className="w-2 h-2 rounded-full border border-white"
            style={{ backgroundColor: myPlayer?.color || "#16D466" }}
          />
          <span>{myPlayer?.name || "You"}</span>
          {isCatcher && <span className="text-[#FF4757]">🔥</span>}
          {isStunned && <span className="text-[#29D8FF]">❄️</span>}
        </div>

        {/* Character Sprite */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          id="player"
          src={playerSprite}
          style={{
            width: `${playerSize.w}px`,
            height: `${playerSize.h}px`,
          }}
          className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
          alt="Player Character"
        />
      </div>

      {/* Other Players in Current Room */}
      {otherPlayersInRoom.map((other) => (
        <div
          key={other.id}
          style={{
            top: `${other.y}px`,
            left: `${other.x}px`,
            width: `${playerSize.w}px`,
            height: `${playerSize.h}px`,
          }}
          className={`absolute duration-100 z-15 pointer-events-none transition-all ${
            other.isCatcher ? "catcher-aura" : ""
          } ${other.isStunned ? "freeze-vignette" : ""}`}
        >
          {/* Overhead Name & Role Tag */}
          <div
            className={`absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-lg text-[10px] font-arcade shadow-md flex items-center gap-1 text-white border-2 ${
              other.isCatcher
                ? "bg-[#FF4757] border-[#111629] animate-pulse"
                : "bg-[#111629] border-white/30"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full border border-white"
              style={{ backgroundColor: other.color }}
            />
            <span>{other.name}</span>
            {other.isCatcher && <span className="text-[#FFD21F]">🔥 CATCHER</span>}
            {other.isStunned && <span className="text-[#29D8FF]">❄️ FROZEN</span>}
          </div>

          {/* Sprite */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={other.sprite || player_front}
            style={{
              width: `${playerSize.w}px`,
              height: `${playerSize.h}px`,
            }}
            className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
            alt={other.name}
          />
        </div>
      ))}

      {/* Doors in Current Room (Styled as Subway Sliding Track Doors) */}
      {doors.map((door) => {
        const isNear = door.isNearby;
        return (
          <button
            key={door.id}
            type="button"
            aria-label={`${door.name} leading to track room ${door.targetRoom}`}
            style={{
              top: `${door.top}px`,
              left: `${door.left}px`,
              width: `${doorSize.w}px`,
              height: `${doorSize.h}px`,
            }}
            className={`absolute z-10 rounded-2xl bg-[url('/assets/door_img.png')] bg-contain bg-center bg-no-repeat transition-all duration-200 outline-none flex items-center justify-center border-3 border-[#111629] ${
              isNear
                ? "cursor-pointer scale-105 shadow-[0_0_24px_rgba(22,212,102,0.9)] ring-4 ring-[#16D466] animate-pulse"
                : "cursor-default opacity-85 hover:opacity-100 shadow-[0_4px_0_#111629]"
            }`}
            onClick={(e) => {
              e.preventDefault();
              if (isNear) {
                enterDoor(door);
              } else {
                setNotification("🚶 Move closer to open this track door!");
                setTimeout(() => setNotification(""), 1400);
              }
            }}
          >
            {/* Nearby Floating Badge */}
            {isNear && (
              <span className="btn-3d btn-3d-green absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] sm:text-xs px-2.5 py-0.5 rounded-lg pointer-events-none">
                {isMobile ? "TAP OR ENTER" : "PRESS ENTER"}
              </span>
            )}

            {/* Track Room Direction Label */}
            <span className="font-arcade text-[10px] text-white bg-[#111629] border border-white/30 px-1.5 py-0.5 rounded-md mt-auto mb-1 pointer-events-none">
              TRACK {door.targetRoom}
            </span>
          </button>
        );
      })}

      {/* Desktop Controls Helper Card */}
      <div className="hidden md:flex flex-col gap-1 absolute bottom-4 left-4 z-20 arcade-card px-3.5 py-2.5 text-xs shadow-lg pointer-events-none border-2 border-[#111629]">
        <div className="font-arcade text-sm text-[#FFD21F] tracking-wide">
          ⌨️ SUBWAY CONTROLS
        </div>
        <div className="font-bold text-gray-200">
          Move: <span className="font-mono text-white font-black">WASD / Arrows</span>
        </div>
        <div className="font-bold text-gray-200">
          Open Track: <span className="font-mono text-[#16D466] font-black">[Enter]</span> or Click
        </div>
        <div className="text-[11px] font-bold text-gray-300">
          Role: <strong className={isCatcher ? "text-[#FF4757]" : "text-[#16D466]"}>{isCatcher ? "CATCHER (Speed: 18px)" : "RUNNER (Hide!)"}</strong>
        </div>
      </div>

      {/* Mobile Touch D-Pad & Action HUD */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 z-30 p-3 flex justify-between items-end pointer-events-none">
          {/* Left: Directional D-Pad */}
          <div className="pointer-events-auto touch-none arcade-panel p-2.5">
            <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-32 h-32 sm:w-36 sm:h-36">
              <div />
              <button
                type="button"
                aria-label="Move Up"
                onPointerDown={(e) => {
                  e.preventDefault();
                  startMoving(setUpDirection);
                }}
                onPointerUp={stopMoving}
                onPointerCancel={stopMoving}
                onPointerLeave={stopMoving}
                className="btn-3d btn-3d-blue flex items-center justify-center rounded-xl text-lg font-black"
              >
                ▲
              </button>
              <div />

              <button
                type="button"
                aria-label="Move Left"
                onPointerDown={(e) => {
                  e.preventDefault();
                  startMoving(setLeftDirection);
                }}
                onPointerUp={stopMoving}
                onPointerCancel={stopMoving}
                onPointerLeave={stopMoving}
                className="btn-3d btn-3d-blue flex items-center justify-center rounded-xl text-lg font-black"
              >
                ◀
              </button>
              <div className="flex items-center justify-center text-gray-500 text-xs font-mono">
                •
              </div>
              <button
                type="button"
                aria-label="Move Right"
                onPointerDown={(e) => {
                  e.preventDefault();
                  startMoving(setRightDirection);
                }}
                onPointerUp={stopMoving}
                onPointerCancel={stopMoving}
                onPointerLeave={stopMoving}
                className="btn-3d btn-3d-blue flex items-center justify-center rounded-xl text-lg font-black"
              >
                ▶
              </button>

              <div />
              <button
                type="button"
                aria-label="Move Down"
                onPointerDown={(e) => {
                  e.preventDefault();
                  startMoving(setDownDirection);
                }}
                onPointerUp={stopMoving}
                onPointerCancel={stopMoving}
                onPointerLeave={stopMoving}
                className="btn-3d btn-3d-blue flex items-center justify-center rounded-xl text-lg font-black"
              >
                ▼
              </button>
              <div />
            </div>
          </div>

          {/* Right: Enter Track Door Action Button */}
          <div className="pointer-events-auto touch-none flex flex-col gap-2 items-center">
            <button
              type="button"
              onClick={() => {
                if (nearbyDoor) {
                  enterDoor(nearbyDoor);
                } else {
                  setNotification("🚶 Move near a door first!");
                  setTimeout(() => setNotification(""), 1200);
                }
              }}
              aria-label="Enter Track Door"
              className={`btn-3d w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center ${
                nearbyDoor
                  ? "btn-3d-green animate-pulse cursor-pointer"
                  : "btn-3d-gray opacity-60 cursor-not-allowed"
              }`}
            >
              <span className="text-2xl sm:text-3xl">🚪</span>
              <span className="text-xs sm:text-sm font-arcade tracking-wide mt-0.5">
                ENTER
              </span>
              {nearbyDoor && (
                <span className="text-[10px] font-bold text-white font-mono">
                  Track {nearbyDoor.targetRoom}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Share / Invite Modal */}
      <InviteShareModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        roomCode={room.id}
      />

      {/* 5-Minute Match End Leaderboard Modal */}
      {room.status === "ended" && room.leaderboard && (
        <LeaderboardModal
          isOpen={true}
          leaderboard={room.leaderboard}
          currentPlayerId={playerId}
          isHost={myPlayer?.isHost || false}
          onPlayAgain={handlePlayAgain}
          onLeave={handleLeaveRoom}
          onShare={() => setIsInviteOpen(true)}
        />
      )}
    </div>
  );
}

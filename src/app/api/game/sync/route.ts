import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Room } from "@/lib/models/Room";
import { Player, LeaderboardEntry } from "@/types/game";

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function calculateLeaderboard(players: Record<string, Player>): LeaderboardEntry[] {
  const playerList = Object.values(players);
  // Sort descending by runnerTime: 1st is person who was runner for maximum time
  playerList.sort((a, b) => b.runnerTime - a.runnerTime);

  return playerList.map((p, idx) => ({
    rank: idx + 1,
    playerId: p.id,
    userId: p.userId,
    name: p.name,
    email: p.email,
    color: p.color,
    runnerTime: p.runnerTime,
    catcherTime: p.catcherTime,
    catches: p.catches,
    isWinner: idx === 0,
  }));
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, roomId, playerId, user, x, y, sprite, roomIndex, targetRoom } = body;

    const code = (roomId ? roomId.trim().toUpperCase() : generateRoomCode());
    let roomDoc = await Room.findOne({ id: code });

    // 1. JOIN ROOM
    if (action === "join") {
      const assignedId = playerId || "p_" + Math.random().toString(36).substring(2, 9);

      if (!roomDoc) {
        // Create new room with host
        const initialPlayer: Player = {
          id: assignedId,
          userId: user?.userId || "",
          name: user?.name || "Player 1",
          email: user?.email || "",
          avatar: user?.avatar || "#16D466",
          color: "#16D466",
          room: 16,
          x: 480,
          y: 280,
          sprite: "/assets/walk_front.gif",
          isCatcher: false,
          isStunned: false,
          stunnedUntil: 0,
          runnerTime: 0,
          catcherTime: 0,
          catches: 0,
          isReady: false,
          isHost: true,
        };

        roomDoc = await Room.create({
          id: code,
          name: `${user?.name || "Player"}'s Room`,
          hostId: assignedId,
          status: "lobby",
          maxPlayers: 5,
          players: { [assignedId]: initialPlayer },
          gameDuration: 300,
          remainingTime: 300,
          catcherId: null,
          startTime: null,
          tagBanner: "",
          leaderboard: null,
        });

        return NextResponse.json({
          room: roomDoc.toObject(),
          playerId: assignedId,
        });
      }

      // Existing room
      const players = roomDoc.players || {};
      const currentCount = Object.keys(players).length;

      if (currentCount >= roomDoc.maxPlayers && !players[assignedId]) {
        return NextResponse.json(
          { error: "Track Room is full! Maximum 5 passengers allowed." },
          { status: 400 }
        );
      }

      if (!players[assignedId]) {
        const playerColors = ["#16D466", "#1E88FF", "#8B5CF6", "#FFD21F", "#EC4899"];
        const color = playerColors[currentCount % playerColors.length] || "#16D466";

        players[assignedId] = {
          id: assignedId,
          userId: user?.userId || "",
          name: user?.name || `Passenger ${currentCount + 1}`,
          email: user?.email || "",
          avatar: user?.avatar || color,
          color,
          room: 16,
          x: 460 + Math.floor(Math.random() * 60),
          y: 260 + Math.floor(Math.random() * 60),
          sprite: "/assets/walk_front.gif",
          isCatcher: false,
          isStunned: false,
          stunnedUntil: 0,
          runnerTime: 0,
          catcherTime: 0,
          catches: 0,
          isReady: false,
          isHost: roomDoc.hostId === assignedId,
        };

        roomDoc.players = players;
        roomDoc.markModified("players");
        await roomDoc.save();
      }

      return NextResponse.json({
        room: roomDoc.toObject(),
        playerId: assignedId,
      });
    }

    if (!roomDoc) {
      return NextResponse.json({ error: "Track Room not found" }, { status: 404 });
    }

    const players = roomDoc.players || {};
    const player = players[playerId];
    const now = Date.now();

    // 2. TOGGLE READY
    if (action === "toggle_ready" && player) {
      player.isReady = !player.isReady;
      roomDoc.markModified("players");
      await roomDoc.save();
      return NextResponse.json({ room: roomDoc.toObject() });
    }

    // 3. START GAME
    if (action === "start_game") {
      if (roomDoc.hostId !== playerId) {
        return NextResponse.json({ error: "Only conductor (host) can start the match" }, { status: 403 });
      }

      const pids = Object.keys(players);
      if (pids.length === 0) {
        return NextResponse.json({ error: "No passengers in room" }, { status: 400 });
      }

      // Pick 1 random catcher
      const randomIndex = Math.floor(Math.random() * pids.length);
      const catcherId = pids[randomIndex];
      roomDoc.catcherId = catcherId;

      pids.forEach((pid) => {
        const p = players[pid];
        p.isCatcher = pid === catcherId;
        p.isStunned = false;
        p.stunnedUntil = 0;
        p.runnerTime = 0;
        p.catcherTime = 0;
        p.catches = 0;
        p.room = 16;
        p.x = 460 + Math.floor(Math.random() * 60) - 30;
        p.y = 260 + Math.floor(Math.random() * 60) - 30;
      });

      roomDoc.status = "playing";
      roomDoc.gameDuration = 300;
      roomDoc.remainingTime = 300;
      roomDoc.startTime = now;
      roomDoc.tagBanner = "🚆 EXPRESS DEPARTED! 5-MINUTE COUNTDOWN STARTED!";
      roomDoc.leaderboard = null;

      roomDoc.markModified("players");
      await roomDoc.save();
      return NextResponse.json({ room: roomDoc.toObject() });
    }

    // 4. HEARTBEAT / MOVE / SYNC (Active Match Loop)
    if (action === "move" || action === "sync") {
      if (roomDoc.status === "playing" && roomDoc.startTime) {
        const elapsedSecs = Math.floor((now - roomDoc.startTime) / 1000);
        const remTime = Math.max(0, 300 - elapsedSecs);
        roomDoc.remainingTime = remTime;

        // Check if 5 minutes expired
        if (remTime <= 0) {
          roomDoc.status = "ended";
          roomDoc.remainingTime = 0;
          roomDoc.leaderboard = calculateLeaderboard(players);
          roomDoc.markModified("players");
          await roomDoc.save();
          return NextResponse.json({ room: roomDoc.toObject() });
        }

        // Unstun check
        Object.values(players).forEach((p) => {
          if (p.isStunned && p.stunnedUntil <= now) {
            p.isStunned = false;
            p.stunnedUntil = 0;
          }
        });

        // Update player movement if provided and player not stunned
        if (player && action === "move") {
          if (!player.isStunned || player.stunnedUntil <= now) {
            if (typeof x === "number") player.x = x;
            if (typeof y === "number") player.y = y;
            if (sprite) player.sprite = sprite;
            if (typeof roomIndex === "number") player.room = roomIndex;
          }

          // Accumulate runner or catcher time
          if (player.isCatcher) {
            player.catcherTime = Math.min(300, (player.catcherTime || 0) + 1);
          } else if (!player.isStunned) {
            player.runnerTime = Math.min(300, (player.runnerTime || 0) + 1);
          }

          // TAG COLLISION CHECK
          const catcher = players[roomDoc.catcherId || ""];
          if (catcher && !catcher.isStunned) {
            if (player.isCatcher) {
              // Catcher moved: check collision against all runners in same room
              Object.values(players).forEach((runner) => {
                if (runner.id === player.id) return;
                if (runner.room !== player.room) return;
                if (runner.isStunned) return;

                const dist = Math.hypot(player.x - runner.x, player.y - runner.y);
                if (dist < 55) {
                  // Tag!
                  player.catches = (player.catches || 0) + 1;
                  player.isCatcher = false;

                  runner.isCatcher = true;
                  runner.isStunned = true;
                  runner.stunnedUntil = now + 5000;

                  roomDoc.catcherId = runner.id;
                  roomDoc.tagBanner = `💥 ${player.name} CAUGHT ${runner.name}! ${runner.name} is frozen 5s & is now the CATCHER!`;
                }
              });
            } else {
              // Runner moved: check against catcher in same room
              if (catcher.room === player.room && !player.isStunned) {
                const dist = Math.hypot(catcher.x - player.x, catcher.y - player.y);
                if (dist < 55) {
                  // Tag!
                  catcher.catches = (catcher.catches || 0) + 1;
                  catcher.isCatcher = false;

                  player.isCatcher = true;
                  player.isStunned = true;
                  player.stunnedUntil = now + 5000;

                  roomDoc.catcherId = player.id;
                  roomDoc.tagBanner = `💥 ${catcher.name} CAUGHT ${player.name}! ${player.name} is frozen 5s & is now the CATCHER!`;
                }
              }
            }
          }
        }
      }

      roomDoc.markModified("players");
      await roomDoc.save();
      return NextResponse.json({ room: roomDoc.toObject() });
    }

    // 5. CHANGE ROOM (Door navigation)
    if (action === "change_room" && player) {
      if (!player.isStunned || player.stunnedUntil <= now) {
        player.room = targetRoom;
        if (typeof x === "number") player.x = x;
        if (typeof y === "number") player.y = y;
        roomDoc.markModified("players");
        await roomDoc.save();
      }
      return NextResponse.json({ room: roomDoc.toObject() });
    }

    // 6. PLAY AGAIN
    if (action === "play_again") {
      roomDoc.status = "lobby";
      roomDoc.remainingTime = 300;
      roomDoc.catcherId = null;
      roomDoc.startTime = null;
      roomDoc.leaderboard = null;
      roomDoc.tagBanner = "";

      Object.values(players).forEach((p) => {
        p.isCatcher = false;
        p.isStunned = false;
        p.stunnedUntil = 0;
        p.runnerTime = 0;
        p.catcherTime = 0;
        p.catches = 0;
        p.room = 16;
        p.isReady = false;
      });

      roomDoc.markModified("players");
      await roomDoc.save();
      return NextResponse.json({ room: roomDoc.toObject() });
    }

    // 7. LEAVE ROOM
    if (action === "leave" && playerId) {
      delete players[playerId];
      const remainingIds = Object.keys(players);

      if (remainingIds.length === 0) {
        await Room.deleteOne({ id: code });
        return NextResponse.json({ success: true, room: null });
      }

      if (roomDoc.hostId === playerId) {
        roomDoc.hostId = remainingIds[0];
        players[remainingIds[0]].isHost = true;
      }

      if (roomDoc.status === "playing" && roomDoc.catcherId === playerId) {
        const newCatcherId = remainingIds[Math.floor(Math.random() * remainingIds.length)];
        roomDoc.catcherId = newCatcherId;
        players[newCatcherId].isCatcher = true;
      }

      roomDoc.markModified("players");
      await roomDoc.save();
      return NextResponse.json({ room: roomDoc.toObject() });
    }

    return NextResponse.json({ room: roomDoc.toObject() });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Game sync error:", err);
    return NextResponse.json({ error: err.message || "Game sync failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const roomDoc = await Room.findOne({ id: roomId.trim().toUpperCase() });
    if (!roomDoc) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Dynamic timer update on read
    if (roomDoc.status === "playing" && roomDoc.startTime) {
      const elapsed = Math.floor((Date.now() - roomDoc.startTime) / 1000);
      const rem = Math.max(0, 300 - elapsed);
      roomDoc.remainingTime = rem;
      if (rem <= 0) {
        roomDoc.status = "ended";
        roomDoc.leaderboard = calculateLeaderboard(roomDoc.players || {});
        await roomDoc.save();
      }
    }

    return NextResponse.json({ room: roomDoc.toObject() });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

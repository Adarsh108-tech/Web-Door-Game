const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGOURI ||
  "mongodb+srv://adarsb16221_db_user:adarsh16221@cluster0.bkjhyri.mongodb.net/web_door_game?retryWrites=true&w=majority&appName=Cluster0";

// In-memory Room Storage
const rooms = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function calculateLeaderboard(room) {
  const playerList = Object.values(room.players);
  // Sort descending by runnerTime: 1st is person who was runner for maximum time!
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

async function persistMatchResults(room) {
  try {
    if (mongoose.connection.readyState !== 1) return;
    const User = mongoose.models.User;
    if (!User) return;

    const leaderboard = room.leaderboard || calculateLeaderboard(room);
    for (const entry of leaderboard) {
      if (entry.userId && mongoose.Types.ObjectId.isValid(entry.userId)) {
        await User.findByIdAndUpdate(entry.userId, {
          $inc: {
            "stats.totalGames": 1,
            "stats.totalRunnerWins": entry.isWinner ? 1 : 0,
            "stats.totalRunnerTime": entry.runnerTime,
            "stats.totalCatches": entry.catches,
          },
        }).catch((err) => console.error("Error updating user stats:", err));
      }
    }
  } catch (err) {
    console.error("Failed to persist match stats:", err);
  }
}

app.prepare().then(async () => {
  // Connect to MongoDB
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully");
  } catch (err) {
    console.error("MongoDB connection warning:", err.message);
  }

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on("connection", (socket) => {
    let currentRoomId = null;

    // Join or create room
    socket.on("join_room", ({ roomId, user }) => {
      const code = (roomId ? roomId.trim().toUpperCase() : generateRoomCode());
      currentRoomId = code;

      let room = rooms.get(code);

      if (!room) {
        // Create new room
        room = {
          id: code,
          name: `${user?.name || "Player"}'s Room`,
          hostId: socket.id,
          status: "lobby",
          maxPlayers: 5,
          players: {},
          gameDuration: 300, // 5 minutes in seconds
          remainingTime: 300,
          catcherId: null,
          startTime: null,
          leaderboard: null,
          timerInterval: null,
        };
        rooms.set(code, room);
      }

      // Check max players limit (5 or less)
      const currentCount = Object.keys(room.players).length;
      if (currentCount >= room.maxPlayers && !room.players[socket.id]) {
        socket.emit("error_message", {
          message: "Room is full! Maximum 5 players allowed.",
        });
        return;
      }

      const playerColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899"];
      const assignedColor =
        playerColors[currentCount % playerColors.length] || "#10b981";

      const player = {
        id: socket.id,
        userId: user?.userId || "",
        name: user?.name || `Player ${currentCount + 1}`,
        email: user?.email || "",
        avatar: user?.avatar || assignedColor,
        color: assignedColor,
        room: 16, // Start in Room 16 (center of maze)
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
        isHost: room.hostId === socket.id,
      };

      room.players[socket.id] = player;
      socket.join(code);

      // Notify caller of joined room
      socket.emit("room_joined", {
        room: serializeRoom(room),
        playerId: socket.id,
      });

      // Broadcast updated room state to all players in the room
      io.to(code).emit("room_state", serializeRoom(room));
    });

    // Toggle Ready status in lobby
    socket.on("toggle_ready", () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || !room.players[socket.id]) return;

      room.players[socket.id].isReady = !room.players[socket.id].isReady;
      io.to(currentRoomId).emit("room_state", serializeRoom(room));
    });

    // Start Game (5-minute match)
    socket.on("start_game", () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      // Only host can start game
      if (room.hostId !== socket.id) {
        socket.emit("error_message", { message: "Only the host can start the game!" });
        return;
      }

      const playerIds = Object.keys(room.players);
      if (playerIds.length === 0) return;

      // Pick 1 random person to become the catcher
      const randomIndex = Math.floor(Math.random() * playerIds.length);
      const initialCatcherId = playerIds[randomIndex];
      room.catcherId = initialCatcherId;

      // Reset players and positions
      playerIds.forEach((pid) => {
        const p = room.players[pid];
        p.isCatcher = pid === initialCatcherId;
        p.isStunned = false;
        p.stunnedUntil = 0;
        p.runnerTime = 0;
        p.catcherTime = 0;
        p.catches = 0;
        p.room = 16;
        p.x = 450 + Math.floor(Math.random() * 80) - 40;
        p.y = 260 + Math.floor(Math.random() * 80) - 40;
      });

      room.status = "playing";
      room.remainingTime = 300; // 5 minutes
      room.gameDuration = 300;
      room.startTime = Date.now();
      room.leaderboard = null;

      // Clear any existing timer interval
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
      }

      // Broadcast game start
      io.to(currentRoomId).emit("game_started", {
        room: serializeRoom(room),
        catcherId: initialCatcherId,
      });

      // 1-second server tick for timer & accumulating runner time
      room.timerInterval = setInterval(() => {
        const currentRoom = rooms.get(currentRoomId);
        if (!currentRoom || currentRoom.status !== "playing") {
          clearInterval(room.timerInterval);
          return;
        }

        currentRoom.remainingTime -= 1;

        // Check if stunned players should be unstunned
        const now = Date.now();
        Object.values(currentRoom.players).forEach((p) => {
          if (p.isStunned && p.stunnedUntil <= now) {
            p.isStunned = false;
            p.stunnedUntil = 0;
            io.to(currentRoom.id).emit("player_unstunned", { playerId: p.id });
          }

          // Accumulate runner / catcher time
          if (p.isCatcher) {
            p.catcherTime += 1;
          } else if (!p.isStunned) {
            // When caught and stunned for 5 seconds, runner time does not increment
            p.runnerTime += 1;
          }
        });

        // Emit time tick with current standings
        io.to(currentRoom.id).emit("timer_tick", {
          remainingTime: currentRoom.remainingTime,
          players: currentRoom.players,
        });

        // Check if 5 minutes completed
        if (currentRoom.remainingTime <= 0) {
          clearInterval(currentRoom.timerInterval);
          currentRoom.status = "ended";
          currentRoom.remainingTime = 0;

          // Compute final leaderboard: 1st is person who was a runner for maximum time
          const leaderboard = calculateLeaderboard(currentRoom);
          currentRoom.leaderboard = leaderboard;

          // Persist to database
          persistMatchResults(currentRoom);

          io.to(currentRoom.id).emit("game_over", {
            leaderboard,
            room: serializeRoom(currentRoom),
          });
        }
      }, 1000);
    });

    // Player Movement
    socket.on("player_move", ({ x, y, sprite, room: playerRoomIndex }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room || room.status !== "playing") return;

      const player = room.players[socket.id];
      if (!player) return;

      // Stunned player cannot move!
      if (player.isStunned && player.stunnedUntil > Date.now()) {
        return;
      }

      player.x = x;
      player.y = y;
      if (sprite) player.sprite = sprite;
      if (playerRoomIndex) player.room = playerRoomIndex;

      // Broadcast position to all players in the room
      socket.to(currentRoomId).emit("player_moved", {
        playerId: socket.id,
        x: player.x,
        y: player.y,
        sprite: player.sprite,
        room: player.room,
      });

      // Catch / Tag Collision Check
      // Only one catcher exists at any time
      const catcher = room.players[room.catcherId];
      if (!catcher || catcher.isStunned) return;

      // Check collision between catcher and runners
      if (player.isCatcher) {
        // Catcher moved: check against all runners in same room
        Object.values(room.players).forEach((otherPlayer) => {
          if (otherPlayer.id === player.id) return;
          if (otherPlayer.room !== player.room) return;
          if (otherPlayer.isStunned) return;

          const dx = player.x - otherPlayer.x;
          const dy = player.y - otherPlayer.y;
          const dist = Math.hypot(dx, dy);

          // Tag collision radius (55px)
          if (dist < 55) {
            handleTag(room, player, otherPlayer);
          }
        });
      } else {
        // Runner moved: check against catcher if in same room
        if (catcher.room === player.room && !player.isStunned) {
          const dx = player.x - catcher.x;
          const dy = player.y - catcher.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 55) {
            handleTag(room, catcher, player);
          }
        }
      }
    });

    // Handle Tag Event
    function handleTag(room, oldCatcher, victimRunner) {
      if (victimRunner.isStunned) return;

      const now = Date.now();
      const STUN_DURATION_MS = 5000; // 5 seconds freeze

      // Catcher stats
      oldCatcher.catches += 1;
      oldCatcher.isCatcher = false;

      // Victim becomes new catcher and is stunned for 5 seconds
      victimRunner.isCatcher = true;
      victimRunner.isStunned = true;
      victimRunner.stunnedUntil = now + STUN_DURATION_MS;

      // Update room catcher ID
      room.catcherId = victimRunner.id;

      // Broadcast tag event to all clients in room
      io.to(room.id).emit("player_tagged", {
        newCatcherId: victimRunner.id,
        newCatcherName: victimRunner.name,
        previousCatcherId: oldCatcher.id,
        previousCatcherName: oldCatcher.name,
        stunnedUntil: victimRunner.stunnedUntil,
        stunDuration: 5,
        room: serializeRoom(room),
      });

      // Server timer to automatically unstun after 5 seconds
      setTimeout(() => {
        const curRoom = rooms.get(room.id);
        if (!curRoom || curRoom.status !== "playing") return;
        const curVictim = curRoom.players[victimRunner.id];
        if (curVictim && curVictim.isStunned && curVictim.stunnedUntil <= Date.now()) {
          curVictim.isStunned = false;
          curVictim.stunnedUntil = 0;
          io.to(curRoom.id).emit("player_unstunned", {
            playerId: curVictim.id,
            playerName: curVictim.name,
          });
        }
      }, STUN_DURATION_MS);
    }

    // Door transition / Room Change
    socket.on("change_room", ({ targetRoom, x, y }) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const player = room.players[socket.id];
      if (!player) return;

      if (player.isStunned && player.stunnedUntil > Date.now()) return;

      player.room = targetRoom;
      if (typeof x === "number") player.x = x;
      if (typeof y === "number") player.y = y;

      io.to(currentRoomId).emit("player_room_changed", {
        playerId: socket.id,
        room: targetRoom,
        x: player.x,
        y: player.y,
      });
    });

    // Play Again (return to lobby)
    socket.on("play_again", () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }

      room.status = "lobby";
      room.remainingTime = 300;
      room.catcherId = null;
      room.leaderboard = null;

      Object.values(room.players).forEach((p) => {
        p.isCatcher = false;
        p.isStunned = false;
        p.stunnedUntil = 0;
        p.runnerTime = 0;
        p.catcherTime = 0;
        p.catches = 0;
        p.room = 16;
        p.isReady = false;
      });

      io.to(currentRoomId).emit("room_state", serializeRoom(room));
    });

    // Leave room / Disconnect
    const handleLeave = () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (!room) return;

      const leavingPlayer = room.players[socket.id];
      delete room.players[socket.id];
      socket.leave(currentRoomId);

      const remainingPlayerIds = Object.keys(room.players);

      if (remainingPlayerIds.length === 0) {
        // Room empty: clear interval and remove room
        if (room.timerInterval) clearInterval(room.timerInterval);
        rooms.delete(currentRoomId);
      } else {
        // If host left, reassign host
        if (room.hostId === socket.id) {
          room.hostId = remainingPlayerIds[0];
          room.players[room.hostId].isHost = true;
        }

        // If catcher left during active game, assign new catcher
        if (room.status === "playing" && room.catcherId === socket.id) {
          const newCatcherId =
            remainingPlayerIds[Math.floor(Math.random() * remainingPlayerIds.length)];
          room.catcherId = newCatcherId;
          const newCatcher = room.players[newCatcherId];
          newCatcher.isCatcher = true;
          newCatcher.isStunned = false;

          io.to(currentRoomId).emit("catcher_reassigned", {
            newCatcherId,
            message: `${leavingPlayer?.name || "The catcher"} left! ${newCatcher.name} is the new Catcher!`,
          });
        }

        io.to(currentRoomId).emit("player_left", {
          playerId: socket.id,
          name: leavingPlayer?.name,
          room: serializeRoom(room),
        });
      }

      currentRoomId = null;
    };

    socket.on("leave_room", handleLeave);
    socket.on("disconnect", handleLeave);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\n⚠️ Port ${port} is currently in use.\nYou can kill the existing process or set a different port, e.g.:\n$env:PORT=3001; npm run dev\n`
      );
      process.exit(1);
    } else {
      console.error("Server error:", err);
    }
  });

  server.listen(port, () => {
    console.log(`> Web Door Game server ready on http://${hostname}:${port}`);
  });
});

function serializeRoom(room) {
  return {
    id: room.id,
    name: room.name,
    hostId: room.hostId,
    status: room.status,
    maxPlayers: room.maxPlayers,
    players: room.players,
    gameDuration: room.gameDuration,
    remainingTime: room.remainingTime,
    catcherId: room.catcherId,
    startTime: room.startTime,
    leaderboard: room.leaderboard,
  };
}

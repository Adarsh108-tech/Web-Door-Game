export interface Player {
  id: string; // Socket ID
  userId: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  room: number; // 1 to 30
  x: number;
  y: number;
  sprite: string;
  isCatcher: boolean;
  isStunned: boolean;
  stunnedUntil: number; // Timestamp
  runnerTime: number; // Seconds spent as runner
  catcherTime: number; // Seconds spent as catcher
  catches: number; // Number of catches made
  isReady: boolean;
  isHost: boolean;
}

export type GameStatus = "lobby" | "starting" | "playing" | "ended";

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  userId: string;
  name: string;
  email: string;
  color: string;
  runnerTime: number; // Primary ranking metric! (maximum runner time = 1st place)
  catcherTime: number;
  catches: number;
  isWinner: boolean;
}

export interface RoomState {
  id: string; // Room Code e.g. "ROOM42"
  name: string;
  hostId: string;
  status: GameStatus;
  maxPlayers: number; // 5 players max
  players: Record<string, Player>;
  gameDuration: number; // 300 seconds (5 minutes)
  remainingTime: number; // Countdown
  catcherId: string | null;
  startTime: number | null;
  leaderboard: LeaderboardEntry[] | null;
}

export interface TagEvent {
  catcherId: string;
  catcherName: string;
  victimId: string;
  victimName: string;
  stunnedUntil: number;
  duration: number; // 5 seconds
}

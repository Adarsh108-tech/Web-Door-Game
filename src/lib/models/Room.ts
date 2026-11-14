import mongoose, { Schema, Document, Model } from "mongoose";
import { Player, LeaderboardEntry, GameStatus } from "@/types/game";

export interface IRoom extends Document {
  id: string; // Room Code e.g. "ABC123"
  name: string;
  hostId: string;
  status: GameStatus;
  maxPlayers: number;
  players: Record<string, Player>;
  gameDuration: number;
  remainingTime: number;
  catcherId: string | null;
  startTime: number | null;
  tagBanner: string;
  leaderboard: LeaderboardEntry[] | null;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      default: "Subway Station",
    },
    hostId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["lobby", "starting", "playing", "ended"],
      default: "lobby",
    },
    maxPlayers: {
      type: Number,
      default: 5,
    },
    players: {
      type: Schema.Types.Mixed,
      default: {},
    },
    gameDuration: {
      type: Number,
      default: 300,
    },
    remainingTime: {
      type: Number,
      default: 300,
    },
    catcherId: {
      type: String,
      default: null,
    },
    startTime: {
      type: Number,
      default: null,
    },
    tagBanner: {
      type: String,
      default: "",
    },
    leaderboard: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically clean up inactive rooms after 3 hours
RoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 10800 });

export const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);

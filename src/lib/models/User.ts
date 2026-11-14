import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  avatar?: string;
  stats: {
    totalGames: number;
    totalRunnerWins: number;
    totalRunnerTime: number;
    totalCatches: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "emerald",
    },
    stats: {
      totalGames: { type: Number, default: 0 },
      totalRunnerWins: { type: Number, default: 0 },
      totalRunnerTime: { type: Number, default: 0 },
      totalCatches: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

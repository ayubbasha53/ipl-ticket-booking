import { Schema, model } from 'mongoose';

const playerSchema = new Schema(
  {
    name: { type: String, required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    season: { type: Schema.Types.ObjectId, ref: 'Season', required: true },
    role: { type: String, enum: ['batter', 'bowler', 'all-rounder', 'wicketkeeper'], required: true },
    nationality: String,
    battingStyle: String,
    bowlingStyle: String,
    imageUrl: String,
    stats: { type: Schema.Types.Mixed },
    verified: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
playerSchema.index({ team: 1, season: 1, name: 1 }, { unique: true });
export const Player = model('Player', playerSchema);

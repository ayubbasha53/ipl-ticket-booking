import { Schema, model } from 'mongoose';

const teamSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    shortCode: { type: String, required: true, unique: true, uppercase: true },
    city: { type: String, required: true },
    homeStadium: { type: Schema.Types.ObjectId, ref: 'Stadium' },
    description: String,
    logoUrl: String, // only authorized assets
    primaryColor: { type: String, match: /^#[0-9a-fA-F]{6}$/ },
    // Captain/coach are only shown when an admin marks them verified for the season.
    captain: { name: String, verified: { type: Boolean, default: false } },
    coach: { name: String, verified: { type: Boolean, default: false } },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const Team = model('Team', teamSchema);

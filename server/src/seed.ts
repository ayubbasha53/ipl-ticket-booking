/**
 * Development seed. Everything created here is SAMPLE/DEMO data, not verified IPL information:
 * team names are the public franchise names, but squads, fixtures, prices and stadium capacities are invented.
 */
import { connectDb, disconnectDb } from './config/db.js';
import { env, isProd } from './config/env.js';
import { hashPassword } from './services/auth.service.js';
import { passwordSchema, phoneSchema, emailSchema } from './validators/auth.js';
import { Coupon, Match, Player, Season, Stadium, TaxRule, Team, TicketCategory, User } from './models/index.js';
import { logger } from './utils/logger.js';

const TEAMS = [
  ['Chennai Super Kings', 'CSK', 'Chennai', '#F2B705'],
  ['Mumbai Indians', 'MI', 'Mumbai', '#1D5FA8'],
  ['Royal Challengers Bengaluru', 'RCB', 'Bengaluru', '#C8242B'],
  ['Kolkata Knight Riders', 'KKR', 'Kolkata', '#4B2E83'],
  ['Sunrisers Hyderabad', 'SRH', 'Hyderabad', '#E8741A'],
  ['Rajasthan Royals', 'RR', 'Jaipur', '#D6337A'],
  ['Punjab Kings', 'PBKS', 'Mohali', '#B3202A'],
  ['Delhi Capitals', 'DC', 'Delhi', '#1F4E9C'],
  ['Gujarat Titans', 'GT', 'Ahmedabad', '#1B2A49'],
  ['Lucknow Super Giants', 'LSG', 'Lucknow', '#1E8FB5'],
] as const;

const ROLES = ['batter', 'bowler', 'all-rounder', 'wicketkeeper'] as const;
const CATEGORIES = [
  { code: 'GA', name: 'General Admission (DEMO)', pricePaise: 150000, capacity: 500 },
  { code: 'STD', name: 'Standard (DEMO)', pricePaise: 250000, capacity: 300 },
  { code: 'PRM', name: 'Premium (DEMO)', pricePaise: 600000, capacity: 120 },
  { code: 'VIP', name: 'VIP (DEMO)', pricePaise: 1200000, capacity: 40 },
];

async function seedAdmin() {
  const { ADMIN_SEED_EMAIL: email, ADMIN_SEED_PHONE: phone, ADMIN_SEED_PASSWORD: password } = env;
  if (!email || !phone || !password) {
    logger.warn('ADMIN_SEED_* not set: skipping admin account. No default admin is ever created.');
    return;
  }
  const e = emailSchema.parse(email);
  const p = phoneSchema.parse(phone);
  passwordSchema.parse(password);
  const now = new Date();
  await User.findOneAndUpdate(
    { email: e },
    {
      $setOnInsert: { passwordHash: await hashPassword(password), consent: { termsAcceptedAt: now, privacyAcceptedAt: now } },
      $set: { name: 'Demo Admin', phone: p, role: 'admin', emailVerified: true, emailVerifiedAt: now },
    },
    { upsert: true },
  );
  logger.info(`Admin account ready for ${e}`);
}

async function main() {
  if (isProd) throw new Error('Refusing to run the demo seed in production.');
  await connectDb();

  const season = await Season.findOneAndUpdate(
    { year: 2099 },
    { name: 'DEMO Season (sample data, not a real tournament)', year: 2099, isActive: true, isDemo: true, startDate: new Date('2099-03-20T00:00:00Z'), endDate: new Date('2099-05-30T00:00:00Z') },
    { upsert: true, new: true },
  );

  const stadiums = new Map<string, InstanceType<typeof Stadium>>();
  const teams: InstanceType<typeof Team>[] = [];
  for (const [name, shortCode, city, color] of TEAMS) {
    let stadium = stadiums.get(city);
    if (!stadium) {
      stadium = await Stadium.findOneAndUpdate({ name: `${city} Demo Stadium`, city }, { name: `${city} Demo Stadium`, city, capacity: 40000, isDemo: true }, { upsert: true, new: true });
      stadiums.set(city, stadium!);
    }
    const team = await Team.findOneAndUpdate(
      { shortCode },
      { name, shortCode, city, primaryColor: color, homeStadium: stadium!._id, isDemo: true, description: `DEMO profile for ${name}. Captain, coach and squad are placeholders until an admin enters verified data.` },
      { upsert: true, new: true },
    );
    teams.push(team!);
    for (let i = 1; i <= 8; i++) {
      await Player.findOneAndUpdate(
        { team: team!._id, season: season!._id, name: `DEMO Player ${shortCode}-${i}` },
        { role: ROLES[i % ROLES.length], nationality: 'Sample', verified: false, isDemo: true },
        { upsert: true },
      );
    }
  }

  // 10 clearly fictional fixtures in the DEMO season (far-future dates; Asia/Kolkata evening starts at 19:30 IST = 14:00 UTC).
  for (let n = 1; n <= 10; n++) {
    const home = teams[(n - 1) % 10]!;
    const away = teams[n % 10]!;
    const startsAt = new Date(Date.UTC(2099, 2, 20 + n * 2, 14, 0, 0));
    const match = await Match.findOneAndUpdate(
      { season: season!._id, matchNumber: n },
      {
        season: season!._id, matchNumber: n, homeTeam: home._id, awayTeam: away._id, stadium: home.homeStadium,
        startsAt, status: 'upcoming', saleStatus: 'open', isDemo: true,
        cancellationPolicy: { allowed: true, cutoffHoursBeforeMatch: 48, deductionPercent: 10, notes: 'DEMO policy' },
      },
      { upsert: true, new: true },
    );
    for (const c of CATEGORIES) {
      await TicketCategory.findOneAndUpdate({ match: match!._id, code: c.code }, { ...c, mode: 'general', isDemo: true }, { upsert: true });
    }
  }

  // Placeholder tax rule. The rate is DEMO configuration and MUST be confirmed with a tax professional before real use.
  await TaxRule.findOneAndUpdate(
    { name: 'DEMO GST placeholder' },
    { name: 'DEMO GST placeholder', totalRateBps: 1800, components: [{ name: 'CGST', rateBps: 900 }, { name: 'SGST', rateBps: 900 }], effectiveFrom: new Date('2000-01-01'), active: true, isDemo: true, notes: 'Illustrative only.' },
    { upsert: true },
  );
  await Coupon.findOneAndUpdate(
    { code: 'DEMO10' },
    { code: 'DEMO10', description: 'DEMO coupon: 10% off', type: 'percent', value: 10, maxDiscountPaise: 100000, perUserLimit: 1, usageLimit: 1000, active: true, isDemo: true },
    { upsert: true },
  );

  await seedAdmin();
  logger.info('Seed complete: DEMO season, 10 teams, sample players, stadiums, matches, categories, tax rule, coupon.');
  await disconnectDb();
}

main().catch(async (err) => {
  logger.error('Seed failed', { message: (err as Error).message });
  await disconnectDb().catch(() => {});
  process.exit(1);
});

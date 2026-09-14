import { internal } from './_generated/api';
import { cronJobs } from 'convex/server';

const crons = cronJobs();

crons.daily(
  'purge expired correction reports',
  { hourUTC: 2, minuteUTC: 17 },
  internal.corrections.purgeExpired,
);

export default crons;

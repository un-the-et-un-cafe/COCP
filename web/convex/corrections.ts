import { internal } from './_generated/api';
import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import listings from '../data/listings.json';

const listingIds = new Set(listings.map((listing) => listing.id));
const retentionMs = 30 * 24 * 60 * 60 * 1000;

export const listPending = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('correctionReports')
      .withIndex('by_status_submittedAt', (query) => query.eq('status', 'pending'))
      .order('asc')
      .take(100);
  },
});

export const submit = internalMutation({
  args: {
    listingId: v.string(),
    reportType: v.union(
      v.literal('hours'),
      v.literal('location'),
      v.literal('contact'),
      v.literal('service'),
      v.literal('closed'),
      v.literal('safety'),
      v.literal('other'),
    ),
    message: v.string(),
    language: v.union(v.literal('fr'), v.literal('en'), v.literal('ar')),
  },
  handler: async (ctx, args) => {
    const message = args.message.trim();
    if (!listingIds.has(args.listingId)) throw new Error('Unknown service.');
    if (message.length < 10 || message.length > 800) {
      throw new Error('Correction length is invalid.');
    }

    const submittedAt = Date.now();
    return await ctx.db.insert('correctionReports', {
      ...args,
      message,
      status: 'pending',
      submittedAt,
      expiresAt: submittedAt + retentionMs,
    });
  },
});

export const moderate = internalMutation({
  args: {
    reportId: v.id('correctionReports'),
    outcome: v.union(v.literal('resolved'), v.literal('dismissed')),
  },
  handler: async (ctx, { reportId, outcome }) => {
    const report = await ctx.db.get(reportId);
    if (!report) throw new Error('Correction report not found.');
    if (report.status !== 'pending') {
      throw new Error('Correction report has already been moderated.');
    }

    const resolvedAt = Date.now();
    await ctx.db.patch(reportId, { status: outcome, resolvedAt });
    return { reportId, status: outcome, resolvedAt };
  },
});

export const purgeExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const expired = await ctx.db
      .query('correctionReports')
      .withIndex('by_expiresAt', (query) => query.lte('expiresAt', Date.now()))
      .take(500);

    for (const report of expired) await ctx.db.delete(report._id);

    if (expired.length === 500) {
      await ctx.scheduler.runAfter(0, internal.corrections.purgeExpired, {});
    }

    console.log(JSON.stringify({ event: 'correction-retention', deleted: expired.length }));
  },
});

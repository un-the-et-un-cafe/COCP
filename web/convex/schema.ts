import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  correctionReports: defineTable({
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
    status: v.union(
      v.literal('pending'),
      v.literal('resolved'),
      v.literal('dismissed'),
    ),
    submittedAt: v.number(),
    resolvedAt: v.optional(v.number()),
    expiresAt: v.number(),
  })
    .index('by_expiresAt', ['expiresAt'])
    .index('by_status_submittedAt', ['status', 'submittedAt']),
});

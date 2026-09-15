import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  serviceListings: defineTable({
    id: v.string(),
    name: v.string(),
    categories: v.array(v.string()),
    audience: v.array(v.string()),
    location: v.object({
      label: v.string(),
      coordinates: v.union(v.null(), v.array(v.number())),
      map_url: v.union(v.null(), v.string()),
    }),
    contact: v.any(),
    source: v.object({
      title: v.string(),
      page: v.number(),
      notes: v.string(),
    }),
    verification: v.object({
      status: v.union(v.literal('unverified'), v.literal('verified')),
      checked_at: v.union(v.null(), v.string()),
      expires_at: v.union(v.null(), v.string()),
      owner: v.union(v.null(), v.string()),
    }),
    publishable: v.boolean(),
  }).index('by_listingId', ['id']),
  directorySync: defineTable({
    sourceHash: v.string(),
    listingCount: v.number(),
    syncedAt: v.number(),
    environment: v.union(v.literal('development'), v.literal('production')),
  }).index('by_syncedAt', ['syncedAt']),
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

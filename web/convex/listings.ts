import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';

export const recordImport = internalMutation({
  args: {
    sourceHash: v.string(),
    listingCount: v.number(),
    environment: v.union(v.literal('development'), v.literal('production')),
  },
  handler: async (ctx, args) => {
    const listings = await ctx.db.query('serviceListings').collect();
    const uniqueIds = new Set(listings.map((listing) => listing.id));
    if (listings.length !== args.listingCount || uniqueIds.size !== listings.length) {
      throw new Error('Imported listing count or identifiers do not match the source.');
    }

    for (const previous of await ctx.db.query('directorySync').collect()) {
      await ctx.db.delete(previous._id);
    }

    const syncedAt = Date.now();
    await ctx.db.insert('directorySync', { ...args, syncedAt });
    return { synced: true, listingCount: listings.length, syncedAt, environment: args.environment };
  },
});

export const getStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sync = await ctx.db.query('directorySync').withIndex('by_syncedAt').order('desc').first();
    if (!sync) return { synced: false, listingCount: 0 };
    const listings = await ctx.db.query('serviceListings').collect();
    return {
      synced: listings.length === sync.listingCount,
      listingCount: listings.length,
      sourceHash: sync.sourceHash,
      syncedAt: sync.syncedAt,
      environment: sync.environment,
    };
  },
});

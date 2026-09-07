import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const correctionReports = sqliteTable(
  'correction_reports',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id').notNull(),
    reportType: text('report_type', { enum: ['hours', 'location', 'contact', 'service', 'closed', 'safety', 'other'] }).notNull(),
    message: text('message').notNull(),
    language: text('language', { enum: ['fr', 'en', 'ar'] }).notNull(),
    status: text('status', { enum: ['submitted', 'reviewing', 'resolved', 'rejected'] }).notNull().default('submitted'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
    deleteAfter: integer('delete_after', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_correction_reports_status_created').on(table.status, table.createdAt),
    index('idx_correction_reports_delete_after').on(table.deleteAfter),
  ],
);

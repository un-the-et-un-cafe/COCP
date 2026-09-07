import { env } from 'cloudflare:workers';
import type { CorrectionInput } from './correction-validation';

function getDatabase(): D1Database {
  const bindings = env as unknown as { DB?: D1Database };
  if (!bindings.DB) throw new Error('Correction database is unavailable.');
  return bindings.DB;
}

export async function createCorrection(input: CorrectionInput) {
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  await getDatabase().prepare(`
    INSERT INTO correction_reports
      (id, listing_id, report_type, message, language, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'submitted', ?)
  `).bind(id, input.listingId, input.reportType, input.message, input.language, createdAt).run();
  return { id, status: 'submitted' as const, createdAt };
}

import { createCorrection } from '@/lib/corrections';
import { validateCorrection } from '@/lib/correction-validation';
import listings from '@/data/listings.json';

const jsonHeaders = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

export async function POST(request: Request) {
  try {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return Response.json({ error: 'Content type must be application/json.' }, { status: 415, headers: jsonHeaders });
    }
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > 4096) return Response.json({ error: 'Report is too large.' }, { status: 413, headers: jsonHeaders });
    const input = validateCorrection(await request.json());
    if (!listings.some((listing) => listing.id === input.listingId)) {
      return Response.json({ error: 'Choose a listed service.' }, { status: 400, headers: jsonHeaders });
    }
    const report = await createCorrection(input);
    return Response.json({ reportId: report.id, status: report.status }, { status: 201, headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to accept correction.';
    const unavailable = message === 'Correction database is unavailable.';
    return Response.json({ error: message }, { status: unavailable ? 503 : 400, headers: jsonHeaders });
  }
}

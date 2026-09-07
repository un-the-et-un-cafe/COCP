import { getStore } from '@netlify/blobs';
import listings from '../../data/listings.json';
import { validateCorrection } from '../../lib/correction-validation';

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export default async function corrections(request: Request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: jsonHeaders });
  }

  try {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return Response.json({ error: 'Content type must be application/json.' }, { status: 415, headers: jsonHeaders });
    }

    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 4096) {
      return Response.json({ error: 'Report is too large.' }, { status: 413, headers: jsonHeaders });
    }

    const input = validateCorrection(JSON.parse(body));
    if (!listings.some((listing) => listing.id === input.listingId)) {
      return Response.json({ error: 'Choose a listed service.' }, { status: 400, headers: jsonHeaders });
    }

    const submittedAt = new Date();
    const expiresAt = new Date(submittedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    const report = {
      id: crypto.randomUUID(),
      listingId: input.listingId,
      reportType: input.reportType,
      message: input.message,
      language: input.language,
      status: 'pending',
      submittedAt: submittedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const store = getStore({ name: 'correction-reports', consistency: 'strong' });
    await store.setJSON(report.id, report, {
      metadata: { expiresAt: report.expiresAt },
      onlyIfNew: true,
    });

    return Response.json({ reportId: report.id, status: report.status }, { status: 201, headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to accept correction.';
    return Response.json({ error: message }, { status: 400, headers: jsonHeaders });
  }
}

export const config = { path: '/api/corrections' };

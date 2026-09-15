import directoryListings from '../../data/listings.json';
import { validateCorrection } from '../../lib/correction-validation';

const listings = directoryListings as Array<{ id: string }>;

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export default async function corrections(request: Request) {
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed.' },
      { status: 405, headers: jsonHeaders },
    );
  }

  try {
    if (
      !request.headers
        .get('content-type')
        ?.toLowerCase()
        .startsWith('application/json')
    ) {
      return Response.json(
        { error: 'Content type must be application/json.' },
        { status: 415, headers: jsonHeaders },
      );
    }

    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > 4096) {
      return Response.json(
        { error: 'Report is too large.' },
        { status: 413, headers: jsonHeaders },
      );
    }

    const input = validateCorrection(JSON.parse(body));
    if (!listings.some((listing) => listing.id === input.listingId)) {
      return Response.json(
        { error: 'Choose a listed service.' },
        { status: 400, headers: jsonHeaders },
      );
    }

    const siteUrl = process.env.CONVEX_SITE_URL;
    const apiToken = process.env.CORRECTION_API_TOKEN;
    if (!siteUrl || !apiToken) {
      throw new Error('Correction database is unavailable.');
    }

    const response = await fetch(`${siteUrl}/corrections`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
      listingId: input.listingId,
      reportType: input.reportType,
      message: input.message,
      language: input.language,
      }),
    });

    if (!response.ok) {
      throw new Error('Correction database is unavailable.');
    }

    const report = (await response.json()) as {
      reportId: string;
      status: 'pending';
    };
    return Response.json(report, { status: 201, headers: jsonHeaders });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to accept correction.';
    const unavailable = message === 'Correction database is unavailable.';
    return Response.json(
      { error: unavailable ? 'Correction database is unavailable.' : message },
      { status: unavailable ? 503 : 400, headers: jsonHeaders },
    );
  }
}

export const config = {
  path: '/api/corrections',
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};

import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import { httpRouter } from 'convex/server';

const http = httpRouter();

http.route({
  path: '/corrections',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const expectedToken = process.env.CORRECTION_API_TOKEN;
    if (
      !expectedToken ||
      request.headers.get('authorization') !== `Bearer ${expectedToken}`
    ) {
      return new Response(null, { status: 401 });
    }

    try {
      const args = (await request.json()) as {
        listingId: string;
        reportType:
          | 'hours'
          | 'location'
          | 'contact'
          | 'service'
          | 'closed'
          | 'safety'
          | 'other';
        message: string;
        language: 'fr' | 'en' | 'ar';
      };
      const reportId = await ctx.runMutation(internal.corrections.submit, args);
      return Response.json({ reportId, status: 'pending' }, { status: 201 });
    } catch {
      return Response.json({ error: 'Invalid correction report.' }, { status: 400 });
    }
  }),
});

export default http;

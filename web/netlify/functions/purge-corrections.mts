import { getStore } from '@netlify/blobs';

type ExpirationMetadata = { expiresAt?: unknown };

export default async function purgeCorrections() {
  const store = getStore({ name: 'correction-reports', consistency: 'strong' });
  const now = Date.now();
  let inspected = 0;
  let deleted = 0;

  for await (const page of store.list({ paginate: true })) {
    for (const blob of page.blobs) {
      inspected += 1;
      const entry = await store.getWithMetadata(blob.key, { type: 'json' });
      const metadata = entry?.metadata as ExpirationMetadata | undefined;
      const expiresAt = typeof metadata?.expiresAt === 'string' ? Date.parse(metadata.expiresAt) : Number.NaN;

      if (Number.isFinite(expiresAt) && expiresAt <= now) {
        await store.delete(blob.key);
        deleted += 1;
      }
    }
  }

  console.log(JSON.stringify({ event: 'correction-retention', inspected, deleted }));
}

export const config = { schedule: '@daily' };

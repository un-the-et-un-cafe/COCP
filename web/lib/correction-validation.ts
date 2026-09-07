export const reportTypes = ['hours', 'location', 'contact', 'service', 'closed', 'safety', 'other'] as const;
export const reportLanguages = ['fr', 'en', 'ar'] as const;

export type CorrectionInput = {
  listingId: string;
  reportType: (typeof reportTypes)[number];
  message: string;
  language: (typeof reportLanguages)[number];
  privacyConfirmed: boolean;
  website?: string;
};

export function validateCorrection(value: unknown): CorrectionInput {
  if (!value || typeof value !== 'object') throw new Error('Invalid correction report.');
  const input = value as Partial<CorrectionInput>;
  const listingId = typeof input.listingId === 'string' ? input.listingId.trim() : '';
  const message = typeof input.message === 'string' ? input.message.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim() : '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(listingId)) throw new Error('Choose a valid service.');
  if (!reportTypes.includes(input.reportType as CorrectionInput['reportType'])) throw new Error('Choose a valid correction type.');
  if (!reportLanguages.includes(input.language as CorrectionInput['language'])) throw new Error('Choose a valid language.');
  if (message.length < 10 || message.length > 800) throw new Error('The correction must contain between 10 and 800 characters.');
  if (input.privacyConfirmed !== true) throw new Error('Confirm that the report contains no personal case information.');
  if (input.website) throw new Error('Automated submission rejected.');
  return { listingId, reportType: input.reportType as CorrectionInput['reportType'], message, language: input.language as CorrectionInput['language'], privacyConfirmed: true };
}

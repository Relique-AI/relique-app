import type { TFunction } from 'i18next';

// Codes renvoyés par certaines Supabase Edge Functions (voir supabase/functions/_shared/errors.ts).
// Les fonctions plus anciennes renvoient encore du texte français en dur — dans ce cas
// on affiche le message tel quel plutôt que de le traduire.
const KNOWN_API_ERROR_CODES = new Set([
  'unauthorized',
  'transaction_not_found',
  'invalid_body',
]);

export function translateApiError(message: string | null | undefined, t: TFunction): string {
  if (!message) return t('common.errorOccurred');
  if (KNOWN_API_ERROR_CODES.has(message)) return t(`apiErrors.${message}`);
  return message;
}

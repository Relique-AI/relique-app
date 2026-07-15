// Codes d'erreur communs renvoyés par les edge functions, à traduire côté client
// (voir src/utils/apiError.ts). Évite de dupliquer des messages français en dur
// dans chaque fonction — un code stable est indépendant de la langue de l'app.
export const ErrorCode = {
  UNAUTHORIZED: 'unauthorized',
  TRANSACTION_NOT_FOUND: 'transaction_not_found',
  INVALID_BODY: 'invalid_body',
} as const;

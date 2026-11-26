export const logSafeError = (context: string, error: unknown): void => {
  const details = error instanceof Error
    ? {
        name: error.name,
        message: error.message
          .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, '[redacted MongoDB URI]')
          .replace(/\b(password|secret|token)(\s*[:=]\s*)[^\s,;]+/gi, '$1$2[redacted]'),
      }
    : { name: 'UnknownError', message: 'Unknown server error.' };
  const code = typeof error === 'object' && error !== null && 'code' in error
    && (typeof error.code === 'string' || typeof error.code === 'number')
    ? error.code
    : undefined;

  console.error(`[${context}]`, { ...details, code });
};

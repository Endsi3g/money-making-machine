import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Ajuster ce taux selon le trafic pour rester dans les quotas
  tracesSampleRate: 1.0,

  // Capturer les erreurs de rendering
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Masquer les données sensibles
  maskAllText: true,
  blockAllMedia: true,
});

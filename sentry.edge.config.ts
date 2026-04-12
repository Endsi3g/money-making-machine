import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Taux de capture pour les fonctions Edge
  tracesSampleRate: 1.0,
  
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV !== "development" || !!process.env.SENTRY_FORCE_DEV,
});

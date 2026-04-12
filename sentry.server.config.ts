import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Taux de capture des transactions (API routes, SSR, etc.)
  tracesSampleRate: 1.0,

  // Activer le profiling pour les performances backend
  profilesSampleRate: 1.0,
  
  // Environnement (prod, staging, dev)
  environment: process.env.NODE_ENV,

  // Ne pas capturer les erreurs en local sauf spécifié
  enabled: process.env.NODE_ENV !== "development" || !!process.env.SENTRY_FORCE_DEV,
});

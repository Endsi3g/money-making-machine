"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APP_ROUTE_ERROR]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="max-w-md text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h2 className="text-lg font-bold tracking-tight">Erreur de chargement</h2>
        <p className="text-sm text-muted-foreground">
          Impossible de charger cette page. Veuillez réessayer.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">Réf: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}

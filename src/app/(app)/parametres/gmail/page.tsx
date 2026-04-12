"use client";

import { useState, useEffect } from "react";
import { Mail, Check, X, Loader2, ExternalLink, Unplug } from "lucide-react";

export default function GmailSettingsPage() {
  const [status, setStatus] = useState<{ connected: boolean; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchStatus();

    // Check for redirect params
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setMessage({ type: "success", text: "Gmail connecté avec succès !" });
      // Clean URL
      window.history.replaceState({}, "", "/parametres/gmail");
    } else if (params.get("error")) {
      const errorMap: Record<string, string> = {
        missing_code: "Code d'authorisation manquant",
        workspace_mismatch: "Erreur de workspace",
        exchange_failed: "Échec de l'échange OAuth",
      };
      setMessage({
        type: "error",
        text: errorMap[params.get("error")!] || "Erreur de connexion Gmail",
      });
      window.history.replaceState({}, "", "/parametres/gmail");
    }
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/gmail/status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/gmail/auth");
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setMessage({ type: "error", text: "Impossible d'initier la connexion Gmail" });
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/gmail/disconnect", { method: "POST" });
      setStatus({ connected: false });
      setMessage({ type: "success", text: "Gmail déconnecté" });
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la déconnexion" });
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Connexion Gmail</h1>
        <p className="text-muted-foreground mt-1">
          Connectez votre compte Gmail pour envoyer des campagnes email directement depuis l&apos;application.
        </p>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <X className="w-4 h-4 shrink-0" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Gmail card */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold">Google Gmail</h3>
              <p className="text-sm text-muted-foreground">
                {status?.connected
                  ? `Connecté en tant que ${status.email}`
                  : "Non connecté"}
              </p>
            </div>
            <div>
              {status?.connected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connecté
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  Déconnecté
                </span>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            {status?.connected ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Les emails de campagne seront envoyés depuis <strong>{status.email}</strong>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  {disconnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unplug className="w-4 h-4" />
                  )}
                  Déconnecter
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Autorisez l&apos;accès à Gmail pour envoyer des emails
                </div>
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {connecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  Connecter Gmail
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="rounded-xl border bg-muted/30 p-6 space-y-3">
        <h4 className="font-medium text-sm">Informations importantes</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Nous utilisons uniquement la permission <strong>gmail.send</strong> pour envoyer des emails.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Vos tokens sont chiffrés en AES-256-GCM avant d&apos;être stockés.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Gmail a une limite de ~500 emails/jour pour les comptes personnels.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            Vous pouvez révoquer l&apos;accès à tout moment depuis votre compte Google ou ici.
          </li>
        </ul>
      </div>
    </div>
  );
}

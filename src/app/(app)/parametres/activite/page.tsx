"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Loader2,
  UserPlus,
  UserMinus,
  Mail,
  Search,
  Sparkles,
  Edit,
  Trash2,
  Send,
  Shield,
  ChevronDown,
} from "lucide-react";

interface LogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

const actionConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  MEMBER_INVITED: { icon: UserPlus, label: "Membre invité", color: "text-blue-500" },
  MEMBER_JOINED: { icon: UserPlus, label: "Membre rejoint", color: "text-emerald-500" },
  MEMBER_REMOVED: { icon: UserMinus, label: "Membre retiré", color: "text-red-500" },
  MEMBER_ROLE_CHANGED: { icon: Shield, label: "Rôle modifié", color: "text-amber-500" },
  LEAD_CREATED: { icon: UserPlus, label: "Prospect créé", color: "text-blue-500" },
  LEAD_UPDATED: { icon: Edit, label: "Prospect modifié", color: "text-amber-500" },
  LEAD_DELETED: { icon: Trash2, label: "Prospect supprimé", color: "text-red-500" },
  SCRAPING_STARTED: { icon: Search, label: "Scraping lancé", color: "text-purple-500" },
  SCRAPING_COMPLETED: { icon: Search, label: "Scraping terminé", color: "text-emerald-500" },
  CAMPAIGN_CREATED: { icon: Mail, label: "Campagne créée", color: "text-blue-500" },
  CAMPAIGN_SENT: { icon: Send, label: "Campagne envoyée", color: "text-emerald-500" },
  ENRICHMENT_STARTED: { icon: Sparkles, label: "Enrichissement lancé", color: "text-purple-500" },
};

function formatRelativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(date).toLocaleDateString("fr-CA");
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs(cursor?: string) {
    const isMore = !!cursor;
    if (isMore) setLoadingMore(true);

    try {
      const params = new URLSearchParams({ take: "30" });
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/activite?${params}`);
      const data = await res.json();

      if (isMore) {
        setLogs((prev) => [...prev, ...data.logs]);
      } else {
        setLogs(data.logs);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch {
      console.error("Failed to fetch activity logs");
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Journal d&apos;activité</h1>
        <p className="text-muted-foreground mt-1">
          Historique des actions dans le workspace
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border bg-card">
          <Activity className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">Aucune activité</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Les actions apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="divide-y">
            {logs.map((log) => {
              const config = actionConfig[log.action] || {
                icon: Activity,
                label: log.action,
                color: "text-muted-foreground",
              };
              const Icon = config.icon;

              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                  {/* Icon */}
                  <div className={`mt-0.5 p-1.5 rounded-lg bg-muted/50 ${config.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <span className="font-medium">
                        {log.user.name || log.user.email}
                      </span>
                      <span className="text-muted-foreground ml-1.5">
                        {config.label.toLowerCase()}
                      </span>
                      {log.metadata && typeof log.metadata === "object" && (
                        <>
                          {"email" in log.metadata && (
                            <span className="text-muted-foreground">
                              {" "}&middot; {String(log.metadata.email)}
                            </span>
                          )}
                          {"role" in log.metadata && (
                            <span className="text-xs ml-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {String(log.metadata.role)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(log.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="px-5 py-3 border-t">
              <button
                onClick={() => nextCursor && fetchLogs(nextCursor)}
                disabled={loadingMore}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Charger plus
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

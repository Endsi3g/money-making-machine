"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  Pause,
  FileEdit,
  Loader2,
  Eye,
  MousePointerClick,
  Users,
  Trash2,
  BarChart3,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  emailsPerHour: number;
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  createdAt: string;
  _count: { campaignLeads: number };
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  BROUILLON: { icon: FileEdit, label: "Brouillon", className: "bg-muted text-muted-foreground" },
  PLANIFIE: { icon: Clock, label: "Planifié", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  EN_COURS: { icon: Send, label: "En cours", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  TERMINE: { icon: CheckCircle2, label: "Terminé", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  PAUSE: { icon: Pause, label: "Pause", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/campagnes");
      const data = await res.json();
      setCampaigns(data.campaigns);
    } catch {
      console.error("Failed to fetch campaigns");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette campagne ?")) return;
    try {
      await fetch(`/api/campagnes/${id}`, { method: "DELETE" });
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Erreur lors de la suppression");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campagnes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos campagnes email de prospection
          </p>
        </div>
        <Link
          href="/campagnes/nouvelle"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle campagne
        </Link>
      </div>

      {/* Campaigns list */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border bg-card">
          <Mail className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">Aucune campagne</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Créez votre première campagne email
          </p>
          <Link
            href="/campagnes/nouvelle"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer une campagne
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const sc = statusConfig[campaign.status] || statusConfig.BROUILLON;
            const StatusIcon = sc.icon;
            const openRate = campaign.totalSent > 0
              ? Math.round((campaign.totalOpened / campaign.totalSent) * 100)
              : 0;
            const clickRate = campaign.totalSent > 0
              ? Math.round((campaign.totalClicked / campaign.totalSent) * 100)
              : 0;

            return (
              <div
                key={campaign.id}
                className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/campagnes/${campaign.id}`}
                          className="font-semibold hover:underline truncate"
                        >
                          {campaign.name}
                        </Link>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${sc.className}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        Sujet: {campaign.subject}
                      </p>
                    </div>

                    {campaign.status === "BROUILLON" && (
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Stats bar */}
                  <div className="flex items-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{campaign._count.campaignLeads} destinataires</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Send className="w-3.5 h-3.5" />
                      <span>{campaign.totalSent} envoyés</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{openRate}% ouverture</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MousePointerClick className="w-3.5 h-3.5" />
                      <span>{clickRate}% clics</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

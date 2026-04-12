"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Loader2,
  Eye,
  MousePointerClick,
  Users,
  Check,
  X,
  Mail,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface CampaignDetail {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  status: string;
  emailsPerHour: number;
  totalRecipients: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  createdAt: string;
  campaignLeads: Array<{
    id: string;
    status: string;
    trackingId: string;
    sentAt: string | null;
    openedAt: string | null;
    clickedAt: string | null;
    lead: {
      id: string;
      businessName: string;
      email: string | null;
      emailExtracted: string | null;
      city: string | null;
      category: string | null;
    };
  }>;
}

const statusColors: Record<string, string> = {
  EN_ATTENTE: "text-muted-foreground",
  ENVOYE: "text-blue-600 dark:text-blue-400",
  DELIVRE: "text-emerald-600 dark:text-emerald-400",
  OUVERT: "text-amber-600 dark:text-amber-400",
  CLIQUE: "text-purple-600 dark:text-purple-400",
  REBONDI: "text-red-600 dark:text-red-400",
  ECHOUE: "text-destructive",
};

const statusLabels: Record<string, string> = {
  EN_ATTENTE: "En attente",
  ENVOYE: "Envoyé",
  DELIVRE: "Délivré",
  OUVERT: "Ouvert",
  CLIQUE: "Cliqué",
  REBONDI: "Rebondi",
  ECHOUE: "Échoué",
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchCampaign();
  }, []);

  async function fetchCampaign() {
    try {
      const res = await fetch(`/api/campagnes/${params.id}`);
      if (!res.ok) {
        router.push("/campagnes");
        return;
      }
      setCampaign(await res.json());
    } catch {
      router.push("/campagnes");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!confirm("Lancer l'envoi de cette campagne ? Les emails seront envoyés progressivement.")) return;

    setSending(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/campagnes/${params.id}/envoyer`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: data.message });
        fetchCampaign(); // Refresh
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setSending(false);
    }
  }

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const openRate = campaign.totalSent > 0
    ? Math.round((campaign.totalOpened / campaign.totalSent) * 100)
    : 0;
  const clickRate = campaign.totalSent > 0
    ? Math.round((campaign.totalClicked / campaign.totalSent) * 100)
    : 0;
  const canSend = campaign.status === "BROUILLON" || campaign.status === "PLANIFIE";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/campagnes")}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sujet: {campaign.subject}
            </p>
          </div>
        </div>

        {canSend && (
          <button
            onClick={handleSend}
            disabled={sending}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Envoyer la campagne
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Destinataires", value: campaign.campaignLeads.length, icon: Users, color: "text-blue-500" },
          { label: "Envoyés", value: campaign.totalSent, icon: Send, color: "text-emerald-500" },
          { label: "Ouverture", value: `${openRate}%`, icon: Eye, color: "text-amber-500" },
          { label: "Clics", value: `${clickRate}%`, icon: MousePointerClick, color: "text-purple-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold mt-1">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Recipients table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-5 py-3 border-b">
          <h3 className="font-semibold text-sm">Destinataires</h3>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {campaign.campaignLeads.map((cl) => (
            <div key={cl.id} className="flex items-center gap-4 px-5 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{cl.lead.businessName}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {cl.lead.email || cl.lead.emailExtracted}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {cl.lead.city || "—"}
              </div>
              <div className={`text-xs font-medium ${statusColors[cl.status] || ""}`}>
                {statusLabels[cl.status] || cl.status}
              </div>
              <div className="text-xs text-muted-foreground w-20 text-right">
                {cl.sentAt ? new Date(cl.sentAt).toLocaleDateString("fr-CA") : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

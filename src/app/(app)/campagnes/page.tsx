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
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const STATUS_CONFIG: Record<string, {
  icon: React.ElementType;
  label: string;
  badge: "default" | "info" | "warning" | "success" | "outline" | "dot";
}> = {
  BROUILLON: { icon: FileEdit,     label: "Brouillon", badge: "outline"  },
  PLANIFIE:  { icon: Clock,        label: "Planifié",  badge: "info"     },
  EN_COURS:  { icon: Send,         label: "En cours",  badge: "warning"  },
  TERMINE:   { icon: CheckCircle2, label: "Terminé",   badge: "success"  },
  PAUSE:     { icon: Pause,        label: "Pause",     badge: "outline"  },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show:  { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { fetchCampaigns(); }, []);

  async function fetchCampaigns() {
    try {
      const res  = await fetch("/api/campagnes");
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    } catch {
      toast.error("Impossible de charger les campagnes");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette campagne ?")) return;
    try {
      const res = await fetch(`/api/campagnes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur serveur");
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast.success("Campagne supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  // ── Aggregate stats ──
  const totalSent    = campaigns.reduce((s, c) => s + c.totalSent, 0);
  const totalOpened  = campaigns.reduce((s, c) => s + c.totalOpened, 0);
  const totalClicked = campaigns.reduce((s, c) => s + c.totalClicked, 0);
  const globalOpen   = totalSent > 0 ? Math.round((totalOpened  / totalSent) * 100) : 0;
  const globalClick  = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  const active       = campaigns.filter((c) => c.status === "EN_COURS").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground/50 text-xs font-mono uppercase tracking-widest">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ── Header ── */}
      <motion.div variants={rowVariants} className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#242424] leading-none mb-3">
            Campagnes
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Séquences email B2B actives
          </p>
        </div>
        <Button asChild size="sm" id="btn-new-campaign">
          <Link href="/campagnes/nouvelle">
            <Plus className="h-3.5 w-3.5" />
            Initier Flux
          </Link>
        </Button>
      </motion.div>

      {/* ── Aggregate metrics —only visible when data exists ── */}
      {campaigns.length > 0 && (
        <motion.div variants={rowVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Campagnes",   value: campaigns.length.toString(),                  id: "stat-total"   },
            { label: "En cours",    value: active.toString(),                             id: "stat-active"  },
            { label: "Ouverture",   value: `${globalOpen}%`,                              id: "stat-open"    },
            { label: "Clics",       value: `${globalClick}%`,                             id: "stat-click"   },
          ].map((s) => (
            <div key={s.id} id={s.id} className="bg-white p-6 rounded-xl shadow-cal-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {s.label}
              </div>
              <div className="text-3xl font-bold tracking-tight text-[#242424] leading-none">
                {s.value}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Campaign list ── */}
      {campaigns.length === 0 ? (
        <motion.div
          variants={rowVariants}
          className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-cal-2 mb-12"
          id="empty-campaigns"
        >
          <Mail className="w-8 h-8 text-muted-foreground/30 mb-4" strokeWidth={1.5} />
          <p className="text-sm font-medium text-muted-foreground">
            Aucune campagne pour le moment
          </p>
          <Button asChild variant="default" size="sm" className="mt-5" id="btn-create-first-campaign">
            <Link href="/campagnes/nouvelle">
              <Plus className="h-4 w-4" />
              Initier un flux
            </Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div variants={rowVariants} className="bg-white rounded-xl shadow-cal-2 overflow-hidden mb-12" id="campaigns-list">
          <div className="grid grid-cols-[1fr_auto] border-b border-border px-6 py-4 bg-gray-50/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Campagne
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Métriques
            </span>
          </div>

          {campaigns.map((campaign) => {
            const sc         = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.BROUILLON;
            const StatusIcon = sc.icon;
            const openRate   = campaign.totalSent > 0
              ? Math.round((campaign.totalOpened  / campaign.totalSent) * 100) : 0;
            const clickRate  = campaign.totalSent > 0
              ? Math.round((campaign.totalClicked / campaign.totalSent) * 100) : 0;

            return (
              <div
                key={campaign.id}
                className="flex items-center gap-5 px-6 py-5 border-b border-border/50 last:border-0 hover:bg-black/5 transition-colors group"
                id={`campaign-row-${campaign.id}`}
              >
                {/* Status icon */}
                <StatusIcon
                  className={cn(
                    "w-5 h-5 shrink-0",
                    campaign.status === "EN_COURS" ? "text-amber-500 animate-pulse" :
                    campaign.status === "TERMINE"  ? "text-emerald-500" :
                    campaign.status === "PLANIFIE" ? "text-[#242424]" :
                    "text-muted-foreground"
                  )}
                  strokeWidth={2}
                />

                {/* Name + subject */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/campagnes/${campaign.id}`}
                      className="text-base font-bold text-[#242424] hover:underline transition-colors tracking-tight truncate"
                    >
                      {campaign.name}
                    </Link>
                    <Badge variant={sc.badge}>{sc.label}</Badge>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mt-1 truncate">
                    {campaign.subject}
                  </p>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-5 shrink-0">
                  <div className="hidden sm:flex items-center gap-4 font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5" title="Leads">
                      <Users className="w-3 h-3" strokeWidth={1.5} />
                      <span>{campaign._count.campaignLeads}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Envoyés">
                      <Send className="w-3 h-3" strokeWidth={1.5} />
                      <span>{campaign.totalSent}</span>
                    </div>
                    <div
                      className={cn("flex items-center gap-1.5", openRate > 0 && "text-primary")}
                      title="Ouverture"
                    >
                      <Eye className="w-3 h-3" strokeWidth={1.5} />
                      <span>{openRate}%</span>
                    </div>
                    <div
                      className={cn("flex items-center gap-1.5", clickRate > 0 && "text-emerald-400")}
                      title="Clics"
                    >
                      <MousePointerClick className="w-3 h-3" strokeWidth={1.5} />
                      <span>{clickRate}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {campaign.status === "BROUILLON" && (
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        id={`delete-campaign-${campaign.id}`}
                        aria-label={`Supprimer la campagne ${campaign.name}`}
                        title="Supprimer cette campagne"
                        className="p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <Link
                      href={`/campagnes/${campaign.id}`}
                      aria-label={`Voir la campagne ${campaign.name}`}
                      id={`view-campaign-${campaign.id}`}
                      className="p-1.5 text-muted-foreground/30 hover:text-primary transition-colors rounded-md"
                    >
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  Search,
  Mail,
  ArrowRight,
  Sparkles,
  Plus,
  Eye,
  MousePointerClick,
  Activity,
  BarChart3,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { SourceBreakdown } from "@/components/dashboard/source-breakdown";
import { PageMotion, FadeItem } from "@/components/shared/page-motion";

export const metadata = {
  title: "Cockpit",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const workspaceId = session?.user?.workspaceId;

  const [
    leadStats,
    sourceStats,
    scrapingStats,
    campaignStats,
    campaignTotals,
    recentLeads,
    recentActivity,
  ] = await Promise.all([
    prisma.lead.groupBy({
      by: ["status"],
      where: { workspaceId: workspaceId ?? "" },
      _count: { id: true },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { workspaceId: workspaceId ?? "" },
      _count: { id: true },
    }),
    prisma.scrapingJob.groupBy({
      by: ["status"],
      where: { workspaceId: workspaceId ?? "" },
      _count: { id: true },
    }),
    prisma.campaign.groupBy({
      by: ["status"],
      where: { workspaceId: workspaceId ?? "" },
      _count: { id: true },
    }),
    prisma.campaign.aggregate({
      where: { workspaceId: workspaceId ?? "" },
      _sum: {
        totalSent: true,
        totalOpened: true,
        totalClicked: true,
        totalBounced: true,
      },
    }),
    prisma.lead.findMany({
      where: { workspaceId: workspaceId ?? "" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.activityLog.findMany({
      where: { workspaceId: workspaceId ?? "" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const totalLeads     = leadStats.reduce((sum, s) => sum + s._count.id, 0);
  const enrichedLeads  = leadStats.find((s) => s.status === "ENRICHI")?._count.id  || 0;
  const contactedLeads = leadStats.find((s) => s.status === "CONTACTE")?._count.id || 0;
  const convertedLeads = leadStats.find((s) => s.status === "CONVERTI")?._count.id || 0;
  const newLeads       = leadStats.find((s) => s.status === "NOUVEAU")?._count.id  || 0;
  const repliedLeads   = leadStats.find((s) => s.status === "REPONDU")?._count.id  || 0;

  const runningScrapingJobs = scrapingStats.find((s) => s.status === "EN_COURS")?._count.id || 0;
  const activeCampaigns     = campaignStats.find((s) => s.status === "EN_COURS")?._count.id || 0;

  const totalSent    = campaignTotals._sum.totalSent    || 0;
  const totalOpened  = campaignTotals._sum.totalOpened  || 0;
  const totalClicked = campaignTotals._sum.totalClicked || 0;
  const openRate     = totalSent > 0 ? Math.round((totalOpened  / totalSent) * 100) : 0;
  const clickRate    = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

  const pipelineData = [
    { name: "Nouveau",  value: newLeads,       color: "hsl(215 14% 34%)" },
    { name: "Enrichi",  value: enrichedLeads,  color: "hsl(188 70% 38%)" },
    { name: "Contacté", value: contactedLeads, color: "hsl(188 100% 52%)" },
    { name: "Répondu",  value: repliedLeads,   color: "hsl(158 64% 52%)" },
    { name: "Converti", value: convertedLeads, color: "hsl(142 76% 48%)" },
  ];

  const sourceData = sourceStats.map((s) => ({
    name: s.source.replace("_", " "),
    value: s._count.id,
  }));

  const kpiStats = [
    {
      label: "BASE TOTALE",
      value: totalLeads.toLocaleString("fr-CA"),
      icon: Users,
      sub: null,
      id: "kpi-total",
    },
    {
      label: "ENRICHIS IA",
      value: enrichedLeads.toLocaleString("fr-CA"),
      icon: Sparkles,
      sub: totalLeads > 0 ? `${Math.round((enrichedLeads / totalLeads) * 100)}% de la base` : null,
      id: "kpi-enriched",
    },
    {
      label: "EMAILS ENVOYÉS",
      value: totalSent.toLocaleString("fr-CA"),
      icon: Mail,
      sub: totalSent > 0 ? `${openRate}% ouverture` : null,
      id: "kpi-sent",
    },
    {
      label: "CONVERSIONS",
      value: convertedLeads.toLocaleString("fr-CA"),
      icon: TrendingUp,
      sub: totalLeads > 0 ? `${Math.round((convertedLeads / totalLeads) * 100)}% taux` : null,
      id: "kpi-converted",
      highlight: true,
    },
  ];

  return (
    <PageMotion>
      {/* ── Page header ── */}
      <FadeItem>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-[#242424] leading-none mb-3">
              Cockpit
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Vue d&apos;ensemble de l&apos;écosystème
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" asChild id="btn-new-scraping">
              <Link href="/scraping/nouveau">
                <Search className="h-4 w-4" />
                Scraping
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild id="btn-new-campaign">
              <Link href="/campagnes/nouvelle">
                <Mail className="h-4 w-4" />
                Campagne
              </Link>
            </Button>
            <Button size="sm" asChild id="btn-new-prospect">
              <Link href="/prospects/nouveau">
                <Plus className="h-4 w-4" />
                Prospect
              </Link>
            </Button>
          </div>
        </div>
      </FadeItem>

      {/* ── KPI Stats ── */}
      <FadeItem>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {kpiStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                id={stat.id}
                className="bg-white p-6 rounded-xl shadow-cal-2 group hover:shadow-cal-3 transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <Icon
                    className="h-5 w-5 text-muted-foreground/50"
                    strokeWidth={2}
                  />
                </div>
                <div className="text-3xl font-bold tracking-tight text-[#242424] leading-none mb-2">
                  {stat.value}
                </div>
                {stat.sub && (
                  <p className="text-sm text-muted-foreground mt-2 font-medium">
                    {stat.sub}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </FadeItem>

      {/* ── Campaign performance ── */}
      {totalSent > 0 && (
        <FadeItem>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                label: "TAUX D'OUVERTURE",
                value: `${openRate}%`,
                icon: Eye,
                id: "kpi-open-rate",
              },
              {
                label: "TAUX DE CLICS",
                value: `${clickRate}%`,
                icon: MousePointerClick,
                id: "kpi-click-rate",
              },
              {
                label: "CAMPAGNES ACTIVES",
                value: activeCampaigns.toString(),
                icon: Mail,
                id: "kpi-active-campaigns",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  id={stat.id}
                  className="bg-white p-5 rounded-xl shadow-cal-2 flex items-center gap-5"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#242424]" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-[#242424]">
                      {stat.value}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-1">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeItem>
      )}

      {/* ── Charts ── */}
      <FadeItem>
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Pipeline de conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineFunnel data={pipelineData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                Sources de leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SourceBreakdown data={sourceData} />
            </CardContent>
          </Card>
        </div>
      </FadeItem>

      {/* ── Status + Activity ── */}
      <FadeItem>
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          {/* Scraping & Campaigns */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  Scraping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {runningScrapingJobs > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#242424] font-medium">Tâches actives</span>
                      <Badge variant="info" id="scraping-count">{runningScrapingJobs}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Extraction en direct. Surveiller la progression système.
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-start gap-4">
                    <p className="text-sm text-muted-foreground">Système en veille.</p>
                    <Button size="sm" asChild id="btn-start-scraping">
                      <Link href="/scraping/nouveau">
                        <Search className="h-4 w-4" />
                        Initier Scraping
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Campagnes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeCampaigns > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#242424] font-medium">Flux d&apos;envoi actif</span>
                      <Badge variant="success" id="campaigns-count">{activeCampaigns}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Gmail en fonctionnement. Envois espacés en cours.
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-start gap-4">
                    <p className="text-sm text-muted-foreground">Aucun flux actif.</p>
                    <Button variant="outline" size="sm" asChild id="btn-start-campaign">
                      <Link href="/campagnes/nouvelle">
                        <Mail className="h-4 w-4" />
                        Lancer Campagne
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent activity */}
          <Card id="recent-activity">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Activité récente
              </CardTitle>
              <Link
                href="/parametres/activite"
                className="text-xs font-semibold text-muted-foreground hover:text-[#242424] transition-colors"
              >
                Tout voir
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {recentActivity.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <p className="text-sm text-muted-foreground/50 font-mono">
                    / NO_ACTIVITY
                  </p>
                </div>
              ) : (
                <div>
                  {recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-4 px-6 py-4 border-b border-border/50 last:border-0 hover:bg-black/5 transition-colors"
                    >
                      <div className="w-2 h-2 bg-[#242424] rounded-full shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">
                          <span className="font-semibold text-[#242424]">
                            {log.user.name || log.user.email}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            {log.action.toLowerCase().replace(/_/g, " ")}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeItem>

      {/* ── Recent leads ── */}
      <FadeItem>
        <Card id="recent-leads" className="mb-12">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle>Base de données — Entrées récentes</CardTitle>
            <Link
              href="/prospects"
              className="text-xs font-semibold text-muted-foreground hover:text-[#242424] transition-colors flex items-center gap-1"
            >
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeads.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground/50 font-mono">
                  / NO_DATA
                </p>
              </div>
            ) : (
              <div>
                {recentLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/prospects/${lead.id}`}
                    className="flex items-center justify-between px-6 py-4 border-b border-border/50 last:border-0 hover:bg-black/5 transition-colors group"
                    id={`lead-row-${lead.id}`}
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      <div className="w-2 h-2 bg-muted group-hover:bg-[#242424] rounded-full shrink-0 transition-colors" />
                      <div>
                        <p className="font-bold text-sm text-[#242424] truncate">
                          {lead.businessName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lead.city && `${lead.city} · `}
                          {formatDate(lead.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="px-3">{lead.status}</Badge>
                      {lead.score > 0 && (
                        <span className="text-xs font-mono font-semibold text-[#242424] tabular-nums">
                          {lead.score} pts
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-[#242424] group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeItem>
    </PageMotion>
  );
}

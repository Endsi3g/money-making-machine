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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const workspaceId = session?.user?.workspaceId;

  // Fetch all stats in parallel
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

  const totalLeads = leadStats.reduce((sum, s) => sum + s._count.id, 0);
  const enrichedLeads = leadStats.find((s) => s.status === "ENRICHI")?._count.id || 0;
  const contactedLeads = leadStats.find((s) => s.status === "CONTACTE")?._count.id || 0;
  const convertedLeads = leadStats.find((s) => s.status === "CONVERTI")?._count.id || 0;
  const newLeads = leadStats.find((s) => s.status === "NOUVEAU")?._count.id || 0;
  const repliedLeads = leadStats.find((s) => s.status === "REPONDU")?._count.id || 0;

  const runningScrapingJobs = scrapingStats.find((s) => s.status === "EN_COURS")?._count.id || 0;
  const activeCampaigns = campaignStats.find((s) => s.status === "EN_COURS")?._count.id || 0;

  const totalSent = campaignTotals._sum.totalSent || 0;
  const totalOpened = campaignTotals._sum.totalOpened || 0;
  const totalClicked = campaignTotals._sum.totalClicked || 0;
  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

  // Pipeline data for chart
  const pipelineData = [
    { name: "Nouveau", value: newLeads, color: "#6366f1" },
    { name: "Enrichi", value: enrichedLeads, color: "#8b5cf6" },
    { name: "Contacté", value: contactedLeads, color: "#f59e0b" },
    { name: "Répondu", value: repliedLeads, color: "#10b981" },
    { name: "Converti", value: convertedLeads, color: "#22c55e" },
  ];

  // Source data for chart
  const sourceData = sourceStats.map((s) => ({
    name: s.source.replace("_", " "),
    value: s._count.id,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">COCKPIT</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mt-1">
            Vue d&apos;ensemble de l&apos;écosystème
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-mono text-xs uppercase tracking-wider" asChild>
            <Link href="/scraping/nouveau">
              <Search className="h-3 w-3 mr-2" />
              Scraping
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="font-mono text-xs uppercase tracking-wider" asChild>
            <Link href="/campagnes/nouvelle">
              <Mail className="h-3 w-3 mr-2" />
              Campagne
            </Link>
          </Button>
          <Button size="sm" className="font-mono text-xs uppercase tracking-wider" asChild>
            <Link href="/prospects">
              <Plus className="h-3 w-3 mr-2" />
              Prospect
            </Link>
          </Button>
        </div>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "BASE TOTALE", value: totalLeads.toLocaleString("fr-CA"), icon: Users, sub: null },
          { label: "ENRICHIS (IA)", value: enrichedLeads.toLocaleString("fr-CA"), icon: Sparkles, sub: null },
          { label: "EMAILS ENVOYÉS", value: totalSent.toLocaleString("fr-CA"), icon: Mail, sub: totalSent > 0 ? `${openRate}% open` : null },
          { label: "CONVERSIONS", value: convertedLeads.toLocaleString("fr-CA"), icon: TrendingUp, sub: totalLeads > 0 ? `${Math.round((convertedLeads / totalLeads) * 100)}% taux` : null },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <p className="text-[10px] font-medium tracking-widest uppercase">{stat.label}</p>
                    <Icon className="h-4 w-4 opacity-50" />
                  </div>
                  <p className="text-3xl font-mono tracking-tight">{stat.value}</p>
                  {stat.sub && (
                    <p className="text-[10px] text-muted-foreground font-mono tracking-wider">{stat.sub}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Campaign performance row */}
      {totalSent > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "TAUX D'OUVERTURE", value: `${openRate}%`, icon: Eye, color: "text-amber-500" },
            { label: "TAUX DE CLICS", value: `${clickRate}%`, icon: MousePointerClick, color: "text-purple-500" },
            { label: "CAMPAGNES ACTIVES", value: activeCampaigns.toString(), icon: Mail, color: "text-blue-500" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-border/50 bg-card/50">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xl font-mono font-bold">{stat.value}</p>
                      <p className="text-[9px] text-muted-foreground tracking-widest uppercase">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3 border-b border-border/10">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5" />
              Pipeline de conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <PipelineFunnel data={pipelineData} />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-3 border-b border-border/10">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              Sources de leads
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <SourceBreakdown data={sourceData} />
          </CardContent>
        </Card>
      </div>

      {/* Active activities + recent leads */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Scraping + Campaigns status */}
        <div className="space-y-4">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Search className="h-3.5 w-3.5" />
                Scraping
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {runningScrapingJobs > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tâches Actives</span>
                    <Badge variant="outline" className="font-mono">{runningScrapingJobs}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Extraction en direct. Monitorer la progression système.
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-start gap-4">
                  <p className="text-sm text-muted-foreground">Système en veille.</p>
                  <Button variant="default" size="sm" className="font-mono text-xs uppercase tracking-wider" asChild>
                    <Link href="/scraping/nouveau">
                      <Search className="h-3 w-3 mr-2" />
                      Initier Scraping
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" />
                Campagnes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {activeCampaigns > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Flux d&apos;envoi actif</span>
                    <Badge variant="outline" className="font-mono">{activeCampaigns}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Gmail en fonctionnement. Envois espacés en cours.
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-start gap-4">
                  <p className="text-sm text-muted-foreground">Aucun flux actif.</p>
                  <Button variant="outline" size="sm" className="font-mono text-xs uppercase tracking-wider" asChild>
                    <Link href="/campagnes/nouvelle">
                      <Mail className="h-3 w-3 mr-2" />
                      Lancer Campagne
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent activity */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="border-b border-border/10 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              Activité récente
            </CardTitle>
            <Link href="/parametres/activite" className="text-[10px] text-primary hover:underline uppercase tracking-wider">
              Tout voir
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground font-mono">/ NO_ACTIVITY</p>
              </div>
            ) : (
              <div className="divide-y divide-border/10">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate">
                        <span className="font-medium">{log.user.name || log.user.email}</span>
                        <span className="text-muted-foreground ml-1">{log.action.toLowerCase().replace(/_/g, " ")}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent leads */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="border-b border-border/10 pb-4">
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Base de données: Entrées récentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground font-mono">/ NO_DATA</p>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/prospects/${lead.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                    <div>
                      <p className="font-mono font-medium text-sm text-foreground truncate">
                        {lead.businessName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 tracking-wide">
                        {lead.city && `${lead.city} // `}
                        {formatDate(lead.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {lead.status}
                    </Badge>
                    {lead.score > 0 && (
                      <span className="text-xs font-mono text-muted-foreground">{lead.score}pts</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

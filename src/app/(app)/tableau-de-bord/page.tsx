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
  Calendar,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const workspaceId = session?.user?.workspaceId;

  // Fetch all stats
  const [leadStats, scrapingStats, campaignStats, recentLeads] = await Promise.all([
    prisma.lead.groupBy({
      by: ["status"],
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
    prisma.lead.findMany({
      where: { workspaceId: workspaceId ?? "" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalLeads = leadStats.reduce((sum, s) => sum + s._count.id, 0);
  const enrichedLeads = leadStats.find((s) => s.status === "ENRICHI")?._count.id || 0;
  const contactedLeads = leadStats.find((s) => s.status === "CONTACTE")?._count.id || 0;
  const convertedLeads = leadStats.find((s) => s.status === "CONVERTI")?._count.id || 0;

  const runningScrapingJobs = scrapingStats.find((s) => s.status === "EN_COURS")?._count.id || 0;
  const activeCampaigns = campaignStats.find((s) => s.status === "EN_COURS")?._count.id || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Vue d'ensemble de votre activité de prospection
        </p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Prospects totals",
            value: totalLeads.toLocaleString("fr-CA"),
            icon: Users,
            color: "bg-blue-500",
          },
          {
            label: "Enrichis",
            value: enrichedLeads.toLocaleString("fr-CA"),
            icon: Sparkles,
            color: "bg-purple-500",
          },
          {
            label: "Contactés",
            value: contactedLeads.toLocaleString("fr-CA"),
            icon: Mail,
            color: "bg-green-500",
          },
          {
            label: "Convertis",
            value: convertedLeads.toLocaleString("fr-CA"),
            icon: TrendingUp,
            color: "bg-emerald-500",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active activities */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Scraping en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {runningScrapingJobs > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tâches actives</span>
                  <Badge className="bg-blue-100 text-blue-700">{runningScrapingJobs}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vos tâches de scraping sont en cours d'exécution. Vous pouvez suivre la progression sur la page Scraping.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Aucun scraping en cours</p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/scraping/nouveau">
                    <Search className="h-4 w-4 mr-2" />
                    Lancer un scraping
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Campagnes email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCampaigns > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Campagnes actives</span>
                  <Badge className="bg-green-100 text-green-700">{activeCampaigns}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vos campagnes sont en cours d'envoi. Consultez les stats sur la page Campagnes.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Aucune campagne active</p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/campagnes/nouvelle">
                    <Mail className="h-4 w-4 mr-2" />
                    Créer une campagne
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent leads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prospects récemment ajoutés</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Aucun prospect pour le moment</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/scraping/nouveau">Lancer un scraping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/prospects/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                      {lead.businessName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.city && `${lead.city} • `}
                      {formatDate(lead.createdAt)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

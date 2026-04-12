import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Search, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { JOB_STATUS_LABELS, SCRAPING_SOURCE_LABELS } from "@/types/scraping";

export default async function ScrapingPage() {
  const session = await getServerSession(authOptions);
  const workspaceId = session?.user?.workspaceId;

  const jobs = await prisma.scrapingJob.findMany({
    where: { workspaceId: workspaceId ?? "" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const stats = {
    pending: jobs.filter((j) => j.status === "EN_ATTENTE").length,
    running: jobs.filter((j) => j.status === "EN_COURS").length,
    completed: jobs.filter((j) => j.status === "TERMINE").length,
    totalLeads: jobs.reduce((sum, j) => sum + j.totalFound, 0),
  };

  function getStatusIcon(status: string) {
    switch (status) {
      case "EN_ATTENTE":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "EN_COURS":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "TERMINE":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "ECHOUE":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "EN_ATTENTE":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
      case "EN_COURS":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "TERMINE":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "ECHOUE":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
      default:
        return "";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scraping</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {stats.totalLeads.toLocaleString("fr-CA")} leads récupérés au total
          </p>
        </div>
        <Button asChild>
          <Link href="/scraping/nouveau">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau scraping
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "En attente", value: stats.pending, color: "bg-yellow-500" },
          { label: "En cours", value: stats.running, color: "bg-blue-500" },
          { label: "Terminés", value: stats.completed, color: "bg-green-500" },
          { label: "Leads totals", value: stats.totalLeads.toLocaleString("fr-CA"), color: "bg-purple-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-2 h-8 rounded ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Jobs table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Tâches de scraping
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">Aucune tâche de scraping pour le moment</p>
              <Button asChild className="mt-4">
                <Link href="/scraping/nouveau">Créer une première tâche</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <h4 className="font-medium text-sm">
                          {job.keywords} ({SCRAPING_SOURCE_LABELS[job.source]})
                        </h4>
                        <p className="text-xs text-muted-foreground">{job.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{job.totalScraped} leads</p>
                      <p className="text-xs text-muted-foreground">
                        {job.totalDupes > 0 && `${job.totalDupes} doublons`}
                      </p>
                    </div>

                    <Badge className={getStatusColor(job.status)}>
                      {JOB_STATUS_LABELS[job.status]}
                    </Badge>

                    <div className="text-right text-xs text-muted-foreground min-w-[120px]">
                      {job.createdAt && formatDateTime(job.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

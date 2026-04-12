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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">SCRAPING JOBS</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mt-1">
            / {stats.totalLeads.toLocaleString("fr-CA")} LEADS EXTRAITS
          </p>
        </div>
        <Button asChild className="rounded-sm font-mono text-[10px] uppercase tracking-widest">
          <Link href="/scraping/nouveau">
            <Plus className="h-3.5 w-3.5 mr-2" />
            Initier Processus
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "EN ATTENTE", value: stats.pending, color: "border-yellow-500/50 text-yellow-500" },
          { label: "EN COURS", value: stats.running, color: "border-blue-500/50 text-blue-500" },
          { label: "TERMINÉS", value: stats.completed, color: "border-green-500/50 text-green-500" },
          { label: "LEADS TOTAL", value: stats.totalLeads.toLocaleString("fr-CA"), color: "border-purple-500/50 text-purple-500" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/50 shadow-none">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-mono tracking-tight">{stat.value}</p>
                </div>
                <div className={`w-1 h-8 rounded-full border-r ${stat.color} opacity-50`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Jobs table */}
      <Card className="border-border/50 bg-card/50 shadow-none">
        <CardHeader className="border-b border-border/10 pb-3">
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            Logs des Tâches
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-mono text-sm">/ NO_JOBS_FOUND</p>
              <Button asChild variant="outline" size="sm" className="mt-4 rounded-sm font-mono text-xs uppercase tracking-widest">
                <Link href="/scraping/nouveau">Initier Processus</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div className="flex flex-col">
                        <h4 className="font-mono font-medium text-sm text-foreground uppercase">
                          {job.keywords} [{SCRAPING_SOURCE_LABELS[job.source]}]
                        </h4>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{job.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right font-mono">
                      <p className="text-sm text-primary">{job.totalScraped} <span className="text-muted-foreground text-xs">LEADS</span></p>
                      {job.totalDupes > 0 && <p className="text-[10px] text-muted-foreground">-{job.totalDupes} DUP</p>}
                    </div>

                    <Badge variant="outline" className={`font-mono text-[10px] uppercase tracking-widest rounded-sm ${getStatusColor(job.status)}`}>
                      {JOB_STATUS_LABELS[job.status]}
                    </Badge>

                    <div className="text-right font-mono text-[10px] text-muted-foreground min-w-[120px] uppercase tracking-widest">
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

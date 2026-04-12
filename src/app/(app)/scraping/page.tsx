import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Search, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { JOB_STATUS_LABELS, SCRAPING_SOURCE_LABELS } from "@/types/scraping";
import { PageMotion, FadeItem } from "@/components/shared/page-motion";

export default async function ScrapingPage() {
  const session = await getServerSession(authOptions);
  const workspaceId = session?.user?.workspaceId;

  const jobs = await prisma.scrapingJob.findMany({
    where: { workspaceId: workspaceId ?? "" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const stats = {
    pending: jobs.filter((j: any) => j.status === "EN_ATTENTE").length,
    running: jobs.filter((j: any) => j.status === "EN_COURS").length,
    completed: jobs.filter((j: any) => j.status === "TERMINE").length,
    totalLeads: jobs.reduce((sum: number, j: any) => sum + j.totalFound, 0),
  };

  function getStatusIcon(status: string) {
    switch (status) {
      case "EN_ATTENTE":
        return <Clock className="h-4 w-4 text-primary" strokeWidth={1.5} />;
      case "EN_COURS":
        return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" strokeWidth={1.5} />;
      case "TERMINE":
        return <CheckCircle className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />;
      case "ECHOUE":
        return <AlertCircle className="h-4 w-4 text-destructive" strokeWidth={1.5} />;
      default:
        return null;
    }
  }

  function getStatusBadgeVariant(status: string): "default" | "info" | "warning" | "success" | "destructive" | "outline" {
    switch (status) {
      case "EN_ATTENTE": return "info";
      case "EN_COURS":   return "warning";
      case "TERMINE":    return "success";
      case "ECHOUE":     return "destructive";
      default:           return "outline";
    }
  }

  return (
    <PageMotion>
      <div className="space-y-8">
        {/* Header */}
        <FadeItem>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-[#242424] leading-none mb-3">
                Scraping Jobs
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                {stats.totalLeads.toLocaleString("fr-CA")} Leads extraits
              </p>
            </div>
            <Button size="sm" asChild id="btn-new-scraping">
              <Link href="/scraping/nouveau">
                <Plus className="h-3.5 w-3.5" />
                Initier Processus
              </Link>
            </Button>
          </div>
        </FadeItem>

        {/* Stats grid */}
        <FadeItem>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: "En Attente", value: stats.pending, id: "stat-pending" },
              { label: "En Cours", value: stats.running, id: "stat-running" },
              { label: "Terminés", value: stats.completed, id: "stat-completed" },
              { label: "Leads extraits", value: stats.totalLeads.toLocaleString("fr-CA"), id: "stat-total" },
            ].map((stat) => (
              <div key={stat.id} id={stat.id} className="bg-white p-6 rounded-xl shadow-cal-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {stat.label}
                </div>
                <div className="text-3xl font-bold tracking-tight text-[#242424] leading-none">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </FadeItem>

        {/* Jobs list */}
        <FadeItem>
          <div className="bg-white rounded-xl shadow-cal-2 overflow-hidden mb-12">
            <div className="px-6 py-4 border-b border-border bg-gray-50/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Search className="h-4 w-4" />
                Journal d&apos;exécution
              </h3>
            </div>
            
            <div className="divide-y divide-border/50">
              {jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48" id="empty-state-scraping">
                  <p className="text-xs font-mono tracking-widest uppercase text-muted-foreground/50">
                    / System_idle
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-4 rounded-sm">
                    <Link href="/scraping/nouveau">Lancer un extracteur</Link>
                  </Button>
                </div>
              ) : (
                jobs.map((job: any) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between px-6 py-5 hover:bg-black/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(job.status)}
                      <div>
                        <h4 className="text-sm font-semibold text-[#242424] tracking-tight">
                          {job.keywords}{" "}
                          <span className="text-muted-foreground ml-2 font-medium">
                            [{SCRAPING_SOURCE_LABELS[job.source]}]
                          </span>
                        </h4>
                        <p className="text-xs font-medium text-muted-foreground mt-1">
                          {job.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-1.5 font-mono text-sm group">
                          <span className="text-foreground">{job.totalScraped}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Leads</span>
                        </div>
                        {job.totalDupes > 0 && (
                          <p className="text-[10px] text-muted-foreground/60 font-mono">
                            -{job.totalDupes} dup
                          </p>
                        )}
                      </div>

                      <div className="w-24 text-right">
                        <Badge variant={getStatusBadgeVariant(job.status)}>
                          {JOB_STATUS_LABELS[job.status]}
                        </Badge>
                      </div>

                      <div className="text-right font-mono text-[10px] text-muted-foreground/60 min-w-[120px] tracking-wide">
                        {job.createdAt && formatDateTime(job.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </FadeItem>
      </div>
    </PageMotion>
  );
}

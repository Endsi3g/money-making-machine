import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, UserX } from "lucide-react";
import { LeadFilters } from "@/components/prospects/lead-filters";
import { LeadsClient } from "./leads-client";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { LeadSource, LeadStatus } from "@prisma/client";
import { PageMotion, FadeItem } from "@/components/shared/page-motion";

interface PageProps {
  searchParams: {
    search?: string;
    status?: string;
    source?: string;
    city?: string;
    cursor?: string;
  };
}

export default async function ProspectsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const workspaceId = session?.user?.workspaceId;

  const where = {
    workspaceId: workspaceId ?? "",
    ...(searchParams.search && {
      OR: [
        { businessName: { contains: searchParams.search, mode: "insensitive" as const } },
        { email: { contains: searchParams.search, mode: "insensitive" as const } },
        { phone: { contains: searchParams.search } },
        { city: { contains: searchParams.search, mode: "insensitive" as const } },
      ],
    }),
    ...(searchParams.status && { status: searchParams.status as LeadStatus }),
    ...(searchParams.source && { source: searchParams.source as LeadSource }),
  };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.lead.count({ where }),
  ]);

  // Stats
  const stats = await prisma.lead.groupBy({
    by: ["status"],
    where: { workspaceId: workspaceId ?? "" },
    _count: { id: true },
  });

  return (
    <PageMotion>
      <div className="space-y-8">
        {/* Header */}
        <FadeItem>
          <div className="flex mb-8 items-start justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-[#242424] leading-none mb-3">
                Prospects
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                {total.toLocaleString("fr-CA")} CONTACTS EN BASE
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/prospects/import">
                  <Upload className="w-3.5 h-3.5" />
                  Importer
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/prospects/doublons">
                  <UserX className="w-3.5 h-3.5 text-amber-500/70" />
                  Doublons
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/prospects/export`} download>
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </a>
              </Button>
              <Button size="sm" asChild>
                <Link href="/prospects/nouveau">
                  <Plus className="w-3.5 h-3.5" />
                  Nouveau
                </Link>
              </Button>
            </div>
          </div>
        </FadeItem>

        {/* Stats pills */}
        <FadeItem>
          <div className="flex gap-4 flex-wrap mb-8">
            {stats.map((s) => (
              <div
                key={s.status}
                className="flex items-center justify-between gap-6 px-6 py-4 bg-white rounded-xl shadow-cal-2 flex-1 min-w-[200px]"
              >
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {s.status}
                </span>
                <span className="text-2xl font-bold tracking-tight text-[#242424]">
                  {s._count.id}
                </span>
              </div>
            ))}
          </div>
        </FadeItem>

        {/* Filters */}
        <FadeItem>
          <div className="p-6 bg-white rounded-t-xl shadow-[inset_0_1px_0_rgba(255,255,255,1),_0_1px_5px_-4px_rgba(19,19,22,0.7),_0_0_0_1px_rgba(34,42,53,0.08)] space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Vues & Filtres
            </h3>
            <LeadFilters />
          </div>
        </FadeItem>

        {/* Table */}
        <FadeItem>
          <div className="bg-white rounded-b-xl shadow-cal-2 overflow-hidden mb-12 -mt-4 border-t border-border">
            <Suspense fallback={<TableSkeleton rows={8} />}>
              <LeadsClient initialLeads={leads} total={total} />
            </Suspense>
          </div>
        </FadeItem>
      </div>
    </PageMotion>
  );
}

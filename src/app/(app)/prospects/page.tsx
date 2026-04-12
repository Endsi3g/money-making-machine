import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Download, Users } from "lucide-react";
import { LeadFilters } from "@/components/prospects/lead-filters";
import { LeadsClient } from "./leads-client";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { LeadSource, LeadStatus } from "@prisma/client";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prospects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {total.toLocaleString("fr-CA")} prospect{total !== 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/prospects/export`} download>
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link href="/prospects/nouveau">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau prospect
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats pills */}
      <div className="flex gap-2 flex-wrap">
        {stats.map((s) => (
          <div
            key={s.status}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium"
          >
            <Users className="w-3 h-3" />
            <span className="text-muted-foreground">{s.status}:</span>
            <span>{s._count.id}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <LeadFilters />

      {/* Table */}
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <LeadsClient initialLeads={leads} total={total} />
      </Suspense>
    </div>
  );
}

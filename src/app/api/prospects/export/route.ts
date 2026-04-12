import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { LeadSource, LeadStatus } from "@prisma/client";
import { stringify } from "csv-stringify/sync";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as LeadStatus | null;
  const source = searchParams.get("source") as LeadSource | null;
  const ids = searchParams.get("ids")?.split(",").filter(Boolean);

  const leads = await prisma.lead.findMany({
    where: {
      workspaceId,
      ...(status && { status }),
      ...(source && { source }),
      ...(ids && ids.length > 0 && { id: { in: ids } }),
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const csvData = leads.map((lead) => ({
    "Nom d'entreprise": lead.businessName,
    Catégorie: lead.category || "",
    Adresse: lead.address || "",
    Ville: lead.city || "",
    Province: lead.province || "",
    "Code postal": lead.postalCode || "",
    Téléphone: lead.phone || "",
    Email: lead.email || "",
    Site web: lead.website || "",
    Source: lead.source,
    Statut: lead.status,
    Score: lead.score,
    Facebook: lead.facebook || "",
    Instagram: lead.instagram || "",
    LinkedIn: lead.linkedin || "",
    "Résumé IA": lead.aiSummary || "",
    "Email extrait": lead.emailExtracted || "",
    Notes: lead.notes || "",
    "Date de création": lead.createdAt.toISOString(),
  }));

  const csv = stringify(csvData, { header: true });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prospects-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

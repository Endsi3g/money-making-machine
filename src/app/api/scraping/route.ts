import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { scrapingQueue } from "@/lib/queues/scraping-queue";
import { z } from "zod";
import { ScrapingSource, JobStatus } from "@prisma/client";

const createJobSchema = z.object({
  source: z.enum(["PAGES_JAUNES", "YELP", "GOOGLE_MAPS"]),
  keywords: z.string().min(1, "Mots-clés requis"),
  location: z.string().min(1, "Localisation requise"),
  maxResults: z.number().int().min(10).max(500).default(100),
});

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as JobStatus | null;

  const jobs = await prisma.scrapingJob.findMany({
    where: {
      workspaceId,
      ...(status && { status }),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { source, keywords, location, maxResults } = parsed.data;

    // Create job in DB
    const job = await prisma.scrapingJob.create({
      data: {
        workspaceId,
        source: source as ScrapingSource,
        keywords,
        location,
        maxResults,
        status: JobStatus.EN_ATTENTE,
      },
    });

    // Add to queue
    const bullJob = await scrapingQueue.add(
      "scrape",
      {
        jobId: job.id,
        workspaceId,
        source: source as any,
        keywords,
        location,
        maxResults,
      },
      { jobId: job.id, removeOnComplete: false }
    );

    // Store BullMQ job ID
    await prisma.scrapingJob.update({
      where: { id: job.id },
      data: { bullJobId: bullJob.id },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    console.error("[SCRAPING_CREATE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

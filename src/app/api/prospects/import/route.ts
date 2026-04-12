import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

/**
 * API pour importer massivement des prospects via un fichier CSV.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const csvContent = await file.text();
    const records = parse(csvContent, {
      columns: true, // Utiliser la première ligne comme en-têtes
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`[Import] Processing ${records.length} records for workspace ${session.user.workspaceId}`);

    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    // Mapping flexible des colonnes
    const findValue = (record: any, possibleKeys: string[]) => {
      const keys = Object.keys(record);
      const match = keys.find(k => possibleKeys.includes(k.toLowerCase().replace(/[^a-z]/g, "")));
      return match ? record[match] : null;
    };

    for (const record of records) {
      try {
        const businessName = findValue(record, ["businessname", "nom", "entreprise", "nomducommerce", "company"]);
        const email = findValue(record, ["email", "courriel"]);
        const phone = findValue(record, ["phone", "telephone", "tel"]);
        const website = findValue(record, ["website", "site", "siteweb", "url"]);
        const address = findValue(record, ["address", "adresse"]);
        const city = findValue(record, ["city", "ville"]);
        const category = findValue(record, ["category", "categorie", "secteur"]);

        if (!businessName) {
          errorCount++;
          continue;
        }

        // Vérification sommaire des doublons dans le même import ou en DB
        const existing = await prisma.lead.findFirst({
          where: {
            workspaceId: session.user.workspaceId,
            businessName: businessName,
            city: city || undefined,
          },
        });

        if (existing) {
          duplicateCount++;
          continue;
}

        await prisma.lead.create({
          data: {
            workspaceId: session.user.workspaceId,
            businessName,
            email,
            phone,
            website,
            address,
            city,
            category,
            source: "IMPORT",
            status: "NOUVEAU",
          },
        });

        importedCount++;
      } catch (err) {
        console.error("[Import] Error processing record:", err);
        errorCount++;
      }
    }

    // Log l'activité
    await prisma.activityLog.create({
      data: {
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
        action: "IMPORT_CSV",
        entityType: "LEAD",
        metadata: {
          total: records.length,
          imported: importedCount,
          duplicates: duplicateCount,
          errors: errorCount,
          filename: file.name,
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        total: records.length,
        imported: importedCount,
        duplicates: duplicateCount,
        errors: errorCount,
      },
    });
  } catch (error) {
    console.error("[Import] Global error:", error);
    return NextResponse.json({ error: "Erreur lors de l'import" }, { status: 500 });
  }
}

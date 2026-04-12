import { PrismaClient, WorkspaceRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const user = await prisma.user.upsert({
    where: { email: "admin@monagence.ca" },
    update: {},
    create: {
      name: "Administrateur",
      email: "admin@monagence.ca",
      password: hashedPassword,
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "mon-agence" },
    update: {},
    create: {
      name: "Mon Agence",
      slug: "mon-agence",
    },
  });

  // Add user as owner
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: WorkspaceRole.OWNER,
      joinedAt: new Date(),
    },
  });

  // Create sample leads
  const sampleLeads = [
    {
      businessName: "Restaurant Le Vieux-Port",
      category: "Restaurant",
      city: "Montréal",
      province: "QC",
      phone: "514-555-0101",
      email: "info@levieuxport.ca",
      website: "https://levieuxport.ca",
      address: "123 Rue de la Commune O",
      source: "MANUEL" as const,
      status: "NOUVEAU" as const,
      score: 65,
    },
    {
      businessName: "Salon Coiffure Élégance",
      category: "Salon de coiffure",
      city: "Laval",
      province: "QC",
      phone: "450-555-0202",
      email: "elegance@coiffure.ca",
      website: "https://coiffureelegance.ca",
      address: "456 Boul. Saint-Martin O",
      source: "PAGES_JAUNES" as const,
      status: "ENRICHI" as const,
      score: 78,
      aiSummary:
        "Salon de coiffure haut de gamme à Laval avec 15 ans d'expérience. Spécialisé en colorations et traitements capillaires.",
    },
    {
      businessName: "Plomberie Dupont & Fils",
      category: "Plomberie",
      city: "Québec",
      province: "QC",
      phone: "418-555-0303",
      website: "https://plomberie-dupont.ca",
      address: "789 Av. Royale",
      source: "YELP" as const,
      status: "CONTACTE" as const,
      score: 82,
      rating: 4.5,
      reviewCount: 47,
    },
    {
      businessName: "Café Artisan Brûlerie",
      category: "Café",
      city: "Montréal",
      province: "QC",
      phone: "514-555-0404",
      email: "bonjour@artisanbrulerie.ca",
      website: "https://artisanbrulerie.ca",
      address: "321 Av. du Mont-Royal E",
      source: "GOOGLE_MAPS" as const,
      status: "REPONDU" as const,
      score: 91,
      rating: 4.8,
      reviewCount: 203,
    },
    {
      businessName: "Clinique Dentaire Sourire",
      category: "Dentiste",
      city: "Longueuil",
      province: "QC",
      phone: "450-555-0505",
      email: "info@cliniquesourire.ca",
      website: "https://cliniquesourire.ca",
      address: "654 Boul. Roland-Therrien",
      source: "PAGES_JAUNES" as const,
      status: "CONVERTI" as const,
      score: 95,
    },
  ];

  for (const lead of sampleLeads) {
    await prisma.lead.create({
      data: {
        ...lead,
        workspaceId: workspace.id,
      },
    });
  }

  console.log("✅ Seed terminé!");
  console.log(`   👤 Utilisateur: admin@monagence.ca / admin123`);
  console.log(`   🏢 Workspace: Mon Agence`);
  console.log(`   📋 ${sampleLeads.length} prospects créés`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

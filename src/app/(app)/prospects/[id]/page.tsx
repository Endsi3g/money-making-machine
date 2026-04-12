import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadStatusBadge } from "@/components/prospects/lead-status-badge";
import { LeadScoreIndicator } from "@/components/prospects/lead-score-indicator";
import { LEAD_SOURCE_LABELS } from "@/types/lead";
import { formatDate, formatDateTime, formatPhone } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Star,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { EnrichButton } from "./enrich-button";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const workspaceId = session?.user?.workspaceId;

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, workspaceId: workspaceId ?? "" },
    include: {
      campaignLeads: {
        include: { campaign: { select: { id: true, name: true, status: true, createdAt: true } } },
        orderBy: { sentAt: "desc" },
      },
      emailLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!lead) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/prospects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{lead.businessName}</h1>
              <LeadStatusBadge status={lead.status} />
              {lead.category && (
                <Badge variant="outline" className="font-normal">
                  {lead.category}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span>Source: {LEAD_SOURCE_LABELS[lead.source]}</span>
              <span>•</span>
              <span>Ajouté le {formatDate(lead.createdAt)}</span>
              {lead.rating && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {lead.rating.toFixed(1)}
                    {lead.reviewCount && (
                      <span className="text-muted-foreground">({lead.reviewCount} avis)</span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <EnrichButton leadId={lead.id} status={lead.status} />
          <Button asChild>
            <Link href={`/campagnes/nouvelle?leadId=${lead.id}`}>
              <Mail className="h-4 w-4 mr-2" />
              Envoyer email
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-4">
          <Tabs defaultValue="infos">
            <TabsList>
              <TabsTrigger value="infos">Informations</TabsTrigger>
              <TabsTrigger value="ai">Enrichissement IA</TabsTrigger>
              <TabsTrigger value="emails">Emails ({lead.campaignLeads.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="infos" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Coordonnées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        {formatPhone(lead.phone)}
                      </a>
                    </div>
                  )}
                  {(lead.email || lead.emailExtracted) && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="text-sm space-y-0.5">
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            className="block hover:text-primary transition-colors"
                          >
                            {lead.email}
                          </a>
                        )}
                        {lead.emailExtracted && lead.emailExtracted !== lead.email && (
                          <a
                            href={`mailto:${lead.emailExtracted}`}
                            className="block text-muted-foreground hover:text-primary transition-colors"
                          >
                            {lead.emailExtracted}
                            <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                              IA
                            </span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {lead.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {lead.website}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {(lead.address || lead.city) && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">
                        {[lead.address, lead.city, lead.province, lead.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {(lead.facebook || lead.instagram || lead.linkedin) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Réseaux sociaux</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {lead.facebook && (
                      <a
                        href={lead.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Facebook className="h-4 w-4 text-blue-600" />
                        Facebook
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    )}
                    {lead.instagram && (
                      <a
                        href={lead.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Instagram className="h-4 w-4 text-pink-600" />
                        Instagram
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    )}
                    {lead.linkedin && (
                      <a
                        href={lead.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Linkedin className="h-4 w-4 text-blue-700" />
                        LinkedIn
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {lead.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
              {lead.aiSummary ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      Analyse IA
                    </CardTitle>
                    {lead.enrichedAt && (
                      <p className="text-xs text-muted-foreground">
                        Enrichi le {formatDateTime(lead.enrichedAt)}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{lead.aiSummary}</p>

                    {lead.aiPersonalization && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">Données de personnalisation</h4>
                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                          {JSON.stringify(JSON.parse(lead.aiPersonalization), null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">Pas encore enrichi</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    Lancez l&apos;enrichissement IA pour obtenir une analyse complète et des données de personnalisation.
                  </p>
                  <EnrichButton leadId={lead.id} status={lead.status} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="emails" className="mt-4">
              {lead.campaignLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Mail className="h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">Aucun email envoyé</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ce prospect n&apos;a pas encore été contacté par email.
                  </p>
                  <Button asChild>
                    <Link href={`/campagnes/nouvelle?leadId=${lead.id}`}>
                      Créer une campagne
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {lead.campaignLeads.map((cl) => (
                    <Card key={cl.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{cl.campaign.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {cl.sentAt ? `Envoyé le ${formatDateTime(cl.sentAt)}` : "En attente"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <LeadStatusBadge status={cl.status as any} />
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/campagnes/${cl.campaign.id}`}>Voir</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadScoreIndicator score={lead.score} showLabel className="justify-center" />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Basé sur la complétude des données et l&apos;enrichissement IA
              </p>
            </CardContent>
          </Card>

          {lead.tags && lead.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Métadonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium">{LEAD_SOURCE_LABELS[lead.source]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé</span>
                <span>{formatDate(lead.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modifié</span>
                <span>{formatDate(lead.updatedAt)}</span>
              </div>
              {lead.enrichedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enrichi</span>
                  <span>{formatDate(lead.enrichedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

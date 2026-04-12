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
      <div className="flex items-start justify-between gap-4 pb-6 border-b border-border/30 mb-6">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" className="rounded-sm" asChild>
            <Link href="/prospects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight uppercase">{lead.businessName}</h1>
              <LeadStatusBadge status={lead.status} />
              {lead.category && (
                <Badge variant="outline" className="font-mono text-[10px] tracking-widest uppercase">
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
          <Button className="rounded-sm tracking-widest font-mono text-xs uppercase" asChild>
            <Link href={`/campagnes/nouvelle?leadId=${lead.id}`}>
              <Mail className="h-3.5 w-3.5 mr-2" />
              Email
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-4">
          <Tabs defaultValue="infos">
            <TabsList className="bg-transparent border-b border-border/30 w-full justify-start rounded-none p-0 h-auto gap-6 mb-4">
              <TabsTrigger value="infos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 font-mono text-[10px] uppercase tracking-widest">INFOS SYSTEME</TabsTrigger>
              <TabsTrigger value="ai" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2"><Sparkles className="h-3 w-3" />INTELLIGENCE ARTIFICIELLE</TabsTrigger>
              <TabsTrigger value="emails" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 font-mono text-[10px] uppercase tracking-widest">LOGS EMAILS ({lead.campaignLeads.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="infos" className="space-y-4 mt-0">
              <Card className="border-border/50 bg-card/50 shadow-none">
                <CardHeader className="border-b border-border/10 pb-3">
                  <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Coordonnées Réseau</CardTitle>
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
              {lead.aiSummary || lead.fitScore ? (
                <div className="space-y-4">
                  <Card className="border-border/50 bg-card/50 shadow-none">
                    <CardHeader className="border-b border-border/10 pb-3">
                      <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5" />
                        Analyse Business & Conformité
                      </CardTitle>
                      {lead.enrichedAt && (
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">
                          ÉVALUÉ LE : {formatDateTime(lead.enrichedAt).toUpperCase()}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {lead.requiresHumanReview && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-sm text-sm flex items-center gap-2">
                          <span className="font-bold">REVIEW_REQUIRED</span> : Ce profil nécessite une validation humaine (Compliance).
                        </div>
                      )}

                      {lead.complianceFlags && lead.complianceFlags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {lead.complianceFlags.map(flag => (
                            <Badge key={flag} variant="destructive" className="font-mono text-[9px]">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {lead.aiSummary && (
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Résumé Agent</h4>
                          <p className="text-sm leading-relaxed">{lead.aiSummary}</p>
                        </div>
                      )}

                      {(lead.suggestedAngle || lead.suggestedOffer) && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/10">
                          {lead.suggestedAngle && (
                            <div>
                              <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Angle Commercial</h4>
                              <p className="text-sm">{lead.suggestedAngle}</p>
                            </div>
                          )}
                          {lead.suggestedOffer && (
                            <div>
                              <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Offre Recommandée</h4>
                              <p className="text-sm">{lead.suggestedOffer}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {lead.draftEmail && (
                    <Card className="border-border/50 bg-card/50 shadow-none">
                      <CardHeader className="border-b border-border/10 pb-3">
                        <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Draft Email Suggéré</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <pre className="text-sm font-sans bg-muted/50 p-4 rounded-sm border border-border/50 whitespace-pre-wrap">
                          {lead.draftEmail}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
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

        <div className="space-y-4">
          <Card className="border-border/50 bg-card/50 shadow-none">
            <CardHeader className="border-b border-border/10 pb-3">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Scores Heuristiques</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mb-2 text-center">Score Global (Index)</p>
                <LeadScoreIndicator score={lead.score} showLabel className="justify-center" />
              </div>
              
              {(lead.fitScore !== null || lead.urgencyScore !== null) && (
                <div className="pt-4 border-t border-border/10 space-y-3">
                   {[
                     { label: "FIT SCORE", val: lead.fitScore },
                     { label: "URGENCE", val: lead.urgencyScore },
                     { label: "SEOGAP", val: lead.seoGapScore },
                     { label: "WEBGAP", val: lead.webGapScore },
                     { label: "CONTACT", val: lead.contactabilityScore },
                     { label: "AI MATURITY", val: lead.digitalAiMaturityScore },
                   ].filter(s => s.val !== null).map(s => (
                     <div key={s.label} className="flex items-center justify-between">
                       <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">{s.label}</span>
                       <span className="text-xs font-mono font-bold">{s.val}/100</span>
                     </div>
                   ))}
                </div>
              )}
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

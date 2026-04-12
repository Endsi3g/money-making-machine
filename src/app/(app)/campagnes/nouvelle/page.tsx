"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Mail,
  FileText,
  Users,
  Settings,
  Send,
  Search,
  X,
} from "lucide-react";

interface Lead {
  id: string;
  businessName: string;
  email: string | null;
  emailExtracted: string | null;
  city: string | null;
  category: string | null;
  status: string;
}

const STEPS = [
  { label: "Informations", icon: FileText },
  { label: "Contenu", icon: Mail },
  { label: "Destinataires", icon: Users },
  { label: "Paramètres", icon: Settings },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState(DEFAULT_TEMPLATE);
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [emailsPerHour, setEmailsPerHour] = useState(50);

  // Lead selection
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingLeads, setLoadingLeads] = useState(false);

  useEffect(() => {
    if (step === 2) fetchLeads();
  }, [step]);

  async function fetchLeads() {
    setLoadingLeads(true);
    try {
      const res = await fetch("/api/prospects?take=100");
      const data = await res.json();
      // Filter leads that have an email
      setLeads(
        data.leads.filter(
          (l: Lead) => (l.email || l.emailExtracted) && (l.email || l.emailExtracted)!.includes("@")
        )
      );
    } catch {
      console.error("Failed to fetch leads");
    } finally {
      setLoadingLeads(false);
    }
  }

  const filteredLeads = leads.filter((l) =>
    l.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function toggleLead(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    }
  }

  function canAdvance(): boolean {
    if (step === 0) return name.trim().length > 0 && subject.trim().length > 0;
    if (step === 1) return bodyHtml.trim().length > 0;
    if (step === 2) return selectedIds.size > 0;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/campagnes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          bodyHtml,
          fromName: fromName || undefined,
          fromEmail: fromEmail || undefined,
          replyTo: replyTo || undefined,
          emailsPerHour,
          leadIds: Array.from(selectedIds),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur lors de la création");
        return;
      }

      const campaign = await res.json();
      router.push(`/campagnes`);
    } catch {
      setError("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/campagnes")}
          className="p-2 rounded-sm border border-border/50 hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">NOUVELLE CAMPAGNE</h1>
          <p className="text-muted-foreground mt-0.5 text-[10px] tracking-widest uppercase font-mono">
            Paramétrage du flux de communication
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = i === step;
          const isDone = i < step;

          return (
            <div key={i} className="flex items-center justify-center flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`flex flex-col items-center justify-center gap-2 px-1 py-3 rounded-none border-b-2 font-mono text-[10px] uppercase tracking-widest transition-colors w-full ${
                  isActive
                    ? "border-primary text-primary"
                    : isDone
                    ? "border-emerald-500/50 text-emerald-500 hover:text-emerald-400"
                    : "border-border/30 text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <StepIcon className="w-4 h-4 shrink-0" />
                )}
                <span className="hidden sm:inline truncate mt-1">{s.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="border border-border/50 bg-card/50 shadow-none p-6">
        {/* Step 0: Name & Subject */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nom de la campagne</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Prospection paysagistes Montréal"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Sujet de l&apos;email
                <span className="text-muted-foreground font-normal ml-1">(supporte les variables)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: {{businessName}} — une idée pour votre site web"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Variables: {"{{businessName}}"}, {"{{firstName}}"}, {"{{city}}"}, {"{{category}}"}
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Body */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Corps du message (HTML)
                <span className="text-muted-foreground font-normal ml-1">(supporte Handlebars)</span>
              </label>
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={16}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Variables disponibles: {"{{businessName}}"}, {"{{firstName}}"}, {"{{city}}"}, {"{{category}}"}, {"{{aiPersonalization}}"}, {"{{email}}"}, {"{{phone}}"}, {"{{rating}}"}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Recipients */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedIds.size} destinataire{selectedIds.size !== 1 ? "s" : ""} sélectionné{selectedIds.size !== 1 ? "s" : ""}
              </p>
              <button
                onClick={selectAll}
                className="text-xs text-primary hover:underline"
              >
                {selectedIds.size === filteredLeads.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, ville, catégorie..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            {loadingLeads ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto rounded-lg border divide-y">
                {filteredLeads.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Aucun prospect avec un email trouvé
                  </div>
                ) : (
                  filteredLeads.map((lead) => (
                    <label
                      key={lead.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleLead(lead.id)}
                        className="w-4 h-4 rounded border-2 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{lead.businessName}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {lead.email || lead.emailExtracted} • {lead.city || "—"} • {lead.category || "—"}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Settings */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nom d&apos;expéditeur</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email d&apos;expéditeur</label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="Ex: jean@agence.ca"
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Adresse de réponse (Reply-To)</label>
              <input
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="Laisser vide pour utiliser l'adresse d'expéditeur"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Cadence d&apos;envoi
                <span className="text-muted-foreground font-normal ml-1">({emailsPerHour} emails/heure)</span>
              </label>
              <input
                type="range"
                min={10}
                max={200}
                step={10}
                value={emailsPerHour}
                onChange={(e) => setEmailsPerHour(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10/h (sûr)</span>
                <span>200/h (rapide)</span>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 mt-4">
              <h4 className="text-sm font-medium">Résumé</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>Campagne:</span><span className="font-medium text-foreground">{name}</span>
                <span>Sujet:</span><span className="font-medium text-foreground truncate">{subject}</span>
                <span>Destinataires:</span><span className="font-medium text-foreground">{selectedIds.size}</span>
                <span>Cadence:</span><span className="font-medium text-foreground">{emailsPerHour}/h</span>
                <span>Durée estimée:</span>
                <span className="font-medium text-foreground">
                  {Math.ceil((selectedIds.size / emailsPerHour) * 60)} min
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase font-mono tracking-widest rounded-sm border border-border/50 hover:bg-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Précédent
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase font-mono tracking-widest rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !canAdvance()}
            className="inline-flex items-center gap-2 px-8 py-2.5 text-[10px] uppercase font-mono tracking-widest rounded-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Lancer Séquence
          </button>
        )}
      </div>
    </div>
  );
}

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <p>Bonjour {{firstName}},</p>

  <p>{{aiPersonalization}}</p>

  <p>J'aimerais vous proposer une consultation gratuite pour discuter de la présence en ligne de <strong>{{businessName}}</strong>.</p>

  <p>Seriez-vous disponible pour un court appel de 15 minutes cette semaine ?</p>

  <p>
    Cordialement,<br>
    <em>Votre nom</em>
  </p>
</body>
</html>`;

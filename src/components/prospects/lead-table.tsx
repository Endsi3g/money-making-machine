"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lead } from "@prisma/client";
import { LeadStatusBadge } from "./lead-status-badge";
import { LeadScoreIndicator } from "./lead-score-indicator";
import { LEAD_SOURCE_LABELS } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPhone } from "@/lib/utils";
import {
  MoreHorizontal,
  Mail,
  Phone,
  Globe,
  Trash2,
  Eye,
  Sparkles,
  Archive,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface LeadTableProps {
  leads: Lead[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onEnrich: (id: string) => void;
}

export function LeadTable({ leads, selectedIds, onSelectChange, onDelete, onEnrich }: LeadTableProps) {
  const router = useRouter();

  function toggleSelect(id: string) {
    onSelectChange(
      selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]
    );
  }

  function toggleAll() {
    onSelectChange(selectedIds.length === leads.length ? [] : leads.map((l) => l.id));
  }

  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-gray-50/50">
            <th className="w-10 px-6 py-4">
              <input
                type="checkbox"
                aria-label="Sélectionner tous les leads"
                checked={selectedIds.length === leads.length && leads.length > 0}
                onChange={toggleAll}
                className="rounded-sm border-input w-3.5 h-3.5 bg-transparent"
              />
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-1/4">Entreprise</th>
            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ville</th>
            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
            <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-16">Score</th>
            <th className="w-10 px-6 py-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="hover:bg-black/5 transition-colors cursor-pointer group"
              onClick={() => router.push(`/prospects/${lead.id}`)}
            >
              <td
                className="px-6 py-5"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(lead.id);
                }}
              >
                <input
                  type="checkbox"
                  aria-label={`Sélectionner ${lead.businessName}`}
                  checked={selectedIds.includes(lead.id)}
                  onChange={() => toggleSelect(lead.id)}
                  className="rounded-sm border-input w-3.5 h-3.5 bg-transparent"
                />
              </td>
              <td className="px-6 py-5">
                <div className="text-sm font-semibold tracking-tight text-[#242424]">{lead.businessName}</div>
                {lead.category && (
                  <div className="text-xs font-medium text-muted-foreground mt-1 truncate">{lead.category}</div>
                )}
              </td>
              <td className="px-6 py-5 min-w-[200px]">
                <div className="flex flex-col gap-1.5 justify-center">
                  {lead.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors max-w-[200px]" title={lead.email}>
                      <Mail className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors max-w-[200px]">
                      <Phone className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      <span className="truncate">{formatPhone(lead.phone)}</span>
                    </div>
                  )}
                  {lead.website && !lead.email && !lead.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors max-w-[200px]">
                      <Globe className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      <span className="truncate">{lead.website}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-5 text-sm font-medium text-muted-foreground">
                {lead.city || "—"}
              </td>
              <td className="px-6 py-5">
                <Badge variant="outline" className="bg-transparent shadow-none border-border px-2.5">
                  {LEAD_SOURCE_LABELS[lead.source]}
                </Badge>
              </td>
              <td className="px-6 py-5">
                <LeadStatusBadge status={lead.status} />
              </td>
              <td className="px-6 py-5 text-right">
                <LeadScoreIndicator score={lead.score} />
              </td>
              <td
                className="px-6 py-5 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm hover:bg-secondary/80"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-none border-border">
                    <DropdownMenuItem onClick={() => router.push(`/prospects/${lead.id}`)} className="text-xs uppercase tracking-widest">
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      Ouvrir Fiche
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onEnrich(lead.id)}
                      disabled={lead.status === "ENRICHI"}
                      className="text-xs uppercase tracking-widest focus:text-primary focus:bg-primary/10"
                    >
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                      Enrichir avec IA
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem
                      onClick={() => onDelete(lead.id)}
                      className="text-xs uppercase tracking-widest text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Supprimer lead
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

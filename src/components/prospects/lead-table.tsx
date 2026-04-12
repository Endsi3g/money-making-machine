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
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.length === leads.length && leads.length > 0}
                  onChange={toggleAll}
                  className="rounded border-input"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entreprise</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ville</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Créé</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={() => router.push(`/prospects/${lead.id}`)}
              >
                <td
                  className="px-4 py-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(lead.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                    className="rounded border-input"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium truncate max-w-[200px]">{lead.businessName}</div>
                  {lead.category && (
                    <div className="text-xs text-muted-foreground truncate">{lead.category}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    {lead.email && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[160px]">{lead.email}</span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{formatPhone(lead.phone)}</span>
                      </div>
                    )}
                    {lead.website && !lead.email && !lead.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Globe className="w-3 h-3" />
                        <span className="truncate max-w-[140px]">{lead.website}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{lead.city || "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs font-normal">
                    {LEAD_SOURCE_LABELS[lead.source]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3">
                  <LeadScoreIndicator score={lead.score} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(lead.createdAt)}
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/prospects/${lead.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir les détails
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEnrich(lead.id)}
                        disabled={lead.status === "ENRICHI"}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Enrichir avec IA
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(lead.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

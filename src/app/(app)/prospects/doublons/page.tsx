"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  ArrowRight, 
  Merge, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { Lead } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface DuplicateGroup {
  name: string;
  city: string;
  count: number;
  leads: Lead[];
}

export default function DuplicatesPage() {
  const { data: groups, isLoading } = useSWR<DuplicateGroup[]>("/api/prospects/doublons", fetcher);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (name: string) => {
    const next = new Set(expandedGroups);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpandedGroups(next);
  };

  const handleMerge = async (keepId: string, allIds: string[], groupName: string) => {
    const mergeIds = allIds.filter(id => id !== keepId);
    if (mergeIds.length === 0) return;

    setMergingId(keepId);
    try {
      const res = await fetch("/api/prospects/doublons/merge", {
        method: "POST",
        body: JSON.stringify({ keepId, mergeIds }),
      });

      if (!res.ok) throw new Error();

      toast.success("Fusion réussie");
      mutate("/api/prospects/doublons");
      const next = new Set(expandedGroups);
      next.delete(groupName);
      setExpandedGroups(next);
    } catch (error) {
      toast.error("Échec de la fusion");
    } finally {
      setMergingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const totalDoublons = groups?.reduce((acc, g) => acc + g.count - 1, 0) || 0;

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Nettoyage des doublons</h1>
        <p className="text-zinc-500">
          Nous avons détecté {groups?.length || 0} groupes de prospects potentiellement identiques.
          Fusionnez-les pour garder une base de données propre.
        </p>
      </div>

      {totalDoublons > 0 && (
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-400">Attention</p>
            <p className="text-amber-200/70">
              La fusion est irréversible. Le prospect "Maître" sera mis à jour avec les informations manquantes des autres, puis les doublons seront supprimés.
            </p>
          </div>
        </div>
      )}

      {groups?.length === 0 ? (
        <Card className="border-dashed border-zinc-800 bg-zinc-950/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-zinc-100">Aucun doublon trouvé</h3>
              <p className="text-sm text-zinc-500">Votre base de données est parfaitement propre !</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups?.map((group) => {
            const isExpanded = expandedGroups.has(group.name);
            return (
              <Card key={group.name} className="border-zinc-800 bg-zinc-950/50 overflow-hidden">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors"
                  onClick={() => toggleGroup(group.name)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                      <Users className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-100 uppercase text-xs tracking-wider">{group.name}</h3>
                      <p className="text-xs text-zinc-500">{group.city?.toUpperCase() || "VILLE NON SPÉCIFIÉE"} • {group.count} exemplaires</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                </div>

                {isExpanded && (
                  <CardContent className="border-t border-zinc-900 bg-zinc-950 px-0 pb-0 shadow-inner">
                    <div className="p-4 bg-zinc-900/30 text-[10px] text-zinc-500 flex items-center gap-2 mb-2">
                      <Info className="w-3 h-3" />
                      Choisissez le prospect "Maître" (celui qui sera conservé).
                    </div>
                    <div className="divide-y divide-zinc-900">
                      {group.leads.map((lead) => (
                        <div key={lead.id} className="p-4 flex items-center justify-between group hover:bg-zinc-900/20">
                          <div className="space-y-1 pr-4 max-w-[70%]">
                            <p className="text-sm font-medium text-zinc-200">{lead.businessName}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                              {lead.email && <span>📧 {lead.email}</span>}
                              {lead.phone && <span>📞 {lead.phone}</span>}
                              {lead.website && <span className="truncate max-w-[200px]">🌐 {lead.website}</span>}
                              {lead.status && <Badge variant="outline" className="text-[9px] h-4">{lead.status}</Badge>}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="text-xs h-8 bg-zinc-800 hover:bg-zinc-200 hover:text-zinc-950 transition-all font-bold"
                            disabled={!!mergingId}
                            onClick={() => handleMerge(lead.id, group.leads.map(l => l.id), group.name)}
                          >
                            {mergingId === lead.id ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-2" />
                            ) : (
                              <Merge className="w-3 h-3 mr-2" />
                            )}
                            GARDER
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

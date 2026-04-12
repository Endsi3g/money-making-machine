"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, Bookmark, Save, Trash2, Loader2 } from "lucide-react";
import { LeadStatus, LeadSource, SavedFilter } from "@prisma/client";
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from "@/types/lead";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function LeadFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const source = searchParams.get("source") || "all";

  const { data: savedFilters, isLoading } = useSWR<SavedFilter[]>("/api/filtres", fetcher);
  const [newFilterName, setNewFilterName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("cursor");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const applySavedFilter = (filter: SavedFilter) => {
    const params = new URLSearchParams();
    const f = filter.filters as any;
    if (f.search) params.set("search", f.search);
    if (f.status) params.set("status", f.status);
    if (f.source) params.set("source", f.source);
    router.push(`${pathname}?${params.toString()}`);
    toast.success(`Filtre "${filter.name}" appliqué`);
  };

  const handleSaveFilter = async () => {
    if (!newFilterName.trim()) {
      toast.error("Veuillez donner un nom au filtre");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/filtres", {
        method: "POST",
        body: JSON.stringify({
          name: newFilterName,
          filters: { search, status, source },
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Filtre sauvegardé");
      setNewFilterName("");
      mutate("/api/filtres");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFilter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/filtres/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Filtre supprimé");
      mutate("/api/filtres");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const hasFilters = search || (status !== "all" && status) || (source !== "all" && source);

  function clearFilters() {
    router.push(pathname);
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        <Input
          placeholder="Rechercher..."
          className="pl-9 h-9"
          value={search}
          onChange={(e) => setParam("search", e.target.value)}
        />
      </div>

      <Select value={status} onValueChange={(v) => setParam("status", v === "all" ? "" : v)}>
        <SelectTrigger className="h-9 w-[160px] border-border bg-transparent hover:bg-accent/50 transition-colors">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent className="border-border">
          <SelectItem value="all">Tous les statuts</SelectItem>
          {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={source} onValueChange={(v) => setParam("source", v === "all" ? "" : v)}>
        <SelectTrigger className="h-9 w-[160px] border-border bg-transparent hover:bg-accent/50 transition-colors">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent className="border-border">
          <SelectItem value="all">Toutes les sources</SelectItem>
          {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="w-3.5 h-3.5 mr-1.5" />
            Effacer
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                Sauvegarder
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 border-border shadow-subtle" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-[0.14em] font-medium text-muted-foreground">
                    Nom du filtre
                  </h4>
                  <Input 
                    placeholder="ex: Prospects Chauds" 
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                  />
                </div>
                <Button 
                  size="sm" 
                  className="w-full" 
                  disabled={isSaving}
                  onClick={handleSaveFilter}
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sauvegarder la vue"}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground hover:text-foreground">
            <Bookmark className="w-3.5 h-3.5 mr-1.5" />
            Vues ({savedFilters?.length || 0})
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 border-border shadow-subtle" align="end">
          <div className="space-y-1">
            {isLoading ? (
              <div className="p-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground/50" /></div>
            ) : savedFilters?.length === 0 ? (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 text-center p-4">Aucune vue</p>
            ) : (
              savedFilters?.map(filter => (
                <div 
                  key={filter.id}
                  className="group flex items-center justify-between p-2 hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => applySavedFilter(filter)}
                >
                  <span className="text-xs font-medium text-foreground">{filter.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => deleteFilter(filter.id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Lead } from "@prisma/client";
import { LeadTable } from "@/components/prospects/lead-table";
import { BulkActionsBar } from "@/components/prospects/bulk-actions-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LeadsClientProps {
  initialLeads: Lead[];
  total: number;
}

export function LeadsClient({ initialLeads, total }: LeadsClientProps) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce prospect?")) return;

    const res = await fetch(`/api/prospects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success("Prospect supprimé");
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  async function handleEnrich(id: string) {
    const promise = fetch(`/api/prospects/${id}/enrich`, { method: "POST" });
    toast.promise(promise, {
      loading: "Enrichissement en cours...",
      success: "Prospect enrichi avec succès!",
      error: "Erreur lors de l'enrichissement",
    });
    const res = await promise;
    if (res.ok) {
      router.refresh();
    }
  }

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun prospect trouvé"
        description="Commencez par scraper des données ou ajoutez un prospect manuellement."
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/scraping/nouveau">Lancer un scraping</Link>
            </Button>
            <Button asChild>
              <Link href="/prospects/nouveau">Ajouter manuellement</Link>
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <BulkActionsBar
          count={selectedIds.length}
          onClear={() => setSelectedIds([])}
          onRefresh={() => router.refresh()}
        />
      )}
      <LeadTable
        leads={leads}
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        onDelete={handleDelete}
        onEnrich={handleEnrich}
      />
    </div>
  );
}

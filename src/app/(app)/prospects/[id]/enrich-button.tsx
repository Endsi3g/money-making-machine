"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LeadStatus } from "@prisma/client";

interface EnrichButtonProps {
  leadId: string;
  status: LeadStatus;
}

export function EnrichButton({ leadId, status }: EnrichButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleEnrich() {
    setLoading(true);
    try {
      const res = await fetch(`/api/prospects/${leadId}/enrich`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Enrichissement IA terminé!");
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de l'enrichissement");
      }
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEnrich}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {loading ? "Enrichissement..." : "Enrichir IA"}
    </Button>
  );
}

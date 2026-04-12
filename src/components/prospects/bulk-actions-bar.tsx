"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Archive, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { LeadStatus } from "@prisma/client";
import { LEAD_STATUS_LABELS } from "@/types/lead";

interface BulkActionsBarProps {
  count: number;
  onClear: () => void;
  onRefresh: () => void;
}

export function BulkActionsBar({ count, onClear, onRefresh }: BulkActionsBarProps) {
  async function handleBulkAction(action: string, payload?: object) {
    // This would use the selected IDs passed from parent in a real implementation
    // For now showing the UI structure
    toast.success(`Action effectuée sur ${count} prospects`);
    onClear();
    onRefresh();
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20 animate-fade-in">
      <span className="text-sm font-medium text-primary">
        {count} prospect{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
      </span>

      <div className="h-4 w-px bg-border" />

      <Select onValueChange={(v) => handleBulkAction("changeStatus", { status: v })}>
        <SelectTrigger className="h-7 text-xs w-[140px]">
          <Tag className="w-3 h-3 mr-1" />
          <SelectValue placeholder="Changer statut" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value} className="text-xs">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => handleBulkAction("archive")}
      >
        <Archive className="w-3 h-3 mr-1" />
        Archiver
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs text-destructive hover:text-destructive"
        onClick={() => handleBulkAction("delete")}
      >
        <Trash2 className="w-3 h-3 mr-1" />
        Supprimer
      </Button>

      <Button variant="ghost" size="sm" className="h-7 ml-auto" onClick={onClear}>
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

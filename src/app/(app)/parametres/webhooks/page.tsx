"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Webhook, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Copy, 
  Eye, 
  EyeOff,
  Activity,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const WEBHOOK_EVENTS = [
  { id: "LEAD_CREATED", label: "Prospect créé" },
  { id: "LEAD_UPDATED", label: "Prospect mis à jour" },
  { id: "LEAD_ENRICHED", label: "Enrichissement terminé" },
  { id: "CAMPAIGN_SENT", label: "Campagne envoyée" },
  { id: "EMAIL_OPENED", label: "Email ouvert" },
  { id: "EMAIL_CLICKED", label: "Lien cliqué" },
];

export default function WebhooksPage() {
  const { data: webhooks, isLoading } = useSWR("/api/webhooks", fetcher);
  const [isAdding, setIsAdding] = useState(false);
  const [showSecretId, setShowSecretId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name || !url || selectedEvents.length === 0) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        body: JSON.stringify({ name, url, events: selectedEvents }),
      });

      if (!res.ok) throw new Error();

      toast.success("Webhook créé");
      setIsAdding(false);
      setName("");
      setUrl("");
      setSelectedEvents([]);
      mutate("/api/webhooks");
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !currentStatus }),
      });
      mutate("/api/webhooks");
      toast.success(currentStatus ? "Webhook désactivé" : "Webhook activé");
    } catch (error) {
      toast.error("Erreur de mise à jour");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce webhook ?")) return;
    try {
      await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      mutate("/api/webhooks");
      toast.success("Webhook supprimé");
    } catch (error) {
      toast.error("Erreur de suppression");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papier");
  };

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-zinc-500">Connectez vos données à Zapier, Make ou vos propres services.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un webhook</DialogTitle>
              <DialogDescription className="text-zinc-500">
                L'URL doit pouvoir recevoir des requêtes POST JSON.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom</label>
                <Input 
                  placeholder="ex: Zapier Lead Hunter" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Endpoint URL</label>
                <Input 
                  placeholder="https://hooks.zapier.com/..." 
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">Événements déclencheurs</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {WEBHOOK_EVENTS.map(event => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={event.id} 
                        checked={selectedEvents.includes(event.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedEvents([...selectedEvents, event.id]);
                          else setSelectedEvents(selectedEvents.filter(e => e !== event.id));
                        }}
                      />
                      <label htmlFor={event.id} className="text-xs font-medium cursor-pointer">
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer le webhook"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
        ) : webhooks?.length === 0 ? (
          <Card className="border-dashed border-zinc-800 bg-zinc-950/20 py-12">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <Webhook className="w-12 h-12 text-zinc-800" />
              <div className="space-y-1">
                <h3 className="text-zinc-300 font-medium">Aucun webhook configuré</h3>
                <p className="text-zinc-500 text-sm max-w-xs">
                  Commencez à synchroniser vos données avec vos outils externes.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          webhooks?.map((webhook: any) => (
            <Card key={webhook.id} className="border-zinc-800 bg-zinc-950/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${webhook.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-900 text-zinc-500'}`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-zinc-100 text-sm">{webhook.name}</CardTitle>
                    <CardDescription className="text-zinc-500 text-[10px] uppercase tracking-tighter truncate max-w-[300px]">
                      {webhook.url}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-zinc-500">{webhook.active ? 'Actif' : 'Inactif'}</span>
                    <Switch 
                      checked={webhook.active} 
                      onCheckedChange={() => toggleStatus(webhook.id, webhook.active)}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400" onClick={() => handleDelete(webhook.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-4">
                  <div className="flex flex-wrap gap-1.5">
                    {webhook.events.map((e: string) => (
                      <Badge key={e} variant="secondary" className="bg-zinc-900 text-zinc-400 border-zinc-800 text-[9px] px-1.5 py-0">
                        {WEBHOOK_EVENTS.find(event => event.id === e)?.label || e}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-900 pt-4 mt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Secret HMAC</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded flex-1 truncate">
                          {showSecretId === webhook.id ? webhook.secret : "••••••••••••••••••••••••••••••••"}
                        </code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSecretId(showSecretId === webhook.id ? null : webhook.id)}>
                          {showSecretId === webhook.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(webhook.secret)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Dernière activité</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-300">
                        <Activity className="w-3 h-3 text-zinc-500" />
                        {webhook.lastTriggeredAt ? new Date(webhook.lastTriggeredAt).toLocaleString() : "Jamais déclenché"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Dernier Status</p>
                      <div className="flex items-center gap-2">
                        {webhook.lastStatus ? (
                          <>
                            {webhook.lastStatus >= 200 && webhook.lastStatus < 300 ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-900/30 text-[9px]">
                                {webhook.lastStatus} OK
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/10 text-red-500 border-red-900/30 text-[9px]">
                                {webhook.lastStatus} ERREUR
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-zinc-500">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

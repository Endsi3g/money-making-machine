"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  ShieldCheck, 
  Calendar,
  Loader2,
  AlertCircle,
  Code
} from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ApiKeysPage() {
  const { data: keys, isLoading } = useSWR("/api/keys", fetcher);
  const [isAdding, setIsAdding] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{ name: string; key: string } | null>(null);
  
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name) {
      toast.error("Veuillez donner un nom à la clé");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setNewKeyData({ name: data.name, key: data.key });
      setIsAdding(false);
      setName("");
      mutate("/api/keys");
    } catch (error) {
      toast.error("Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Révoquer cette clé API ? Les applications utilisant cette clé cesseront de fonctionner immédiatement.")) return;
    try {
      await fetch(`/api/keys/${id}`, { method: "DELETE" });
      mutate("/api/keys");
      toast.success("Clé révoquée");
    } catch (error) {
      toast.error("Erreur de suppression");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié");
  };

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Clés API</h1>
          <p className="text-zinc-500">Gérez vos clés pour accéder à l'API système depuis des outils tiers.</p>
        </div>
        
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
              <Plus className="w-4 h-4 mr-2" />
              Créer une clé
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle clé API</DialogTitle>
              <DialogDescription className="text-zinc-500">
                Donnez un nom descriptif à votre clé pour l'identifier plus tard.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom de la clé</label>
                <Input 
                  placeholder="ex: Intégration CRM" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Générer la clé"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerte si une nouvelle clé vient d'être créée */}
      {newKeyData && (
        <Card className="border-amber-900/50 bg-amber-950/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-500 font-bold">
              <AlertCircle className="w-5 h-5" />
              Sauvegardez votre clé API !
            </CardTitle>
            <CardDescription className="text-amber-200/70">
              Pour des raisons de sécurité, nous ne l'afficherons plus jamais. 
              Copiez-la maintenant dans un gestionnaire de mots de passe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 bg-zinc-950 p-3 rounded border border-amber-900/30">
              <code className="text-amber-400 font-mono text-sm flex-1 break-all">
                {newKeyData.key}
              </code>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(newKeyData.key)} className="shrink-0 border-amber-900/30 hover:bg-amber-900/20">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="secondary" className="w-full text-xs h-8" onClick={() => setNewKeyData(null)}>
              J'ai sauvegardé la clé
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
        ) : keys?.length === 0 ? (
          <Card className="border-dashed border-zinc-800 bg-zinc-950/20 py-12">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <Key className="w-12 h-12 text-zinc-800" />
              <div className="space-y-1">
                <h3 className="text-zinc-300 font-medium">Aucune clé active</h3>
                <p className="text-zinc-500 text-sm max-w-xs">
                  Créez votre première clé pour commencer à utiliser l'API.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          keys?.map((apiKey: any) => (
            <Card key={apiKey.id} className="border-zinc-800 bg-zinc-950/50">
              <CardContent className="p-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800">
                      <ShieldCheck className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-100">{apiKey.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <code className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                          {apiKey.keyPrefix}••••••••
                        </code>
                        <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          Créée le {new Date(apiKey.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => handleDelete(apiKey.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-zinc-900/30 px-4 py-2 border-t border-zinc-900 flex items-center justify-between">
                  <div className="flex gap-2">
                    {apiKey.scopes.map((scope: string) => (
                      <span key={scope} className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">
                        {scope}
                      </span>
                    ))}
                  </div>
                  <div className="text-[9px] text-zinc-600">
                    Dernière utilisation: {apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleDateString() : 'Jamais'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="border-zinc-800 bg-black shadow-2xl">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-500" />
            Exemple d'utilisation (cURL)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-zinc-950 p-4 rounded-md text-[11px] font-mono text-zinc-400 overflow-x-auto border border-zinc-900">
            {`curl -X GET "https://votre-app.com/api/v1/leads" \\
  -H "Authorization: Bearer VOTRE_CLE_API" \\
  -H "Content-Type: application/json"`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

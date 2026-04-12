"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Save, 
  Loader2, 
  MessageSquare, 
  ShieldCheck, 
  AlertCircle,
  Smartphone,
  Info
} from "lucide-react";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WorkspaceSettingsPage() {
  const { data: workspace, isLoading } = useSWR("/api/workspace", fetcher);
  const [name, setName] = useState("");
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioFromNumber, setTwilioFromNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name || "");
      setTwilioAccountSid(workspace.twilioAccountSid || "");
      setTwilioAuthToken(workspace.twilioAuthToken || "");
      setTwilioFromNumber(workspace.twilioFromNumber || "");
    }
  }, [workspace]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          twilioAccountSid,
          twilioAuthToken,
          twilioFromNumber,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Paramètres mis à jour");
      mutate("/api/workspace");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight uppercase">Configuration de l&apos;Agence</h1>
        <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-mono">Gérez votre identité et vos canaux de communication</p>
      </div>

      <div className="grid gap-8">
        {/* Section Agence */}
        <Card className="border-zinc-800 bg-zinc-950/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                <Building2 className="w-4 h-4 text-zinc-400" />
              </div>
              <CardTitle className="text-lg">Profil de l&apos;Agence</CardTitle>
            </div>
            <CardDescription className="text-zinc-500">Mettez à jour les informations publiques de votre workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium uppercase tracking-tighter text-zinc-400">Nom de l&apos;Aura B2B</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Twilio - Optionnelle */}
        <Card className="border-zinc-800 bg-zinc-950/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-sky-500/10 border border-sky-500/20">
                <Smartphone className="w-4 h-4 text-sky-500" />
              </div>
              <CardTitle className="text-lg">Configuration SMS (Optionnel)</CardTitle>
            </div>
            <CardDescription className="text-zinc-500">Connectez votre compte Twilio pour envoyer des relances par SMS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-zinc-900/40 p-4 rounded-lg border border-zinc-800 flex items-start gap-3">
              <Info className="w-4 h-4 text-zinc-500 mt-0.5" />
              <div className="text-[11px] text-zinc-500 leading-relaxed">
                L&apos;intégration SMS est facultative. Elle permet d&apos;envoyer des mini-messages automatisés au moment de la prospection si un numéro de téléphone valide est détecté.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Twilio Account SID</label>
                <Input 
                  value={twilioAccountSid} 
                  onChange={e => setTwilioAccountSid(e.target.value)}
                  placeholder="AC..."
                  className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Twilio Auth Token</label>
                <Input 
                  type="password"
                  value={twilioAuthToken} 
                  onChange={e => setTwilioAuthToken(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Numéro Twilio (From Number)</label>
                <Input 
                  value={twilioFromNumber} 
                  onChange={e => setTwilioFromNumber(e.target.value)}
                  placeholder="+1438..."
                  className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting}
            className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 px-8 py-6 h-auto text-xs uppercase tracking-widest font-bold"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  );
}

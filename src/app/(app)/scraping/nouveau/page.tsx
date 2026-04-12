"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SCRAPING_SOURCE_LABELS, QUEBEC_CITIES } from "@/types/scraping";

export default function NouveauScrapingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    source: "PAGES_JAUNES",
    keywords: "",
    location: "Montréal",
    maxResults: 100,
  });

  function setField(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.keywords.trim()) {
      toast.error("Les mots-clés sont requis");
      return;
    }

    if (!form.location.trim()) {
      toast.error("La localisation est requise");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/scraping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors du lancement du scraping");
        return;
      }

      toast.success("Scraping lancé! Vous pouvez suivre la progression.");
      router.push("/scraping");
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/scraping">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouveau scraping</h1>
          <p className="text-muted-foreground text-sm">Lancez une nouvelle tâche de collecte de leads</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Paramètres de scraping
            </CardTitle>
            <CardDescription>
              Choisissez la source et définissez vos critères de recherche
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={form.source} onValueChange={(v) => setField("source", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SCRAPING_SOURCE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">
                Mots-clés <span className="text-destructive">*</span>
              </Label>
              <Input
                id="keywords"
                placeholder="ex: Restaurant, Plombier, Coiffeur..."
                value={form.keywords}
                onChange={(e) => setField("keywords", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Les mots-clés de recherche pour trouver les prospects
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Localisation <span className="text-destructive">*</span>
              </Label>
              <Select value={form.location} onValueChange={(v) => setField("location", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUEBEC_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxResults">Nombre maximum de résultats</Label>
              <Input
                id="maxResults"
                type="number"
                min="10"
                max="500"
                value={form.maxResults}
                onChange={(e) => setField("maxResults", parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Entre 10 et 500 résultats (plus élevé = plus long)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-300">
          <p className="font-medium mb-1">💡 Conseil</p>
          <p>
            Le scraping est une opération en arrière-plan. Vous pouvez fermer cette page et revenir plus tard pour voir les résultats.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/scraping">Annuler</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Lancer le scraping
          </Button>
        </div>
      </form>
    </div>
  );
}

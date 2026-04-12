"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ImportProspectsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    imported: number;
    duplicates: number;
    errors: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast.error("Veuillez sélectionner un fichier CSV");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/prospects/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur lors de l'import");

      const data = await res.json();
      setResult(data.stats);
      toast.success("Importation terminée");
    } catch (error) {
      console.error(error);
      toast.error("Échec de l'importation. Vérifiez le format de votre fichier.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/prospects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Importer des prospects</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Glisser-déposer votre CSV</CardTitle>
          <CardDescription>
            Importez massivement vos prospects depuis un fichier CSV. 
            Le système détectera automatiquement les colonnes (Nom, Email, téléphone, ville, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className={`
              relative group cursor-pointer
              border-2 border-dashed rounded-xl p-12
              flex flex-col items-center justify-center gap-4
              transition-all duration-200
              ${file ? "border-[#242424]/30 bg-black/5" : "border-border hover:border-[#242424]/30 hover:bg-black/[0.02]"}
            `}
            onClick={() => document.getElementById("csv-upload")?.click()}
          >
            <input 
              id="csv-upload"
              type="file" 
              accept=".csv"
              className="hidden"
              aria-label="Sélectionner un fichier CSV"
              title="Sélectionner un fichier CSV"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-full bg-[#242424]/10 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-[#242424]" />
                </div>
                <span className="text-[#242424] font-semibold">{file.name}</span>
                <span className="text-muted-foreground text-sm">{(file.size / 1024).toFixed(2)} KB</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground group-hover:text-[#242424] transition-colors" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Cliquez pour parcourir ou glissez un fichier ici</p>
                <p className="text-xs text-muted-foreground/50">Fichiers CSV uniquement</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground/60 italic">
              Colonnes attendues (approximatives) : Nom, Ville, Email, Téléphone, Site Web...
            </div>
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importation...
                </>
              ) : "Lancer l'import"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              Résultat de l&apos;importation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total analysé</p>
                <p className="text-3xl font-bold text-[#242424]">{result.total}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Importés</p>
                <p className="text-3xl font-bold text-emerald-600">{result.imported}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Doublons ignorés</p>
                <p className="text-3xl font-bold text-amber-500">{result.duplicates}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Erreurs</p>
                <p className="text-3xl font-bold text-destructive">{result.errors}</p>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/prospects">
                <Button variant="outline" className="w-full">Voir les prospects</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

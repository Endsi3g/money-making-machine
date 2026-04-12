import { Loader2 } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
          Chargement...
        </p>
      </div>
    </div>
  );
}

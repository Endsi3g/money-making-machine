import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Wrap in try/catch: a stale JWT cookie causes JWEDecryptionFailed which
  // would crash the layout before reaching the redirect, creating an infinite
  // loading loop. Treating decryption failures as "no session" breaks the loop.
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }

  if (session) {
    redirect("/tableau-de-bord");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_480px] bg-background">

      {/* ── Left panel — Luxury brand statement ── */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-card relative overflow-hidden border-r border-border">

        {/* Decorative grid overlay */}
        <div className="absolute inset-0 opacity-[0.025] auth-grid-bg" />

        {/* Minimal gradient orb */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] opacity-[0.03] auth-orb-bg" />

        {/* Corner accent lines */}
        <span className="absolute top-8 left-8 w-12 h-12 border-t border-l border-border" />
        <span className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-border" />

        {/* Logo */}
        <div className="relative flex items-center gap-4 z-10">
          <div className="relative w-10 h-10 flex items-center justify-center bg-white shadow-cal-1 rounded-md">
            <Zap className="w-5 h-5 text-[#242424]" strokeWidth={2} />
          </div>
          <div>
            <div
              className="text-sm font-bold tracking-tight text-[#242424] leading-none"
            >
              Aura B2B
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">
              Prospection
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1
              className="text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-[#242424]"
            >
              Trouvez vos<br />
              prochains clients<br />
              en automatique.
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed mt-6 max-w-sm">
              Scrapage, enrichissement IA, emails ultra-personnalisés.
              Un seul cockpit pour toute la prospection B2B.
            </p>
          </div>

          {/* Feature list — minimal */}
          <div className="space-y-3">
            {[
              { code: "01", label: "Extraction multi-sources automatisée" },
              { code: "02", label: "Enrichissement Ollama local" },
              { code: "03", label: "Campagnes email via Gmail" },
              { code: "04", label: "Collaboration d'équipe" },
            ].map((f) => (
              <div key={f.code} className="flex items-center gap-4">
                <span
                  className="text-[10px] font-mono text-primary/60 tabular-nums"
                >
                  {f.code}
                </span>
                <div className="h-px flex-1 bg-border" />
                <span className="text-[11px] text-muted-foreground tracking-tight">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex items-center gap-8">
          {[
            { value: "100%", label: "Local-first" },
            { value: "3+",   label: "Sources leads" },
            { value: "IA",   label: "Personnalisation" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-xl font-semibold text-[#242424] tracking-tight">
                {s.value}
              </div>
              <div className="text-[9px] text-muted-foreground/50 uppercase tracking-[0.16em] mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — Form ── */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-8 h-8 flex items-center justify-center bg-white shadow-cal-1 rounded-md">
              <Zap className="w-4 h-4 text-[#242424]" />
            </div>
            <span
              className="text-sm font-bold tracking-tight text-[#242424] uppercase"
            >
              Aura B2B
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

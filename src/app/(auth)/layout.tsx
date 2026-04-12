import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/tableau-de-bord");
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-950 text-white relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Money Making Machine</span>
        </div>

        {/* Feature highlights */}
        <div className="relative space-y-8">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white mb-4">
              Trouvez vos prochains clients en pilote automatique
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Scrapage automatisé, enrichissement IA, emails ultra-personnalisés. Un écosystème complet pour développer votre agence.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: "🎯", text: "Scrapage Pages Jaunes, Yelp et Google Maps" },
              { icon: "🤖", text: "Enrichissement IA avec Claude" },
              { icon: "📧", text: "Campagnes email personnalisées via Gmail" },
              { icon: "👥", text: "Collaboration en équipe" },
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-3">
                <span className="text-xl">{feature.icon}</span>
                <span className="text-slate-300 text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-6">
          {[
            { value: "100%", label: "Gratuit" },
            { value: "3", label: "Sources de leads" },
            { value: "IA", label: "Personnalisation" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-bold text-lg">Money Making Machine</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

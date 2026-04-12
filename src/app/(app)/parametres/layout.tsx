"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  User, 
  Building2, 
  Webhook, 
  Key, 
  Mail, 
  Activity,
  ShieldLock
} from "lucide-react";

const sidebarNavItems = [
  {
    title: "Profil Personnel",
    href: "/parametres/profil",
    icon: User,
  },
  {
    title: "Agence & Workspace",
    href: "/parametres/agence",
    icon: Building2,
  },
  {
    title: "Gmail & Email",
    href: "/parametres/gmail",
    icon: Mail,
  },
  {
    title: "Webhooks",
    href: "/parametres/webhooks",
    icon: Webhook,
  },
  {
    title: "Clés API",
    href: "/parametres/api",
    icon: Key,
  },
  {
    title: "Journal d'activité",
    href: "/parametres/activite",
    icon: Activity,
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 py-4">
      <aside className="lg:w-1/5">
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:bg-zinc-900",
                pathname === item.href
                  ? "bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <item.icon className={cn("h-4 w-4", pathname === item.href ? "text-emerald-500" : "")} />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 lg:max-w-4xl">{children}</div>
    </div>
  );
}

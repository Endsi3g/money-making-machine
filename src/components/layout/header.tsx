"use client";

import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Moon, Sun, LogOut, Settings, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

const PAGE_TITLES: Record<string, { title: string; sub?: string }> = {
  "/tableau-de-bord": { title: "Cockpit",    sub: "Vue d'ensemble" },
  "/prospects":       { title: "Prospects",  sub: "Base de leads"  },
  "/scraping":        { title: "Scraping",   sub: "Extraction web" },
  "/campagnes":       { title: "Campagnes",  sub: "Email outreach"  },
  "/equipe":          { title: "Équipe",     sub: "Membres"         },
  "/parametres":      { title: "Paramètres", sub: "Configuration"   },
};

function getPageMeta(pathname: string) {
  for (const [path, meta] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      return meta;
    }
  }
  return { title: "Aura B2B", sub: undefined };
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      id="theme-toggle"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-muted-foreground hover:text-foreground"
    >
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Changer le thème</span>
    </Button>
  );
}

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { title, sub } = getPageMeta(pathname);

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header
      className="h-14 border-b border-border bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-30"
      id="app-header"
    >
      {/* Page title */}
      <div className="flex-1 flex items-baseline gap-3">
        <h1
          className="text-sm font-semibold tracking-tight text-foreground leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        {sub && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 font-medium hidden sm:block">
            {sub}
          </span>
        )}
      </div>

      {/* Status dot — live indicator */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 border border-border text-[10px] text-muted-foreground uppercase tracking-[0.12em]">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-soft-pulse" />
        Système actif
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              id="user-menu-trigger"
              className="h-8 gap-2 px-2 text-muted-foreground hover:text-foreground"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={session?.user?.image ?? undefined} />
                <AvatarFallback
                  className="text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25"
                  style={{ borderRadius: 0 }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium hidden sm:block max-w-[120px] truncate tracking-[-0.01em]">
                {session?.user?.name?.split(" ")[0] || session?.user?.email}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="py-2">
              <div className="text-xs font-semibold text-foreground tracking-tight">
                {session?.user?.name}
              </div>
              <div className="text-[10px] text-muted-foreground font-normal mt-0.5 font-mono">
                {session?.user?.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild id="nav-to-settings">
              <Link href="/parametres" className="gap-2 text-xs">
                <Settings className="h-3.5 w-3.5" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              id="sign-out-button"
              onClick={() => signOut({ callbackUrl: "/connexion" })}
              className="text-destructive focus:text-destructive gap-2 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

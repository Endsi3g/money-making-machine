"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Search,
  Mail,
  Settings,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Cockpit",    href: "/tableau-de-bord", icon: LayoutDashboard },
  { label: "Prospects",  href: "/prospects",        icon: Users            },
  { label: "Scraping",   href: "/scraping",         icon: Search           },
  { label: "Campagnes",  href: "/campagnes",        icon: Mail             },
];

const bottomNavItems = [
  { label: "Équipe",      href: "/equipe",     icon: Users    },
  { label: "Paramètres",  href: "/parametres", icon: Settings },
];

const sidebarVariants = {
  expanded: { width: 220 },
  collapsed: { width: 56 },
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col h-screen border-r border-border bg-card overflow-hidden shrink-0"
      style={{ minWidth: collapsed ? 56 : 220 }}
    >
      {/* ── Logo row ── */}
      <div
        className={cn(
          "flex items-center h-14 border-b border-border shrink-0",
          collapsed ? "justify-center px-0" : "px-5 gap-3"
        )}
      >
        <Link
          href="/tableau-de-bord"
          className="flex items-center gap-3 min-w-0 group"
          id="sidebar-logo"
        >
          {/* Precision mark */}
          <div className="relative w-7 h-7 shrink-0 flex items-center justify-center bg-primary/10 border border-primary/30 group-hover:bg-primary/20 transition-colors duration-150">
            <Zap className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
            {/* Animated corner accent */}
            <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-primary/60" />
            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary/60" />
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="min-w-0 overflow-hidden"
              >
                <div
                  className="text-[11px] font-semibold tracking-[0.18em] uppercase leading-none text-foreground"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Aura B2B
                </div>
                <div className="text-[9px] text-muted-foreground/60 mt-1 uppercase tracking-[0.22em] leading-none">
                  Prospection
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto scrollbar-hide px-2">
        {navItems.map((item, i) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              <Link
                href={item.href}
                id={`nav-${item.label.toLowerCase()}`}
                className={cn(
                  "relative flex items-center gap-3 h-9 px-3 text-[13px] font-medium transition-all duration-150 group",
                  "hover:bg-accent",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active indicator line */}
                {isActive && (
                  <motion.span
                    layoutId="active-nav"
                    className="absolute left-0 top-0 h-full w-[2px] bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
                  )}
                  strokeWidth={isActive ? 2 : 1.5}
                />

                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="truncate tracking-[-0.01em]"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* ── Bottom nav ── */}
      <div className="border-t border-border py-3 space-y-0.5 px-2 shrink-0">
        {bottomNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              className={cn(
                "relative flex items-center gap-3 h-9 px-3 text-[13px] font-medium transition-all duration-150 group",
                "hover:bg-accent",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-[2px] bg-primary" />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground/60"
                )}
                strokeWidth={1.5}
              />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="truncate tracking-[-0.01em]"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        id="sidebar-collapse-toggle"
        className="absolute -right-3 top-[68px] w-6 h-6 bg-card border border-border flex items-center justify-center hover:bg-accent hover:border-primary/40 transition-all duration-150 z-10 group"
        title={collapsed ? "Déplier" : "Replier"}
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          className={cn(
            "text-muted-foreground group-hover:text-primary transition-transform duration-200",
            collapsed ? "rotate-0" : "rotate-180"
          )}
        >
          <path
            d="M5 1L2 4L5 7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </motion.aside>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

// ── Display & Body font — clean, highly legible (Cal.com uses Inter + custom CalSans, we use Inter heavily weighted for display) ──
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

// Alias inter to both sans and display explicitly
const fontSans = inter.variable;
const fontDisplay = inter.variable;

// ── Mono font — for all data, scores, code ──
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["300", "400", "500"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0b0d0f" },
    { media: "(prefers-color-scheme: light)", color: "#f8f9fa" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Aura B2B — Prospection Intelligente",
    template: "%s · Aura B2B",
  },
  description:
    "Écosystème de prospection commerciale locale pour le Québec. Trouvez, enrichissez et contactez vos prospects automatiquement.",
  keywords: ["prospection", "leads", "email marketing", "B2B", "Québec", "IA"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className="light"
    >
      <body
        className={`${fontDisplay} ${fontSans} ${jetbrainsMono.variable} font-sans min-h-screen bg-background antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NextTopLoader color="#18181b" height={3} showSpinner={false} />
          {children}
          <Toaster
            richColors
            position="bottom-right"
            toastOptions={{
              style: {
                background: "hsl(0 0% 100%)",
                border: "0px 0px 0px 1px rgba(34, 42, 53, 0.08)",
                boxShadow: "0 1px 5px -4px rgba(19, 19, 22, 0.7), 0 0 0 1px rgba(34, 42, 53, 0.08), 0 4px 8px 0 rgba(34, 42, 53, 0.05)",
                borderRadius: "8px",
                color: "hsl(0 0% 14%)",
                fontSize: "13px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

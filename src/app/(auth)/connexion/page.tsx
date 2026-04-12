"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, Chrome } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ConnexionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Identifiants incorrects");
      } else {
        router.push("/tableau-de-bord");
        router.refresh();
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/tableau-de-bord" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-7"
    >
      {/* Header */}
      <div className="space-y-2 mb-8">
        <h1
          className="text-3xl font-bold tracking-tight text-[#242424]"
        >
          Connexion
        </h1>
        <p className="text-sm text-muted-foreground">
          Accédez à votre cockpit de prospection.
        </p>
      </div>

      {/* Google OAuth */}
      <Button
        variant="outline"
        className="w-full gap-2.5"
        onClick={handleGoogle}
        disabled={googleLoading}
        id="btn-google-signin"
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Chrome className="h-4 w-4" />
        )}
        <span className="text-xs tracking-tight">Continuer avec Google</span>
      </Button>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50 shrink-0">ou</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Email form */}
      <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
        <div className="space-y-1.5">
          <Label
            htmlFor="login-email"
            className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium"
          >
            Adresse email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input
              id="login-email"
              type="email"
              placeholder="vous@exemple.ca"
              className="pl-9 h-10"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="login-password"
            className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium"
          >
            Mot de passe
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              className="pl-9 h-10"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-10 mt-2"
          id="btn-submit-login"
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span className="text-xs tracking-tight">Se connecter</span>
        </Button>
      </form>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span>Pas encore de compte?</span>
        <Link
          href="/inscription"
          className="text-[#242424] hover:underline transition-colors tracking-tight font-semibold"
          id="link-to-register"
        >
          Créer un compte
        </Link>
      </div>
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Crown,
  Loader2,
  Copy,
  Trash2,
  X,
  Check,
  Clock,
  Mail,
  UserPlus,
} from "lucide-react";

interface Member {
  id: string;
  role: string;
  invitedAt: string;
  joinedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

const roleConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  OWNER: { icon: Crown, label: "Propriétaire", color: "text-amber-500" },
  ADMIN: { icon: ShieldCheck, label: "Administrateur", color: "text-blue-500" },
  AGENT: { icon: Shield, label: "Agent", color: "text-muted-foreground" },
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("AGENT");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    try {
      const res = await fetch("/api/equipe");
      const data = await res.json();
      setMembers(data.members);
      setInvites(data.invites);
    } catch {
      console.error("Failed to fetch team");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/equipe/inviter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: data.message });
        setInviteEmail("");
        setShowInviteForm(false);
        fetchTeam();
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau" });
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(id: string) {
    if (!confirm("Retirer ce membre du workspace ?")) return;

    try {
      const res = await fetch(`/api/equipe/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        setMessage({ type: "success", text: "Membre retiré" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau" });
    }
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    try {
      const res = await fetch(`/api/equipe/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchTeam();
        setMessage({ type: "success", text: "Rôle mis à jour" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau" });
    }
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/invitation?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Équipe</h1>
          <p className="text-muted-foreground mt-1">
            {members.length} membre{members.length !== 1 ? "s" : ""} dans le workspace
          </p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Inviter
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {message.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Invite form */}
      {showInviteForm && (
        <div className="rounded-xl border bg-card shadow-sm p-5">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Inviter un nouveau membre
          </h3>
          <form onSubmit={handleInvite} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="membre@exemple.com"
                required
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Rôle</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting || !inviteEmail}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Inviter
            </button>
          </form>
        </div>
      )}

      {/* Members list */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="px-5 py-3 border-b">
          <h3 className="font-semibold text-sm">Membres</h3>
        </div>
        <div className="divide-y">
          {members.map((member) => {
            const rc = roleConfig[member.role] || roleConfig.AGENT;
            const RoleIcon = rc.icon;

            return (
              <div key={member.id} className="flex items-center gap-4 px-5 py-3.5">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {member.user.image ? (
                    <img
                      src={member.user.image}
                      alt={member.user.name || ""}
                      className="w-9 h-9 rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium text-primary">
                      {(member.user.name || member.user.email)[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">
                    {member.user.name || member.user.email}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {member.user.email}
                  </div>
                </div>

                {/* Role badge */}
                <div className={`flex items-center gap-1.5 text-xs font-medium ${rc.color}`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  {rc.label}
                </div>

                {/* Actions */}
                {member.role !== "OWNER" && (
                  <div className="flex items-center gap-1">
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded border bg-background"
                    >
                      <option value="AGENT">Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Retirer du workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="px-5 py-3 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Invitations en attente ({invites.length})
            </h3>
          </div>
          <div className="divide-y">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{invite.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Expire le {new Date(invite.expiresAt).toLocaleDateString("fr-CA")}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {roleConfig[invite.role]?.label || invite.role}
                </span>
                <button
                  onClick={() => copyInviteLink(invite.token)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-accent transition-colors"
                >
                  {copiedToken === invite.token ? (
                    <><Check className="w-3 h-3 text-emerald-500" /> Copié</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copier le lien</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

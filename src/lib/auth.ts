import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Email ou mot de passe incorrect");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Email ou mot de passe incorrect");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;

        // Fetch workspace membership
        const membership = await prisma.workspaceMember.findFirst({
          where: { userId: user.id },
          orderBy: { joinedAt: "asc" },
        });

        if (membership) {
          token.workspaceId = membership.workspaceId;
          token.role = membership.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.workspaceId = token.workspaceId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Handle Google OAuth sign-in: create workspace if none exists
      if (account?.provider === "google" && user.id) {
        const existingMembership = await prisma.workspaceMember.findFirst({
          where: { userId: user.id },
        });

        if (!existingMembership) {
          const workspaceName = user.name ? `${user.name}'s Agence` : "Mon Agence";
          const baseSlug = workspaceName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
          const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

          const workspace = await prisma.workspace.create({
            data: { name: workspaceName, slug },
          });

          await prisma.workspaceMember.create({
            data: {
              workspaceId: workspace.id,
              userId: user.id,
              role: "OWNER",
              joinedAt: new Date(),
            },
          });
        }
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Create default workspace for credentials sign-up
      const workspaceName = user.name ? `${user.name}'s Agence` : "Mon Agence";
      const baseSlug = workspaceName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

      const workspace = await prisma.workspace.create({
        data: { name: workspaceName, slug },
      });

      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: "OWNER",
          joinedAt: new Date(),
        },
      });
    },
  },
};

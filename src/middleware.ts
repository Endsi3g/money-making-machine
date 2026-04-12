import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { hashApiKey } from "./lib/api-keys";
import { prisma } from "./lib/prisma";
import { redis } from "./lib/redis";

const API_KEY_CACHE_TTL = 300; // 5 minutes

// Origins autorisées par défaut (dev)
const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000"];

/**
 * Middleware global pour gérer:
 * 1. CORS (Sécurité cross-origin)
 * 2. Protection des routes (Auth)
 * 3. Rate Limiting foundation
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ─────────────────────────────────────────────────────────
  // 1. CORS HANDLING
  // ─────────────────────────────────────────────────────────
  
  // Toujours autoriser les tracking pixels en lecture publique
  const isTracking = pathname.startsWith("/api/tracking/");
  
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
    : DEFAULT_ALLOWED_ORIGINS;

  const origin = request.headers.get("origin");

  // Si l'origine est autorisée, on ajoute les headers CORS
  if (origin && (allowedOrigins.includes(origin) || isTracking)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Max-Age", "86400"); // 24 heures
  }

  // Gérer la requête de pré-vérification OPTIONS
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { 
      status: 204, 
      headers: response.headers 
    });
  }

  // ─────────────────────────────────────────────────────────
  // 2. API KEY AUTHENTICATION (for /api/v1)
  // ─────────────────────────────────────────────────────────
  
  const authHeader = request.headers.get("authorization");
  let apiKeyWorkspaceId = null;

  if (authHeader?.startsWith("Bearer mmm_pk_")) {
    const key = authHeader.replace("Bearer ", "");
    const keyHash = hashApiKey(key);
    const cacheKey = `apikey:${keyHash}`;

    // Try Redis cache first to avoid a DB hit on every request
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      // "INVALID" is stored for keys that don't exist / are revoked
      if (cached !== "INVALID") {
        apiKeyWorkspaceId = cached;
        response.headers.set("X-Workspace-Id", apiKeyWorkspaceId);
      }
    } else {
      const apiKeyData = await prisma.apiKey.findUnique({
        where: { keyHash },
        select: { workspaceId: true, revokedAt: true, expiresAt: true }
      });

      if (apiKeyData && !apiKeyData.revokedAt && (!apiKeyData.expiresAt || apiKeyData.expiresAt > new Date())) {
        apiKeyWorkspaceId = apiKeyData.workspaceId;
        response.headers.set("X-Workspace-Id", apiKeyWorkspaceId);
        await redis.setex(cacheKey, API_KEY_CACHE_TTL, apiKeyWorkspaceId);
      } else {
        // Cache negative results too to prevent DB hammering with invalid keys
        await redis.setex(cacheKey, API_KEY_CACHE_TTL, "INVALID");
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // 3. ROUTE PROTECTION (AUTH)
  // ─────────────────────────────────────────────────────────
  
  // Routes publiques (Auth, Tracking, etc.)
  const isPublicRoute = 
    pathname.startsWith("/connexion") || 
    pathname.startsWith("/inscription") || 
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/tracking/") ||
    pathname === "/";

  // Autoriser si clé API valide sur /api/v1
  const isV1Api = pathname.startsWith("/api/v1");

  if (!isPublicRoute) {
    // Si c'est l'API V1 et qu'on a une clé valide, c'est OK
    if (isV1Api && apiKeyWorkspaceId) {
      return response;
    }

    const token = await getToken({ req: request });
    
    // Rediriger vers connexion si pas de session
    if (!token) {
      // Pour les requêtes API, retourner 401 au lieu de rediriger
      if (pathname.startsWith("/api/")) {
        return new NextResponse(JSON.stringify({ error: "Non autorisé" }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const url = new URL("/connexion", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

// Configurer les paths sur lesquels le middleware s'applique
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

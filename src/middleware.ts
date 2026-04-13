import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Middleware global — Edge Runtime compatible.
 *
 * IMPORTANT: Ce middleware tourne dans l'Edge Runtime où Prisma et ioredis
 * ne sont PAS supportés. La validation des API keys et le CORS avancé doivent
 * être gérés directement dans les route handlers API.
 *
 * Ce middleware gère uniquement:
 * 1. CORS basique (headers)
 * 2. Protection des routes (JWT token check via next-auth getToken)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Preflight OPTIONS ──────────────────────────────────────
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // ── Public routes — no auth check ──────────────────────────
  const isPublicRoute =
    pathname.startsWith("/connexion") ||
    pathname.startsWith("/inscription") ||
    pathname.startsWith("/invitation") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/tracking/") ||
    pathname.startsWith("/api/v1") ||      // API v1 uses Bearer token, handled in route
    pathname === "/";

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ── Protected routes — check JWT ───────────────────────────
  // getToken is Edge-compatible and handles JWE decryption internally.
  // If the cookie is stale/corrupted, getToken returns null (no crash).
  let token = null;
  try {
    token = await getToken({ req: request });
  } catch {
    // Stale or corrupted JWT cookie — treat as unauthenticated
    token = null;
  }

  if (!token) {
    // API routes → 401 JSON
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Page routes → redirect to /connexion with callbackUrl
    const url = new URL("/connexion", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

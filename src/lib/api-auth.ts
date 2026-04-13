import { NextRequest } from "next/server";
import { hashApiKey } from "./api-keys";
import { prisma } from "./prisma";
import { redis } from "./redis";

const API_KEY_CACHE_TTL = 300; // 5 minutes

/**
 * Valide un Bearer token API key et retourne le workspaceId associé.
 * Utilise Redis pour mettre en cache la résolution hash -> workspaceId.
 */
export async function validateApiKey(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer mmm_pk_")) {
    return null;
  }

  const key = authHeader.replace("Bearer ", "");
  const keyHash = hashApiKey(key);
  const cacheKey = `apikey:${keyHash}`;

  // Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      if (cached !== "INVALID") {
        return cached;
      }
      return null; // Known invalid key
    }
  } catch (err) {
    console.error("Redis fetch failed in API auth, falling back to db:", err);
  }

  // Fallback to database
  const apiKeyData = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { workspaceId: true, revokedAt: true, expiresAt: true }
  });

  if (apiKeyData && !apiKeyData.revokedAt && (!apiKeyData.expiresAt || apiKeyData.expiresAt > new Date())) {
    const workspaceId = apiKeyData.workspaceId;
    try {
      await redis.setex(cacheKey, API_KEY_CACHE_TTL, workspaceId);
    } catch (err) {
      console.error("Redis setex failed in API auth:", err);
    }
    return workspaceId;
  } else {
    try {
      await redis.setex(cacheKey, API_KEY_CACHE_TTL, "INVALID");
    } catch (err) {
      console.error("Redis setex failed in API auth:", err);
    }
    return null;
  }
}

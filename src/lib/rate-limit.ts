import { redis } from "./redis";

interface RateLimitConfig {
  key: string;
  limit: number;
  duration: number; // en secondes
}

/**
 * Implémentation d'un limiteur de débit par fenêtre glissante (sliding window) utilisant Redis.
 * Utile pour protéger l'API contre les abus par workspace ou par IP.
 */
export async function rateLimit({ key, limit, duration }: RateLimitConfig): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const now = Date.now();
  const windowStart = now - duration * 1000;
  const redisKey = `ratelimit:${key}`;

  // Utiliser une transaction Redis (Pipeline) pour garantir l'atomicité
  const multi = redis.multi();

  // Nettoyer les anciennes entrées hors de la fenêtre courante
  multi.zremrangebyscore(redisKey, 0, windowStart);
  
  // Ajouter la requête actuelle
  multi.zadd(redisKey, now, now.toString());
  
  // Compter les requêtes dans la fenêtre
  multi.zcard(redisKey);
  
  // Expirer la clé Redis après la durée définie pour libérer de la mémoire
  multi.expire(redisKey, duration);

  const results = await multi.exec();
  
  if (!results) {
    throw new Error("Redis rate limit execution failed");
  }

  // Le résultat de ZCARD est le nombre de requêtes dans la fenêtre
  const count = results[2][1] as number;
  const success = count <= limit;

  // Calculer le temps restant avant le reset (approximatif)
  // On récupère le score le plus bas (le plus ancien) pour estimer le reset
  const oldest = await redis.zrange(redisKey, 0, 0, "WITHSCORES");
  const firstTimestamp = oldest.length > 0 ? parseInt(oldest[1]) : now;
  const reset = firstTimestamp + duration * 1000;

  return {
    success,
    limit,
    remaining: Math.max(0, limit - count),
    reset,
  };
}

/**
 * Helper pour obtenir une réponse standard de rate limit pour Next.js API routes.
 */
export function rateLimitResponse(limit: number, remaining: number, reset: number) {
  return new Response(
    JSON.stringify({
      error: "Trop de requêtes",
      message: "Vous avez dépassé la limite autorisée. Veuillez réessayer plus tard.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": Math.ceil(reset / 1000).toString(),
      },
    }
  );
}

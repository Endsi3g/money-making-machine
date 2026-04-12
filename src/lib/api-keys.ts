import crypto from "crypto";

const KEY_PREFIX = "mmm_pk_"; // Project Key (public/secret)

/**
 * Génère une nouvelle clé API sécurisée.
 * Retourne la clé brute (à afficher une seule fois) et son hash (à stocker).
 */
export function generateApiKey() {
  const bytes = crypto.randomBytes(32);
  const key = `${KEY_PREFIX}${bytes.toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");
  const keyPrefix = key.substring(0, 10); // mmm_pk_...

  return { key, keyHash, keyPrefix };
}

/**
 * Valide une clé API fournie par un utilisateur.
 */
export function validateApiKeyFormat(key: string): boolean {
  return key.startsWith(KEY_PREFIX) && key.length >= 40;
}

/**
 * Calcul le hash d'une clé API pour comparaison en base de données.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * In-Memory Token & Role Cache
 * Caches decoded JWT tokens, user identities, and roles with TTL.
 * Supports token blacklisting/revocation for logout and instant role lookups.
 */

class TokenCache {
    constructor() {
        this.cache = new Map();
        this.revokedTokens = new Set();
        this.cleanupIntervalMs = 5 * 60 * 1000; // Cleanup every 5 minutes

        this.cleanupTimer = setInterval(() => {
            this.cleanupExpired();
        }, this.cleanupIntervalMs);

        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }

    /**
     * Store token data with TTL
     * @param {string} token - JWT token string
     * @param {object} userData - decoded payload & role metadata
     * @param {number} ttlMs - time to live in milliseconds (default 24h)
     */
    set(token, userData, ttlMs = 24 * 60 * 60 * 1000) {
        if (!token) return;
        const expiresAt = Date.now() + ttlMs;
        this.cache.set(token, {
            userData,
            expiresAt
        });
    }

    /**
     * Get cached token data if not expired and not revoked
     * @param {string} token 
     * @returns {object|null}
     */
    get(token) {
        if (!token) return null;
        if (this.revokedTokens.has(token)) return null;

        const entry = this.cache.get(token);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(token);
            return null;
        }

        return entry.userData;
    }

    /**
     * Check if token exists in cache
     * @param {string} token 
     * @returns {boolean}
     */
    has(token) {
        return Boolean(this.get(token));
    }

    /**
     * Revoke / invalidate a token (e.g. on logout)
     * @param {string} token 
     */
    revoke(token) {
        if (!token) return;
        this.cache.delete(token);
        this.revokedTokens.add(token);
    }

    /**
     * Check if token has been revoked
     * @param {string} token 
     * @returns {boolean}
     */
    isRevoked(token) {
        return this.revokedTokens.has(token);
    }

    /**
     * Remove expired tokens from memory
     */
    cleanupExpired() {
        const now = Date.now();
        for (const [token, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(token);
            }
        }
    }

    /**
     * Clear all cached data
     */
    clear() {
        this.cache.clear();
        this.revokedTokens.clear();
    }
}

const tokenCache = new TokenCache();
module.exports = tokenCache;

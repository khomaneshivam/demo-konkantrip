/**
 * In-Memory Sliding-Window Rate Limiter Middleware
 * Protects endpoints from DDoS, brute-force attacks, and abusive traffic.
 */

class MemoryRateLimiter {
    constructor() {
        this.hits = new Map();
        this.cleanupIntervalMs = 60 * 1000; // 1 minute cleanup interval
        this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupIntervalMs);
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }

    /**
     * Create an express middleware for rate limiting
     * @param {object} options
     * @param {number} options.windowMs - Time window in milliseconds
     * @param {number} options.max - Max requests allowed per window per IP
     * @param {string} options.message - Custom error message
     * @param {boolean} options.skipInTest - If true, skips in process.env.NODE_ENV === 'test'
     */
    create({
        windowMs = 60 * 1000,
        max = 100,
        message = "Too many requests, please try again later.",
        skipInTest = false
    } = {}) {
        return (req, res, next) => {
            if (skipInTest && process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
                return next();
            }

            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
            const key = `${req.baseUrl || req.path}:${ip}`;
            const now = Date.now();

            let record = this.hits.get(key);
            if (!record || now > record.resetTime) {
                record = {
                    count: 1,
                    resetTime: now + windowMs
                };
                this.hits.set(key, record);
            } else {
                record.count += 1;
            }

            const remaining = Math.max(0, max - record.count);
            const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

            res.setHeader('RateLimit-Limit', max);
            res.setHeader('RateLimit-Remaining', remaining);
            res.setHeader('RateLimit-Reset', resetSeconds);

            if (record.count > max) {
                res.setHeader('Retry-After', resetSeconds);
                return res.status(429).json({
                    success: false,
                    message,
                    retryAfterSeconds: resetSeconds
                });
            }

            next();
        };
    }

    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.hits.entries()) {
            if (now > record.resetTime) {
                this.hits.delete(key);
            }
        }
    }

    reset() {
        this.hits.clear();
    }
}

const memoryRateLimiter = new MemoryRateLimiter();

// Tiered rate limiters
const authLimiter = memoryRateLimiter.create({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // max 20 login/register attempts
    message: "Too many authentication attempts. Please try again after 15 minutes.",
    skipInTest: true
});

const uploadLimiter = memoryRateLimiter.create({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // max 30 uploads per minute
    message: "Upload rate limit reached. Please wait a moment before uploading more files.",
    skipInTest: true
});

const apiLimiter = memoryRateLimiter.create({
    windowMs: 60 * 1000, // 1 minute
    max: 300, // max 300 general requests per minute
    message: "Too many requests to the API. Please slow down.",
    skipInTest: true
});

module.exports = {
    MemoryRateLimiter,
    memoryRateLimiter,
    authLimiter,
    uploadLimiter,
    apiLimiter
};

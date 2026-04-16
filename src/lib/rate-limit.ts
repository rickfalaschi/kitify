/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Limitations:
 * - In-memory state is *per serverless instance*. On Vercel / multi-instance
 *   deployments, a determined attacker can still fan out across cold starts,
 *   but each single instance is still capped. For stricter guarantees, swap
 *   the `hits` Map for an Upstash Redis INCR with TTL.
 * - Good enough to blunt casual token-enumeration and brute-force bursts,
 *   which is the threat this is aimed at.
 */

type Bucket = {
  /** Millisecond timestamps of recent hits, oldest first. */
  timestamps: number[];
};

const hits = new Map<string, Bucket>();

/** Best-effort periodic cleanup so the Map doesn't grow forever. */
let lastSweepAt = 0;
function sweep(now: number, windowMs: number) {
  // Run a full sweep at most once per window.
  if (now - lastSweepAt < windowMs) return;
  lastSweepAt = now;
  for (const [key, bucket] of hits) {
    const cutoff = now - windowMs;
    bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);
    if (bucket.timestamps.length === 0) {
      hits.delete(key);
    }
  }
}

export type RateLimitResult = {
  ok: boolean;
  /** Number of requests remaining in the current window. */
  remaining: number;
  /** Seconds until the oldest recorded hit falls out of the window. */
  retryAfterSeconds: number;
};

/**
 * Record a hit for `key` and decide whether to allow it.
 *
 * @param key      Rate-limit bucket key (e.g. `"p:1.2.3.4"`).
 * @param limit    Max requests allowed per window.
 * @param windowMs Window size in milliseconds.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now, windowMs);

  const cutoff = now - windowMs;
  const bucket = hits.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000),
    );
    hits.set(key, bucket);
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  bucket.timestamps.push(now);
  hits.set(key, bucket);

  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    retryAfterSeconds: 0,
  };
}

/**
 * Extract a best-effort client IP from request headers. Trusts
 * `x-forwarded-for` (populated by Vercel / proxies) first, then
 * `x-real-ip`. Falls back to `"unknown"` — which degrades to a
 * shared bucket and is intentionally strict.
 */
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    // First IP in the list is the original client.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

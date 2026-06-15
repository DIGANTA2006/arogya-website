type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  reason?: string;
};

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const firstForwarded = forwarded.split(",")[0]?.trim();

  return (
    firstForwarded ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function cleanKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9:_@.+-]/g, "_")
    .slice(0, 180);
}

async function upstashCommand(command: string[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return undefined;
  }

  const encodedCommand = command.map((part) => encodeURIComponent(part)).join("/");

  const response = await fetch(`${url}/${encodedCommand}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Upstash rate limit request failed.");
  }

  return response.json() as Promise<{ result: unknown }>;
}

function memoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });

    return {
      allowed: true,
      remaining: limit - 1,
      retryAfter: windowSeconds,
    };
  }

  existing.count += 1;
  memoryStore.set(key, existing);

  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfter,
  };
}

export async function checkRateLimit(input: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const key = cleanKey(input.key);
  const hasUpstash =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (hasUpstash) {
    const countResult = await upstashCommand(["INCR", key]);
    const count = Number(countResult?.result || 0);

    if (count === 1) {
      await upstashCommand(["EXPIRE", key, String(input.windowSeconds)]);
    }

    const ttlResult = await upstashCommand(["TTL", key]);
    const ttl = Number(ttlResult?.result || input.windowSeconds);
    const retryAfter = ttl > 0 ? ttl : input.windowSeconds;

    return {
      allowed: count <= input.limit,
      remaining: Math.max(0, input.limit - count),
      retryAfter,
    };
  }

  return memoryRateLimit(key, input.limit, input.windowSeconds);
}

export function rateLimitPayload(result: RateLimitResult) {
  return {
    error: result.reason || "Too many attempts. Please try again later.",
    retryAfter: result.retryAfter,
  };
}
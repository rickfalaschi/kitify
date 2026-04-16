import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Public pre-order route rate limit. The /p/[token] endpoints are
// unauthenticated and token-guarded — a patient attacker could try to
// enumerate tokens by brute force. 30 requests per minute per IP blunts
// that without hurting legitimate employees filling out their kit form.
const PUBLIC_TOKEN_LIMIT = 30;
const PUBLIC_TOKEN_WINDOW_MS = 60_000;

export async function proxy(request: Request) {
  const { pathname } = new URL(request.url);

  // Rate limit public token routes BEFORE doing any auth work (auth is
  // irrelevant here and we want to fail fast on abusive clients).
  if (pathname.startsWith("/p/")) {
    const ip = getClientIp(request.headers);
    const result = rateLimit(
      `p:${ip}`,
      PUBLIC_TOKEN_LIMIT,
      PUBLIC_TOKEN_WINDOW_MS,
    );
    if (!result.ok) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.next();
  }

  const session = await auth();

  if (pathname.startsWith("/admin")) {
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (!session?.user || session.user.role !== "company") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/p/:path*"],
};

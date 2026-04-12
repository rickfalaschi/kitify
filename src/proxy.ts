import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: Request) {
  const session = await auth();
  const { pathname } = new URL(request.url);

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
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};

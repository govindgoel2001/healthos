import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * HTTP Basic Auth for the whole dashboard, including the /api routes.
 *
 * Gated on DASHBOARD_PASSWORD:
 *  - unset  → requests pass through, with a one-time warning. Keeps a
 *             misconfigured or local deploy usable.
 *  - set    → an `Authorization: Basic` header matching
 *             DASHBOARD_USER (default "meteor") / DASHBOARD_PASSWORD is
 *             required; otherwise 401.
 */
let warned = false;

export function middleware(req: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;

  if (!password) {
    if (!warned) {
      console.warn(
        "[web] DASHBOARD_PASSWORD is unset — the dashboard is unauthenticated.",
      );
      warned = true;
    }
    return NextResponse.next();
  }

  const expectedUser = process.env.DASHBOARD_USER ?? "meteor";
  const header = req.headers.get("authorization");

  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const sep = decoded.indexOf(":");
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    if (user === expectedUser && pass === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Meteor Health"' },
  });
}

export const config = {
  // Everything except Next's static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

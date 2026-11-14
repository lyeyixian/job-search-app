import { type NextRequest, NextResponse } from "next/server";
import { apiUrl } from "@/api/config";

// Forwards /api/* from the browser to the API, so that the app has one address.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  return NextResponse.rewrite(new URL(pathname + search, apiUrl()));
}

export const config = {
  matcher: "/api/:path*",
};

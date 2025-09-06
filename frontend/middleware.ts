import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require wallet connection
const protectedRoutes = ["/create-campaign", "/profile", "/campaigns/create"];

// Public routes that can be accessed without wallet
const publicRoutes = ["/", "/campaigns", "/statistics", "/achievements"];

// Admin-only routes
const adminRoutes = ["/admin"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Get wallet connection status from cookie
  const walletConnected =
    request.cookies.get("wallet-connected")?.value === "true";
  const userRole = request.cookies.get("user-role")?.value;

  // Allow access to public routes without wallet
  if (isPublicRoute && !isProtectedRoute) {
    return NextResponse.next();
  }

  // Redirect to home if accessing protected route without wallet
  if (isProtectedRoute && !walletConnected) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set(
      "message",
      "Please connect your wallet to access this page"
    );
    return NextResponse.redirect(url);
  }

  // Redirect to home if accessing admin route without admin role
  if (isAdminRoute && userRole !== "admin" && userRole !== "organizer") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("message", "Access denied: Admin privileges required");
    return NextResponse.redirect(url);
  }

  // Add security headers
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://rpc.testnet-02.midnight.network https://indexer.testnet-02.midnight.network;"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

export const config = {
  matcher: "/api/webhook",
};

export function middleware() {
  // No-op middleware; config ensures Vercel provides the raw body
}
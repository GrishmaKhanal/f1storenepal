import type { NextConfig } from "next";

// Sent with every response. A full script CSP is left out on purpose: Next.js's inline
// bootstrap scripts would need nonces, which turns every page dynamic.
// Geolocation is allowed for our own pages: checkout's "Use my current location".
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), browsing-topics=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // sharp is a native module and nodemailer opens raw sockets; keep both out of the server bundle.
  serverExternalPackages: ["sharp", "nodemailer"],
  experimental: {
    // Admin image uploads go through a Server Action: 4 MB image + multipart overhead.
    // (Vercel caps function request bodies at 4.5 MB.)
    serverActions: { bodySizeLimit: "4200kb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

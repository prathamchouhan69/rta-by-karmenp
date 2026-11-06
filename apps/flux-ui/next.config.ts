import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'x-content-type-options', value: 'nosniff' },
  { key: 'x-frame-options', value: 'DENY' },
  { key: 'referrer-policy', value: 'no-referrer' },
  { key: 'permissions-policy', value: 'camera=(), geolocation=(), microphone=(self)' },
  { key: 'strict-transport-security', value: 'max-age=31536000' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;

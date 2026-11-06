import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Flux · RTA by KARM',
    short_name: 'Flux',
    description: 'Business, money, health and construction intelligence with explicit uncertainty.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0f14',
    theme_color: '#0b0f14',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}

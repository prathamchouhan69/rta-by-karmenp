import type { Metadata } from 'next';
import { Dashboard } from '@/components/dashboard';

export const metadata: Metadata = { title: 'Command centre' };

export default function HomePage() {
  return <Dashboard />;
}

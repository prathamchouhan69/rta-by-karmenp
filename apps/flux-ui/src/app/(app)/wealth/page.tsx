import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { WealthPanel } from '@/components/wealth-panel';

export const metadata: Metadata = { title: 'Wealth Mode' };

export default function WealthPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Wealth Mode"
        title="See the balance sheet and test the gap"
        description={<>Every rate is an assumption you supply. A scenario is not a forecast. Educational information only, not personalised investment advice.</>}
      />
      <WealthPanel />
    </div>
  );
}

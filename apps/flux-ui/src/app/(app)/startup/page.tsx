import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { StartupPanel } from '@/components/startup-panel';

export const metadata: Metadata = { title: 'Startup Founder Mode' };

export default function StartupPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Startup Founder Mode"
        title="Runway, burn and ownership"
        description={<>Runway, burn efficiency and cap-table arithmetic from your inputs. Not a valuation or a fundraising promise. Educational information only, not personalised investment advice.</>}
      />
      <StartupPanel />
    </div>
  );
}

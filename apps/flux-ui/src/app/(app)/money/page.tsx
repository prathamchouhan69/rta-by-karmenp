import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { MoneyPanel } from '@/components/money-panel';

export const metadata: Metadata = { title: 'Money Mode' };

export default function MoneyPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Money Mode"
        title="Make the numbers visible"
        description={<>Plan with your own numbers. Flux does not sell products, promise returns or replace a qualified adviser. Educational information only, not personalised investment advice.</>}
      />
      <MoneyPanel />
    </div>
  );
}

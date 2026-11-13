import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { CashFlowPanel } from '@/components/cash-flow-panel';

export const metadata: Metadata = { title: 'Cash Flow Forecast' };

export default function CashFlowPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Finance"
        title="Cash flow forecast"
        description="Build a month-by-month scenario from your own estimates. Nothing here is connected to live Zoho data."
      />
      <CashFlowPanel />
    </div>
  );
}

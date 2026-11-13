import { ChartDetail } from '@/components/chart-detail';

export default async function ChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChartDetail id={id} />;
}

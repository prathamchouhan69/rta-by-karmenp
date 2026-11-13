import { ReferenceDetail } from '@/components/reference-detail';

export default async function ReferencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReferenceDetail id={id} />;
}

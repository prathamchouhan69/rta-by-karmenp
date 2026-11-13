export interface AgingEvidence {
  text: string;
  daysOverdue?: number;
}

export const AGING_BUCKETS = [
  { label: '0–30 days', minimum: 0, maximum: 30 },
  { label: '31–60 days', minimum: 31, maximum: 60 },
  { label: '61–90 days', minimum: 61, maximum: 90 },
  { label: '90+ days', minimum: 91, maximum: Number.POSITIVE_INFINITY },
] as const;

export function countAgingBuckets(items: readonly AgingEvidence[]) {
  return AGING_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: items.filter((item) => {
      const days = item.daysOverdue;
        return typeof days === 'number'
          && Number.isInteger(days)
          && days >= bucket.minimum
          && days <= bucket.maximum;
      }).length,
    }));
}

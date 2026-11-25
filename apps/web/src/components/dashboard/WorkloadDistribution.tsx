import React from 'react';

interface WorkloadDistributionProps {}

const WORKLOAD_DATA = [
  { label: 'Cyan Core Matrix', value: 54.2, color: '#22d3ee' },
  { label: 'Violet Vector Array', value: 28.6, color: '#818cf8' },
  { label: 'Brass Neural Edge', value: 17.2, color: '#f59e0b' },
];

export const WorkloadDistribution: React.FC<WorkloadDistributionProps> = () => {
  return (
    <div className="lg:col-span-4 bg-surface-container-low p-8 rounded-xl shadow-md flex flex-col justify-between">
      <div>
        <h3 className="text-headline-sm font-headline text-on-surface mb-2">Workload Allocation</h3>
        <p className="text-body-sm text-on-surface-variant font-numeric-data">Distribution across processing clusters</p>
      </div>
      <div className="flex flex-col gap-5 my-8">
        {WORKLOAD_DATA.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-body-sm mb-1.5 font-numeric-data">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <span className="text-on-surface">{item.value}%</span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${item.value}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-surface-container rounded-xl flex items-center justify-between">
        <span className="text-label text-on-surface-variant font-numeric-data">OPTIMIZATION STATE</span>
        <span className="px-2 py-0.5 bg-primary/20 text-primary text-label font-numeric-data rounded">AUTONOMOUS</span>
      </div>
    </div>
  );
};

export default WorkloadDistribution;
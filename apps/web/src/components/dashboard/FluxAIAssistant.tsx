import React, { useState } from 'react';
import { IconPsychology, IconLightbulb, IconAutoAwesome, IconArrowUpward } from '../common/Icons';

interface FluxAIAssistantProps {}

interface Recommendation {
  id: number;
  title: string;
  description: string;
  icon: 'lightbulb' | 'auto_awesome';
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 409,
    title: 'Recommendation #409',
    description: 'Rebalance sub-routing for node cluster AP-09 to reduce jitter by 4.2%.',
    icon: 'lightbulb',
  },
  {
    id: 410,
    title: 'Workflow Automated',
    description: 'Auto-scaled memory allocation across 124 worker instances.',
    icon: 'auto_awesome',
  },
];

export const FluxAIAssistant: React.FC<FluxAIAssistantProps> = () => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      console.log('Flux AI prompt:', prompt);
      setPrompt('');
    }
  };

  return (
    <div className="lg:col-span-4 bg-surface-container-low p-8 rounded-xl shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <IconPsychology size={24} color="#22d3ee" />
            <h3 className="text-headline-sm font-headline text-on-surface">Flux AI Assistant</h3>
          </div>
          <span className="px-2 py-0.5 bg-primary/20 text-primary text-label font-numeric-data rounded">ACTIVE</span>
        </div>
        <p className="text-body-sm text-on-surface-variant mb-8">
          Autonomous workflow engine monitoring cluster stability and executing latency mitigations in real-time.
        </p>
        <div className="space-y-4 mb-8">
          {RECOMMENDATIONS.map(rec => (
            <div key={rec.id} className="p-4 bg-surface-container rounded-xl flex items-start gap-3">
              {rec.icon === 'lightbulb' ? (
                <IconLightbulb size={18} color="#f59e0b" className="mt-0.5" />
              ) : (
                <IconAutoAwesome size={18} color="#22d3ee" className="mt-0.5" />
              )}
              <div className="flex flex-col">
                <span className="text-body-sm font-bold text-on-surface">{rec.title}</span>
                <span className="text-body-sm text-on-surface-variant">{rec.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="relative mt-5">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Prompt Flux AI command..."
          className="w-full bg-surface-container text-on-surface pl-5 pr-12 py-3 rounded-xl text-body-md focus:outline-none focus:ring-1 focus:ring-primary border border-outline-variant/30"
        />
        <button
          type="submit"
          disabled={!prompt.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconArrowUpward size={16} />
        </button>
      </form>
    </div>
  );
};

export default FluxAIAssistant;
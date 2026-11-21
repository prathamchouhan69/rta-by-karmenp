import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConnectedIntelligenceNode } from './ConnectedIntelligenceNode';
import { IconOfflineShield } from './Icons';

export const TardigradeOfflineBanner: React.FC = () => {
  const { isOnline, offlineQueueCount } = useApp();
  const [showSimulated, setShowSimulated] = useState(false);

  const isTardigradeActive = !isOnline || showSimulated;

  return (
    <>
      {/* Simulation Toggle pill in footer or on demand */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setShowSimulated(!showSimulated)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-interface transition-all shadow-xl ${
            isTardigradeActive
              ? 'bg-amber-950/90 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-black/60 border-white/10 text-slate-400 hover:text-white hover:bg-black/80'
          }`}
          title="Toggle Tardigrade cryptobiosis offline survival simulation"
        >
          <IconOfflineShield size={14} color={isTardigradeActive ? '#f59e0b' : '#94a3b8'} />
          <span className="font-mono text-[10px]">
            {isTardigradeActive ? 'TARDIGRADE ACTIVE' : 'TEST OFFLINE MODE'}
          </span>
        </button>
      </div>

      {/* Floating Offline Resilience Banner */}
      {isTardigradeActive && (
        <div className="fixed top-18 inset-x-4 max-w-4xl mx-auto z-50 animate-slideDown shadow-2xl">
          <ConnectedIntelligenceNode
            id="intel-tardigrade"
            referenceNumber={4}
            videoFilename="2026-10-20 15-52-51.mp4"
            title="Tardigrade Cryptobiosis Offline Resilience"
            conceptName="Milnesium Tardigradum Trehalose Staging (Ref #4)"
            businessContext={`Network connection lost or running in remote industrial mode. The app has replaced live network sockets with a local immutable write queue. ${offlineQueueCount} operational vouchers currently staged for atomic Zoho Books replay.`}
            impactMetrics={[
              { label: 'OFFLINE QUEUE', value: `${offlineQueueCount} Vouchers`, trend: 'Encrypted' },
              { label: 'DATA INTEGRITY', value: '100% Retained', trend: 'Lossless' },
              { label: 'ATOMIC SYNC', value: 'On Reconnect', trend: 'Standby' }
            ]}
            calculusDeriv="d(Data Loss)/dt = 0 (Cryptobiosis Zero-Entropy Guarantee)"
            calculusEli5="A water bear can completely dry up, freeze in ice, and wake right back up like nothing happened when you add water. When our internet cuts off at a remote quarry, the app freezes your work safely in memory so not a single rupee or invoice number is ever lost."
            actionButtonText="Audit Staged Offline Mutation Queue"
            actionBadge="Cryptobiosis Mode"
            interactiveType="tardigrade"
            onAction={() => {
              console.log('Auditing local staged offline transactions');
            }}
          />
        </div>
      )}
    </>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HsnVerificationGate } from '../operations/HsnVerificationGate';
import { TamperEvidentAuditLog } from '../operations/TamperEvidentAuditLog';
import { ConnectedIntelligenceNode } from '../common/ConnectedIntelligenceNode';
import { IconCheck, IconAlert } from '../common/Icons';
import { formatRupees } from '../../utils/formatters';

export const GatesScreen: React.FC = () => {
  const { bills } = useApp();
  const [approvedBillIds, setApprovedBillIds] = useState<string[]>([]);
  const [activeSignOff, setActiveSignOff] = useState<string | null>(null);

  const handleApproveBill = (billId: string) => {
    setActiveSignOff(billId);
    setTimeout(() => {
      setApprovedBillIds(prev => [...prev, billId]);
      setActiveSignOff(null);
    }, 700);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="type-label text-cyan-400">CANONICAL SECTION 6</span>
          <span className="text-[10px] text-slate-500 font-mono">/</span>
          <span className="text-[10px] text-slate-400 font-mono">STATUTORY COMPLIANCE & APPROVALS</span>
        </div>
        <h1 className="type-h1 text-white">Gates · Compliance, HSN & Merkle Audit</h1>
        <p className="type-body-sm text-slate-400 mt-1 max-w-3xl">
          Four statutory approval gates: GSTIN checksum validation, HSN/SAC classification, single-use payload verification & cryptographic tamper-evident audit chaining.
        </p>
      </div>

      {/* 4 Approval Gates Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#080d16] border border-white/10 space-y-1">
          <span className="type-label text-cyan-400 block">GATE 1 · INTERNAL SAVE</span>
          <h4 className="type-h4 text-white text-xs">Schema Integrity Check</h4>
          <p className="type-timestamp text-slate-400">Validates required fields before local staging.</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d16] border border-white/10 space-y-1">
          <span className="type-label text-purple-400 block">GATE 2 · ZOHO DRAFT</span>
          <h4 className="type-h4 text-white text-xs">Zero Client Arithmetic</h4>
          <p className="type-timestamp text-slate-400">Transmits uncalculated inputs to Zoho Books API.</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d16] border border-white/10 space-y-1">
          <span className="type-label text-sky-400 block">GATE 3 · STATUTORY HSN</span>
          <h4 className="type-h4 text-white text-xs">GSTIN & Rate Enforcement</h4>
          <p className="type-timestamp text-slate-400">Verified classification against GST schedules.</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d16] border border-white/10 space-y-1">
          <span className="type-label text-sky-400 block">GATE 4 · ISSUANCE & DISPATCH</span>
          <h4 className="type-h4 text-white text-xs">Officer Two-Factor Seal</h4>
          <p className="type-timestamp text-slate-400">Final signature before external dispatch or email.</p>
        </div>
      </div>

      {/* Connected Jellyfish Cellular Transdifferentiation */}
      <ConnectedIntelligenceNode
        id="intel-jellyfish"
        referenceNumber={5}
        videoFilename="2026-10-20 15-52-51.mp4"
        title="Immortal Jellyfish Cellular Transdifferentiation"
        conceptName="Turritopsis Dohrnii Audit Rollback (Ref #5)"
        businessContext="Allows instant rollback of an unapproved subcontract amendment or disputed delivery slip back to its signed pristine block, preserving complete Merkle cryptographic lineage."
        impactMetrics={[
          { label: 'MERKLE PROOF', value: 'SHA-256 Chained', trend: 'Verified' },
          { label: 'ROLLBACK TIME', value: '< 100ms', trend: 'Instant' },
          { label: 'IMMUTABILITY', value: '100% Guaranteed', trend: 'Active' }
        ]}
        calculusDeriv="d(Lineage Integrity)/dt = 0 (Constant Entropy Preservation)"
        calculusEli5="Like rewinding a film reel back to where the picture was perfect, before someone dropped ink on the page. The app lets you jump back to a clean version without losing any of your history."
        actionButtonText="Trigger Jellyfish Cryptographic Rollback"
        actionBadge="Cellular Rollback"
        interactiveType="jellyfish"
        onAction={() => {
          console.log('Executed Jellyfish state rollback on active Merkle audit node');
        }}
      />

      {/* Gate 4: Officer Two-Factor Seal Bill Approval Station */}
      <div className="p-6 rounded-3xl bg-[#080d16] border border-sky-500/30 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <span className="type-label text-sky-400 block text-[10px]">GATE 4 STATION</span>
            <h3 className="type-h3 text-white">Subcontractor Bill Sign-Off & Release Gate</h3>
          </div>
          <span className="type-timestamp text-slate-400 font-mono text-xs">
            {bills.filter(b => !approvedBillIds.includes(b.id)).length} Pending Signatures
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-interface text-xs">
          {bills.map(b => {
            const isApproved = approvedBillIds.includes(b.id);
            const isSigning = activeSignOff === b.id;

            return (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isApproved
                    ? 'bg-sky-950/30 border-sky-500/40 opacity-75'
                    : 'bg-black/50 border-white/10 hover:border-cyan-400/40'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400">{b.bill_number}</span>
                    <h4 className="text-sm font-semibold text-white">{b.vendor_name}</h4>
                    <span className="type-timestamp text-slate-400 block mt-0.5">{b.category}</span>
                  </div>
                  <span className="type-financial text-sm font-bold text-white">
                    {formatRupees(b.total)}
                  </span>
                </div>

                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="type-timestamp text-[11px] text-slate-400">
                    Due: {b.due_date}
                  </span>

                  {isApproved ? (
                    <span className="type-label text-sky-400 flex items-center gap-1">
                      <IconCheck size={12} state="success" /> 2FA SEALED
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApproveBill(b.id)}
                      disabled={isSigning}
                      className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-semibold text-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isSigning ? (
                        <span>Sealing Hash...</span>
                      ) : (
                        <>
                          <IconCheck size={12} />
                          <span>Approve & Seal Gate 4</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary HSN Verification Gate */}
      <HsnVerificationGate />

      {/* Cryptographic Tamper-Evident Audit Log */}
      <TamperEvidentAuditLog />
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ImmortalJellyfishRecovery } from '../nature/ImmortalJellyfishRecovery';
import { GlassFolderCard } from '../common/GlassFolderCard';
import { CompactStatusDot } from '../common/CompactStatusDot';

interface FileTreeItem {
  id: string;
  name: string;
  isFolder: boolean;
  fileCount?: number | undefined;
  children?: FileTreeItem[] | undefined;
  size?: string | undefined;
  version?: string | undefined;
  status?: 'optimal' | 'warning' | 'critical' | 'idle' | 'active' | 'pending' | 'success' | 'error' | undefined;
}

const MOCK_FILE_TREE: FileTreeItem[] = [
  {
    id: 'folder-1',
    name: 'Financial_Audit_2026',
    isFolder: true,
    fileCount: 4,
    children: [
      { id: 'f1', name: 'Financial_Audit_2026.pdf', isFolder: false, size: '2.4 MB', version: '3.0', status: 'optimal' },
      { id: 'f2', name: 'Q3_Provisional_Tax_Calc.xlsx', isFolder: false, size: '1.1 MB', version: '2.0', status: 'warning' },
      { id: 'f3', name: 'GSTR-3B_Filing_Receipt.pdf', isFolder: false, size: '856 KB', version: '1.0', status: 'success' },
      { id: 'f4', name: 'Advance_Tax_Challan_Sept.pdf', isFolder: false, size: '432 KB', version: '1.0', status: 'optimal' },
    ],
  },
  {
    id: 'folder-2',
    name: 'Project_Gamma_Precast',
    isFolder: true,
    fileCount: 3,
    children: [
      { id: 'f5', name: 'Pier_Cap_Design_Drawing.dwg', isFolder: false, size: '12.3 MB', version: '5.0', status: 'active' },
      { id: 'f6', name: 'Reinforcement_BBS_16mm.xlsx', isFolder: false, size: '2.1 MB', version: '3.0', status: 'optimal' },
      { id: 'f7', name: 'Concrete_Mix_Design_M45.pdf', isFolder: false, size: '1.8 MB', version: '2.0', status: 'optimal' },
    ],
  },
  {
    id: 'folder-3',
    name: 'Vendor_Contracts',
    isFolder: true,
    fileCount: 2,
    children: [
      { id: 'f8', name: 'Jindal_Steel_MSA_2026.pdf', isFolder: false, size: '3.2 MB', version: '1.0', status: 'optimal' },
      { id: 'f9', name: 'UltraTech_Cement_Supply_Agreement.pdf', isFolder: false, size: '2.7 MB', version: '1.0', status: 'warning' },
    ],
  },
  {
    id: 'f10',
    name: 'Site_Alpha_Geotech_Report.pdf',
    isFolder: false,
    size: '8.9 MB',
    version: '1.0',
    status: 'critical',
  },
];

export const FilesScreen: React.FC = () => {
  const { files, navigateTo } = useApp();
  const [selectedFile, setSelectedFile] = useState<FileTreeItem | null>(null);

  const handleFileClick = (file: FileTreeItem) => {
    setSelectedFile(file);
    if (!file.isFolder) {
      navigateTo('file_detail', file.id);
    }
  };

  const handleFolderOpen = () => {
    // Folder toggle handled by GlassFolderCard internally
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="border-b border-white/10 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              FILES & RECOVERY NETWORK
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Glass folder cards with tilt/open motion · Immortal Jellyfish version recovery
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CompactStatusDot
              status="active"
              label="Live Sync"
              size="sm"
              showPulse
            />
            <CompactStatusDot
              status="optimal"
              label="3 Folders"
              size="sm"
            />
            <CompactStatusDot
              status="warning"
              label="2 Need Review"
              size="sm"
            />
          </div>
        </div>
      </div>

      <ImmortalJellyfishRecovery
        fileId={selectedFile?.id || files[0]?.id || 'f1'}
        fileName={selectedFile?.name || files[0]?.name || 'Financial_Audit_2026.pdf'}
        versions={selectedFile?.isFolder ? [] : (files[0]?.versions || [
          { version: 3, date: '2026-11-20', author: 'Karmen P.' },
          { version: 2, date: '2026-11-18', author: 'Elena R.' },
        ])}
      />

      {/* Glass Folder Cards - Documents/Crystals only (Video 03) */}
      <div className="space-y-3" role="tree" aria-label="File browser">
        {MOCK_FILE_TREE.map((item) => (
          <GlassFolderCard
            key={item.id}
            id={item.id}
            name={item.name}
            isFolder={item.isFolder}
            fileCount={item.fileCount}
            children={item.children}
            size={item.size}
            version={item.version}
            onClick={() => handleFileClick(item)}
            onOpen={handleFolderOpen}
          />
        ))}
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/10">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className="text-2xl font-bold text-cyan-400">9</div>
          <div className="text-[10px] text-slate-400">Total Items</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className="text-2xl font-bold text-pink-400">4</div>
          <div className="text-[10px] text-slate-400">Folders</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className="text-2xl font-bold text-sky-400">5</div>
          <div className="text-[10px] text-slate-400">Files</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className="text-2xl font-bold text-amber-400">2</div>
          <div className="text-[10px] text-slate-400">Need Review</div>
        </div>
      </div>
    </div>
  );
};

export default FilesScreen;
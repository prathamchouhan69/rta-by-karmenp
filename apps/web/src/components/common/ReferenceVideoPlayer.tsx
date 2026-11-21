import React, { useState } from 'react';
import { REFERENCE_VIDEOS, ReferenceVideoItem } from '../../data/referenceVideos';

interface Props {
  currentRefNum?: number;
  className?: string;
}

export const ReferenceVideoPlayer: React.FC<Props> = ({ currentRefNum, className = '' }) => {
  // Find a video directly matching this reference, or fallback to first video
  const defaultVideo = REFERENCE_VIDEOS.find(v => v.linkedRefNumbers.includes(currentRefNum || 1)) || REFERENCE_VIDEOS[0];
  const [selectedVideo, setSelectedVideo] = useState<ReferenceVideoItem>(defaultVideo);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={`p-5 rounded-3xl bg-[#06080d]/95 border border-white/10 space-y-4 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
            <span className="type-label text-cyan-400">ORIGINAL MOTION & SPATIAL RECORDING</span>
          </div>
          <h3 className="type-h4 text-white mt-1">{selectedVideo.title}</h3>
        </div>

        {/* Video selector dropdown */}
        <select
          value={selectedVideo.id}
          onChange={(e) => {
            const vid = REFERENCE_VIDEOS.find(v => v.id === e.target.value);
            if (vid) setSelectedVideo(vid);
          }}
          className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-400"
        >
          {REFERENCE_VIDEOS.map(v => (
            <option key={v.id} value={v.id} className="bg-[#0b0f17] text-white">
              {v.timestamp} · {v.title}
            </option>
          ))}
        </select>
      </div>

      {/* Video Container */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/5 shadow-inner">
        <video
          key={selectedVideo.filename}
          controls
          playsInline
          preload="metadata"
          className="w-full h-full object-contain"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={`/references/videos/${encodeURIComponent(selectedVideo.filename)}`} type="video/mp4" />
          Your browser does not support the video element.
        </video>
      </div>

      {/* Metadata & Analysis Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono pt-2 border-t border-white/5 text-slate-400">
        <p className="type-body-sm text-slate-300">
          <span className="text-cyan-400 font-semibold">Motion Analysis: </span>
          {selectedVideo.description}
        </p>
        <span className="type-timestamp shrink-0 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
          Source: {selectedVideo.filename}
        </span>
      </div>
    </div>
  );
};

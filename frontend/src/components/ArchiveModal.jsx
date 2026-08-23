import React from 'react';

export default function ArchiveModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">Archive</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
        </div>
        <div className="p-8 text-center space-y-3">
          <div className="w-14 h-14 border-2 border-zinc-700 rounded-full flex items-center justify-center mx-auto text-zinc-500">
            <svg fill="currentColor" height="28" width="28" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z" />
              <path d="M12 6v6l4 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-white">No Archived Items</h4>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">Only you can see the posts and stories you've archived. When you archive content, it stays here safely.</p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

export default function ReportProblemModal({ onClose }) {
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[480px] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">Report a Problem</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h4 className="text-base font-bold text-white">Report Submitted</h4>
            <p className="text-xs text-zinc-400">Thank you for helping us improve the platform. Our team will look into this.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Briefly explain what went wrong</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include steps to reproduce or details about what isn't working as expected..."
                rows={4}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-800">
              <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs text-zinc-400 hover:text-white">Cancel</button>
              <button type="submit" disabled={!description.trim()} className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg disabled:opacity-40 cursor-pointer">Send Report</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

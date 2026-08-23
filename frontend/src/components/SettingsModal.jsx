import React, { useState } from 'react';

export default function SettingsModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('account');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[500px] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white">Settings</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-sm cursor-pointer">✕</button>
        </div>

        <div className="flex border-b border-zinc-800 bg-zinc-950/50">
          {['account', 'privacy', 'notifications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition cursor-pointer border-b-2 ${
                activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4 text-sm text-zinc-300 max-h-[60vh] overflow-y-auto">
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Language</label>
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white focus:outline-none">
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <div>
                  <p className="font-semibold text-white">Account Status</p>
                  <p className="text-xs text-zinc-500">Your account is in good standing</p>
                </div>
                <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">Active</span>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <div>
                  <p className="font-semibold text-white">Private Account</p>
                  <p className="text-xs text-zinc-500">Only people you approve can see your photos</p>
                </div>
                <input type="checkbox" className="w-4 h-4 accent-blue-500 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <div>
                  <p className="font-semibold text-white">Show Activity Status</p>
                  <p className="text-xs text-zinc-500">Allow accounts you follow to see when you were last active</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500 cursor-pointer" />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                <div>
                  <p className="font-semibold text-white">Pause All Notifications</p>
                  <p className="text-xs text-zinc-500">Temporarily pause push and socket alerts</p>
                </div>
                <input type="checkbox" className="w-4 h-4 accent-blue-500 cursor-pointer" />
              </div>
            </div>
          )}

          {saved && (
            <div className="p-2 bg-blue-950/80 border border-blue-800 text-blue-300 text-xs rounded text-center font-medium">
              Settings updated successfully!
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-zinc-800 bg-zinc-950">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-zinc-400 hover:text-white font-medium">Close</button>
          <button onClick={handleSave} className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition cursor-pointer">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

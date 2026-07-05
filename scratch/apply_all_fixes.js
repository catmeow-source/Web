const fs = require('fs');
const path = 'c:\\files\\projects\\Maja\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Modals replacement
content = content.replace("import { Trash2, Plus, Calendar as CalendarIcon, CheckCircle, Play, Sparkles, LogOut, Settings, X, Brain, Check, Folder, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';",
"import { Trash2, Plus, Calendar as CalendarIcon, CheckCircle, Play, Sparkles, LogOut, Settings, X, Brain, Check, Folder, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';\nimport { AnimatedModal } from '@/components/AnimatedModal';");

const oldModals = [
  \`        {showNotifications && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative">
              <button onClick={() => setShowNotifications(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold mb-4">Notifications</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-neutral-500 text-sm">No new notifications.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={\`p-3 rounded-lg border \${n.read ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-950 border-brand-purple/50'}\`}>
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-neutral-200">{n.message}</p>
                        {!n.read && (
                          <button onClick={() => handleMarkNotificationRead(n.id)} className="text-[10px] bg-brand-purple/20 text-brand-purple px-2 py-1 rounded">
                            Mark Read
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}\`,
  \`        {showProfile && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative">
              <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold mb-4">Profile & Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400">Name</label>
                  <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400">Working Hours</label>
                  <div className="flex gap-2 mt-1">
                    <input type="time" value={profileForm.workStart} onChange={e => setProfileForm({...profileForm, workStart: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm" />
                    <input type="time" value={profileForm.workEnd} onChange={e => setProfileForm({...profileForm, workEnd: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input type="checkbox" checked={profileForm.notificationsEnabled} onChange={e => setProfileForm({...profileForm, notificationsEnabled: e.target.checked})} className="rounded bg-neutral-950 border-neutral-800" />
                    Enable Browser Notifications
                  </label>
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-400">Preferred AI Coach Theme</label>
                  <select value={profileForm.themePreference} onChange={e => setProfileForm({...profileForm, themePreference: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm mt-1 text-white">
                    <option value="default">Default (Direct & Analytical)</option>
                    <option value="gentle">Gentle (Encouraging & Soft)</option>
                    <option value="strict">Strict (Tough Love & Pushy)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex justify-between">
                  <button onClick={handleUpdateProfile} className="bg-brand-purple hover:bg-brand-purple-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition">
                    Save Changes
                  </button>
                  <button onClick={handleLogout} className="bg-red-950 text-red-400 hover:bg-red-900 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}\`,
  \`        {showFocusModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 relative max-h-[80vh] flex flex-col">
              <button onClick={() => setShowFocusModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <Brain className="w-5 h-5 text-brand-teal" /> Recommended Focus Schedule
              </h3>
              <p className="text-xs text-neutral-400 mb-6">Generated based on your work hours and active deadlines.</p>
              
              <div className="overflow-y-auto space-y-3 flex-grow pr-2">
                {focusBlocks.map((block, i) => (
                  <div key={i} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                      <span className="text-[10px] font-bold text-brand-teal uppercase tracking-widest block mb-1">
                        {block.timeSlot}
                      </span>
                      <h4 className="font-bold text-white text-sm">{block.taskName}</h4>
                      <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">{block.reason}</p>
                    </div>
                    <span className={\`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 \${
                      block.type === 'deep-work' ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30' :
                      block.type === 'admin' ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' :
                      'bg-brand-coral/20 text-brand-coral border border-brand-coral/30'
                    }\`}>
                      {block.type.replace('-', ' ')}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 mt-2 border-t border-neutral-800">
                <button onClick={() => setShowFocusModal(false)} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-lg transition text-sm">
                  Got it, let's work
                </button>
              </div>
            </div>
          </div>
        )}\`
];

const newModals = [
  \`        <AnimatedModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} title="Notifications">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-neutral-500 text-sm">No new notifications.</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={\\\`p-3 rounded-lg border \\\${n.read ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-950 border-brand-purple/50'}\\\`}>
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-neutral-200">{n.message}</p>
                    {!n.read && (
                      <button onClick={() => handleMarkNotificationRead(n.id)} className="text-[10px] bg-brand-purple/20 text-brand-purple px-2 py-1 rounded">
                        Mark Read
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </AnimatedModal>\`,
  \`        <AnimatedModal isOpen={showProfile} onClose={() => setShowProfile(false)} title="Profile & Settings">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-400">Name</label>
              <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-400">Working Hours</label>
              <div className="flex gap-2 mt-1">
                <input type="time" value={profileForm.workStart} onChange={e => setProfileForm({...profileForm, workStart: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm" />
                <input type="time" value={profileForm.workEnd} onChange={e => setProfileForm({...profileForm, workEnd: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input type="checkbox" checked={profileForm.notificationsEnabled} onChange={e => setProfileForm({...profileForm, notificationsEnabled: e.target.checked})} className="rounded bg-neutral-950 border-neutral-800" />
                Enable Browser Notifications
              </label>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-400">Preferred AI Coach Theme</label>
              <select value={profileForm.themePreference} onChange={e => setProfileForm({...profileForm, themePreference: e.target.value})} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm mt-1 text-white">
                <option value="default">Default (Direct & Analytical)</option>
                <option value="gentle">Gentle (Encouraging & Soft)</option>
                <option value="strict">Strict (Tough Love & Pushy)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-between">
              <button onClick={handleUpdateProfile} className="bg-brand-purple hover:bg-brand-purple-dark text-white px-4 py-2 rounded-lg text-sm font-bold transition">
                Save Changes
              </button>
              <button onClick={handleLogout} className="bg-red-950 text-red-400 hover:bg-red-900 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </AnimatedModal>\`,
  \`        <AnimatedModal isOpen={showFocusModal} onClose={() => setShowFocusModal(false)} title={<span className="flex items-center gap-2"><Brain className="w-5 h-5 text-brand-teal" /> Recommended Focus Schedule</span>}>
          <p className="text-xs text-neutral-400 mb-6">Generated based on your work hours and active deadlines.</p>
          
          <div className="overflow-y-auto space-y-3 flex-grow pr-2 max-h-96">
            {focusBlocks.map((block, i) => (
              <div key={i} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                  <span className="text-[10px] font-bold text-brand-teal uppercase tracking-widest block mb-1">
                    {block.timeSlot}
                  </span>
                  <h4 className="font-bold text-white text-sm">{block.taskName}</h4>
                  <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">{block.reason}</p>
                </div>
                <span className={\\\`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 \\\${
                  block.type === 'deep-work' ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30' :
                  block.type === 'admin' ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' :
                  'bg-brand-coral/20 text-brand-coral border border-brand-coral/30'
                }\\\`}>
                  {block.type.replace('-', ' ')}
                </span>
              </div>
            ))}
          </div>
          
          <div className="pt-4 mt-2 border-t border-neutral-800">
            <button onClick={() => setShowFocusModal(false)} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded-lg transition text-sm">
              Got it, let's work
            </button>
          </div>
        </AnimatedModal>\`
];

for(let i=0; i<3; i++){
  content = content.replace(oldModals[i], newModals[i]);
}

// 2. Toast UI and State
const toastStateDef = \`  const [suggestedBreakdown, setSuggestedBreakdown] = useState<any[]>([]);
  const [selectedBreakdownTasks, setSelectedBreakdownTasks] = useState<{[key: number]: boolean}>({});
  
  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'info'|'success'|'error'} | null>(null);
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };\`;
content = content.replace(\`  const [suggestedBreakdown, setSuggestedBreakdown] = useState<any[]>([]);
  const [selectedBreakdownTasks, setSelectedBreakdownTasks] = useState<{[key: number]: boolean}>({});\`, toastStateDef);

const rootDivMatch = content.match(/<div className="flex-grow flex flex-col bg-neutral-950[^>]*>/);
if (rootDivMatch) {
  const toastJSX = \`
      {/* Toast Notification Overlay */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
          <div className={\\\`px-6 py-3 rounded-lg shadow-lg border backdrop-blur-md whitespace-pre-wrap \\\${
            toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-100' :
            toast.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-100' :
            'bg-brand-purple/20 border-brand-purple/50 text-brand-purple-100'
          }\\\`}>
            {toast.message}
          </div>
        </div>
      )}
\`;
  content = content.replace(rootDivMatch[0], rootDivMatch[0] + toastJSX);
}

// 3. Alerts replacement exact mappings
const alertMappings = {
  "alert(data.error || 'Failed updating profile');": "showToast(data.error || 'Failed updating profile', 'error');",
  "alert('Settings updated successfully!');": "showToast('Settings updated successfully!', 'success');",
  "alert('Failed updating profile settings');": "showToast('Failed updating profile settings', 'error');",
  "alert(err.message);": "showToast(err.message, 'error');",
  "alert('Failed to delete item.');": "showToast('Failed to delete item.', 'error');",
  "alert('AI task prioritization complete! Tasks have been reordered and AI priority badges applied.');": "showToast('AI task prioritization complete! Tasks have been reordered and AI priority badges applied.', 'success');",
  "alert('AI prioritize failed. Check server console.');": "showToast('AI prioritize failed. Check server console.', 'error');",
  "alert('Weekly Debrief generated successfully!');": "showToast('Weekly Debrief generated successfully!', 'success');",
  "alert('Failed generating debrief');": "showToast('Failed generating debrief', 'error');",
  "alert('Monthly Productivity Report generated successfully!');": "showToast('Monthly Productivity Report generated successfully!', 'success');",
  "alert('Failed generating monthly report');": "showToast('Failed generating monthly report', 'error');",
  "alert(e.message || 'Mood reprioritization failed');": "showToast(e.message || 'Mood reprioritization failed', 'error');",
  "alert('Failed to get focus block suggestions.');": "showToast('Failed to get focus block suggestions.', 'error');",
  "alert(e.message || 'Failed task breakdown generation.');": "showToast(e.message || 'Failed task breakdown generation.', 'error');",
  "alert('Please check at least one suggested task.');": "showToast('Please check at least one suggested task.', 'info');",
  "alert('Suggested tasks added to project successfully!');": "showToast('Suggested tasks added to project successfully!', 'success');",
  "alert('Failed adding suggested tasks.');": "showToast('Failed adding suggested tasks.', 'error');"
};

for (const [oldAlert, newToast] of Object.entries(alertMappings)) {
  content = content.replaceAll(oldAlert, newToast);
}

// Handle multi-line alert for Top 3 Planned Actions
const oldTop3 = \`alert(\\\`Today's Top 3 Planned Actions:\\\\n\\\\n\\\` + 
                      aiActions.map((a, i) => \\\`\\\${i+1}. \\\${a.name} (\\\${a.estimate})\\\\n   Reason: \\\${a.reason}\\\`).join('\\\\n\\\\n')
                    );\`;
const newTop3 = \`showToast(\\\`Today's Top 3 Planned Actions:\\\\n\\\\n\\\` + 
                      aiActions.map((a, i) => \\\`\\\${i+1}. \\\${a.name} (\\\${a.estimate})\\\\n   Reason: \\\${a.reason}\\\`).join('\\\\n\\\\n')
                    , 'info');\`;
content = content.replace(oldTop3, newTop3);

// Handle Project Health Details alert
const oldHealth = \`alert(\\\`\\\${project.name} Health Details:\\\\n\\\\n\\\${(project as any).healthDetails}\\\`);\`;
const newHealth = \`showToast(\\\`\\\${project.name} Health Details:\\\\n\\\\n\\\${(project as any).healthDetails}\\\`, 'info');\`;
content = content.replace(oldHealth, newHealth);

fs.writeFileSync(path, content, 'utf8');
console.log('All fixes applied cleanly.');

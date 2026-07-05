import os

path = r"c:\files\projects\Maja\src\app\dashboard\page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Toast State
toast_state_def = """  const [suggestedBreakdown, setSuggestedBreakdown] = useState<any[]>([]);
  const [selectedBreakdownTasks, setSelectedBreakdownTasks] = useState<{[key: number]: boolean}>({});
  
  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'info'|'success'|'error'} | null>(null);
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };"""

content = content.replace("""  const [suggestedBreakdown, setSuggestedBreakdown] = useState<any[]>([]);
  const [selectedBreakdownTasks, setSelectedBreakdownTasks] = useState<{[key: number]: boolean}>({});""", toast_state_def)

# Toast Overlay JSX
toast_jsx = """      {/* Toast Notification Overlay */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-lg border backdrop-blur-md whitespace-pre-wrap ${
            toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-100' :
            toast.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-100' :
            'bg-brand-purple/20 border-brand-purple/50 text-brand-purple-100'
          }`}>
            {toast.message}
          </div>
        </div>
      )}
"""

content = content.replace(r'<div className="flex-grow flex flex-col bg-neutral-950 text-neutral-100 max-w-5xl mx-auto w-full min-h-screen relative pb-24 shadow-2xl">', 
r'<div className="flex-grow flex flex-col bg-neutral-950 text-neutral-100 max-w-5xl mx-auto w-full min-h-screen relative pb-24 shadow-2xl">' + "\n" + toast_jsx)

# Alerts to Replace
mappings = {
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
  "alert('Failed adding suggested tasks.');": "showToast('Failed adding suggested tasks.', 'error');",
  
  # Health Details
  "alert(`${project.name} Health Details:\\n\\n${(project as any).healthDetails}`);": "showToast(`${project.name} Health Details:\\n\\n${(project as any).healthDetails}`, 'info');"
}

for k, v in mappings.items():
    content = content.replace(k, v)

# Multiline Top 3
old_top3 = """alert(`Today's Top 3 Planned Actions:\\n\\n` + 
                      aiActions.map((a, i) => `${i+1}. ${a.name} (${a.estimate})\\n   Reason: ${a.reason}`).join('\\n\\n')
                    );"""
new_top3 = """showToast(`Today's Top 3 Planned Actions:\\n\\n` + 
                      aiActions.map((a, i) => `${i+1}. ${a.name} (${a.estimate})\\n   Reason: ${a.reason}`).join('\\n\\n')
                    , 'info');"""
content = content.replace(old_top3, new_top3)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Applied Toast fixes successfully.")

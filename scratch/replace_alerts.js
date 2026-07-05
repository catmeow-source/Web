const fs = require('fs');
const path = 'c:\\files\\projects\\Maja\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add toast state
if (!content.includes('const [toast, setToast]')) {
  // Find a good place to insert it. E.g., below 'const [loading, setLoading] = useState(true);'
  content = content.replace(
    'const [loading, setLoading] = useState(true);',
    "const [loading, setLoading] = useState(true);\n  const [toast, setToast] = useState<{message: string, type: 'info' | 'success' | 'error'} | null>(null);\n\n  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {\n    setToast({ message, type });\n    setTimeout(() => setToast(null), 4000);\n  };"
  );
}

// 2. Add toast UI element
if (!content.includes('Toast Notification Overlay')) {
  // Add it right before the last closing `</div>` in the return statement or before `<AnimatedModal`.
  // Let's insert it right after `<div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-200 font-sans">` or similar root div.
  // Actually, better to place it just inside the root div.
  // The root div has `className="flex h-screen overflow-hidden...`
  const rootDivMatch = content.match(/<div className="flex-grow flex flex-col bg-neutral-950[^>]*>/);
  if (rootDivMatch) {
    const toastJSX = `
      {/* Toast Notification Overlay */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
          <div className={\`px-6 py-3 rounded-lg shadow-lg border backdrop-blur-md whitespace-pre-wrap \${
            toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-100' :
            toast.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-100' :
            'bg-brand-purple/20 border-brand-purple/50 text-brand-purple-100'
          }\`}>
            {toast.message}
          </div>
        </div>
      )}
    `;
    content = content.replace(rootDivMatch[0], rootDivMatch[0] + toastJSX);
  }
}

// 3. Replace all alert(...) with showToast(...)
// Need to handle different types of alerts based on text
// If it contains 'failed' or 'error' -> error
// If it contains 'success' -> success
// Otherwise -> info

content = content.replace(/alert\(([\s\S]*?)\)/g, (match, p1) => {
  let type = "'info'";
  const lower = p1.toLowerCase();
  if (lower.includes('fail') || lower.includes('error') || lower.includes('err.')) {
    type = "'error'";
  } else if (lower.includes('success') || lower.includes('complete')) {
    type = "'success'";
  }
  return 'showToast(' + p1 + ', ' + type + ')';
});

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully replaced alerts with toast notifications!');

const fs = require('fs');
const path = 'c:\\files\\projects\\Maja\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file currently has both buttons DELETED!
// Wait, looking at the diff:
//                 <button 
//                   onClick={fetchAiRecommendations}
//                   onClick={handleFetchFocusBlocks}
//
// So it merged the first button's start with the third button's end!
// Let's restore the whole block.

const exactBadText = \`                <button 
                  onClick={fetchAiRecommendations}
                  onClick={handleFetchFocusBlocks}
                  disabled={loadingFocus}\`;

const exactGoodText = \`                <button 
                  onClick={fetchAiRecommendations}
                  disabled={loadingAi}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition disabled:opacity-50"
                >
                  {loadingAi ? 'Calculating...' : 'Recalculate Focus'}
                </button>
                <button 
                  onClick={() => {
                    showToast(\`Today's Top 3 Planned Actions:\\n\\n\` + 
                      aiActions.map((a, i) => \`\${i+1}. \${a.name} (\${a.estimate})\\n   Reason: \${a.reason}\`).join('\\n\\n')
                    , 'info');
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-amber to-brand-coral text-white transition hover:opacity-95"
                >
                  Show Today's Top 3
                </button>
                {/* Focus Block Suggester (AI 12) */}
                <button 
                  onClick={handleFetchFocusBlocks}
                  disabled={loadingFocus}\`;

content = content.replace(exactBadText, exactGoodText);
fs.writeFileSync(path, content, 'utf8');
console.log('Restored buttons correctly.');

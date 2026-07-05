const fs = require('fs');
const path = 'c:\\files\\projects\\Maja\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix the top button area
const badTopText = \`                <button 
                  onClick={fetchAiRecommendations}
                  disabled={loadingAi}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition disabled:opacity-50"
                {/* Focus Block Suggester (AI 12) */}
                <button \`;

const goodTopText = \`                <button 
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
                <button \`;

content = content.replace(badTopText, goodTopText);

// 2. Fix the bottom button area that got accidentally replaced
const badBottomText = \`                  disabled={generatingReport}
                  className="px-3 py-1 rounded-lg bg-brand-amber/10 border border-brand-amber/20 text-brand-amber text-[10px] font-bold uppercase tracking-wider hover:bg-brand-amber/20 transition disabled:opacity-50"
                >
                  {loadingAi ? 'Calculating...' : 'Recalculate Focus'}
                </button>
                <button 
                  onClick={() => {
                    showToast(\\\`Today's Top 3 Planned Actions:\\\\n\\\\n\\\` + 
                      aiActions.map((a, i) => \\\`\\\${i+1}. \\\${a.name} (\\\${a.estimate})\\\\n   Reason: \\\${a.reason}\\\`).join('\\\\n\\\\n')
                    );
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-amber to-brand-coral text-white transition hover:opacity-95"
                >
                  Show Today's Top 3
                </button>
                {/* Focus Block Suggester (AI 12) */}
              </div>\`;

// Actually regex might be safer to fix the bottom area since backticks can be tricky.
// Let's replace using regex for the bottom area.
// We are looking for:
// >
//   {loadingAi ? 'Calculating...' : 'Recalculate Focus'}
// </button>
// ...
// {/* Focus Block Suggester (AI 12) */}

const bottomMatchRegex = />\\s*\\{loadingAi \? 'Calculating\.\.\.' : 'Recalculate Focus'\\}\\s*<\/button>\\s*<button[^>]*>\\s*Show Today's Top 3\\s*<\/button>\\s*\{\/\* Focus Block Suggester \(AI 12\) \*\/\}/s;

const bottomReplacement = \`>
                  {generatingReport ? 'Generating...' : '+ Generate'}
                </button>\`;

// First we can split by "disabled={generatingReport}" and fix the second half
let parts = content.split('disabled={generatingReport}');
if (parts.length > 1) {
  let afterGeneratingReport = parts[1];
  afterGeneratingReport = afterGeneratingReport.replace(bottomMatchRegex, bottomReplacement);
  content = parts[0] + 'disabled={generatingReport}' + afterGeneratingReport;
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed page.tsx button issues');

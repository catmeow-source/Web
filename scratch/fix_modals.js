const fs = require('fs');

const path = 'c:\\files\\projects\\Maja\\src\\app\\dashboard\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { AnimatedModal }')) {
  content = content.replace(
    "import { applyTheme, THEMES } from '@/lib/themes';",
    "import { applyTheme, THEMES } from '@/lib/themes';\nimport { AnimatedModal } from '@/components/AnimatedModal';"
  );
}

const replacements = [
  {
    find: '{showNotifications && (',
    replaceStart: '<AnimatedModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} position="right">',
    divToRemove: '<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in" onClick={() => setShowNotifications(false)}>'
  },
  {
    find: '{showProfile && user && (',
    replaceStart: '<AnimatedModal isOpen={showProfile && !!user} onClose={() => setShowProfile(false)} position="right">',
    divToRemove: '<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setShowProfile(false)}>'
  },
  {
    find: '{showFocusModal && (',
    replaceStart: '<AnimatedModal isOpen={showFocusModal} onClose={() => setShowFocusModal(false)} position="center">',
    divToRemove: '<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowFocusModal(false)}>'
  },
  {
    find: '{showAbout && (',
    replaceStart: '<AnimatedModal isOpen={showAbout} onClose={() => setShowAbout(false)} position="right">',
    divToRemove: '<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setShowAbout(false)}>'
  },
  {
    find: "{modalType !== '' && (",
    replaceStart: "<AnimatedModal isOpen={modalType !== ''} onClose={() => setModalType('')} position=\"center\">",
    divToRemove: '<div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">'
  }
];

let lines = content.split('\n');

for (const rep of replacements) {
  let startIdx = lines.findIndex(l => l.includes(rep.find));
  if (startIdx === -1) continue;

  // The next line should be the divToRemove
  let divIdx = startIdx + 1;
  while (!lines[divIdx].includes('<div className="fixed inset-0')) {
    divIdx++;
  }

  // Find the closing brace for this condition block
  let depth = 0;
  let endIdx = -1;
  for (let i = divIdx; i < lines.length; i++) {
    const l = lines[i];
    const opens = (l.match(/<div/g) || []).length + (l.match(/<form/g) || []).length;
    const closes = (l.match(/<\/div/g) || []).length + (l.match(/<\/form/g) || []).length;
    depth += opens;
    depth -= closes;
    
    if (depth === 0 && l.trim() === ')}') {
      endIdx = i;
      break;
    }
  }

  if (endIdx !== -1) {
    // Replace start
    lines[startIdx] = lines[startIdx].replace(rep.find, rep.replaceStart);
    lines[divIdx] = ''; // remove the outer div
    
    // Replace end. The closing tag right before `)}` is the `</div>` for the overlay.
    let closeDivIdx = endIdx - 1;
    while (!lines[closeDivIdx].includes('</div>')) {
      closeDivIdx--;
    }
    lines[closeDivIdx] = lines[closeDivIdx].replace('</div>', '</AnimatedModal>');
    lines[endIdx] = lines[endIdx].replace(')}', ''); // remove `)}`
  }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Successfully updated page.tsx with AnimatedModal!');

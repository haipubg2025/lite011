const fs = require('fs');
const filesToProcess = [
  'src/components/StatusModal.tsx',
  'src/components/Saves.tsx',
  'src/components/Settings.tsx',
  'src/components/Gallery.tsx',
  'src/components/WorldCreation.tsx',
  'src/components/Gameplay.tsx',
  'src/components/ErrorLogPanel.tsx',
  'src/components/StreamStatsPanel.tsx'
];

filesToProcess.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace light theme amber background classes
    content = content.replace(/bg-amber-100(\/\d+)?/g, 'bg-black/5');
    content = content.replace(/bg-amber-50(\/\d+)?/g, 'bg-white/50');
    content = content.replace(/bg-amber-500\/5/g, 'bg-black/5');
    content = content.replace(/bg-amber-500\/10/g, 'bg-black/10');
    content = content.replace(/bg-amber-200(\/\d+)?/g, 'bg-black/10');
    
    // Replace hover backgrounds
    content = content.replace(/hover:bg-amber-[12345]00(\/\d+)?/g, 'hover:bg-black/10');
    
    // Replace borders
    content = content.replace(/border-amber-[1234]00(\/\d+)?/g, 'border-black/10');
    content = content.replace(/border-amber-250/g, 'border-black/10');
    
    // Replace specific hex colors to generic slates
    content = content.replace(/#5C4033/g, '#334155'); // slate-700
    content = content.replace(/#3E2723/g, '#0f172a'); // slate-900
    
    // Replace text-amber-*
    content = content.replace(/text-amber-\d00/g, 'text-slate-700');
    
    // Replace panel backgrounds
    content = content.replace(/bg-\[#FFFDF9\](\/\d+)?/g, 'bg-white/60');
    content = content.replace(/bg-\[#FFFDFB\](\/\d+)?/g, 'bg-white/80');
    
    // Handle specific solid ambers used incorrectly in light mode for active states
    content = content.replace(/bg-amber-[67]00/g, 'bg-slate-800');
    content = content.replace(/hover:bg-amber-[67]00/g, 'hover:bg-slate-900');
    
    fs.writeFileSync(file, content);
  }
});
console.log('Colors replaced successfully.')

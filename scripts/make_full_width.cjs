const fs = require('fs');

function makeFullWidth(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/max-w-md mx-auto/g, 'w-full max-w-2xl mx-auto');
  content = content.replace(/space-y-4 max-w-md mx-auto/g, 'space-y-4 w-full');
  fs.writeFileSync(filePath, content, 'utf8');
}

['src/App.tsx', 'src/components/Navbar.tsx', 'src/components/BottomNavigation.tsx', 'src/components/ConverterTab.tsx', 'src/components/BankFeeCalculatorTab.tsx', 'src/components/HistoricalChartsTab.tsx', 'src/components/DebugTab.tsx', 'src/components/SourcesTab.tsx'].forEach(makeFullWidth);

// Also clean any remaining blue classes in SettingsModal and DebugTab
let settingsModal = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
settingsModal = settingsModal.replace(/text-blue-400/g, 'text-amber-400');
settingsModal = settingsModal.replace(/bg-blue-600/g, 'bg-amber-500');
settingsModal = settingsModal.replace(/hover:bg-blue-500/g, 'hover:bg-amber-400 text-slate-950');
settingsModal = settingsModal.replace(/shadow-blue-600\/20/g, 'shadow-amber-500/20');
fs.writeFileSync('src/components/SettingsModal.tsx', settingsModal, 'utf8');

let debugTab = fs.readFileSync('src/components/DebugTab.tsx', 'utf8');
debugTab = debugTab.replace(/text-blue-400/g, 'text-amber-400');
fs.writeFileSync('src/components/DebugTab.tsx', debugTab, 'utf8');

console.log('Full width responsive layout and theme cleanup applied across all components');

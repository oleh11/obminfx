const fs = require('fs');

const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
  }
  
  body {
    overscroll-behavior-y: none;
    touch-action: pan-x pan-y;
  }
}

/* Animations */
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}

/* Hide scrollbar for clean mobile UI */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Mobile Safe Area Padding */
.safe-area-pt {
  padding-top: max(env(safe-area-inset-top, 0px), 36px);
}

.safe-area-pb {
  padding-bottom: max(env(safe-area-inset-bottom, 0px), 16px);
}
`;
fs.writeFileSync('src/index.css', indexCss, 'utf8');

const navbarContent = [
  'import React from "react";',
  'import { StorageService } from "../services/storageService";',
  'import { RefreshCw, Globe, Settings, WifiOff } from "lucide-react";',
  'import { RateSourceId } from "../types/currency";',
  'import { AVAILABLE_SOURCES } from "../data/currencies";',
  '',
  'interface NavbarProps {',
  '  activeSourceId: RateSourceId;',
  '  onOpenSourceModal: () => void;',
  '  onOpenSettingsModal: () => void;',
  '  onRefreshRates: () => void;',
  '  isRefreshing: boolean;',
  '  isOnline: boolean;',
  '}',
  '',
  'export const Navbar: React.FC<NavbarProps> = ({',
  '  activeSourceId,',
  '  onOpenSourceModal,',
  '  onOpenSettingsModal,',
  '  onRefreshRates,',
  '  isRefreshing,',
  '  isOnline',
  '}) => {',
  '  const currentSource = AVAILABLE_SOURCES.find(s => s.id === activeSourceId) || AVAILABLE_SOURCES[0];',
  '',
  '  return (',
  '    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 pb-3 safe-area-pt transition-colors shadow-md">',
  '      <div className="max-w-md mx-auto flex items-center justify-between">',
  '        {/* App Title & Brand (ObminFX - Ukrainian for Exchange) */}',
  '        <div className="flex items-center gap-2.5">',
  '          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-400 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-xl">',
  '            ₴',
  '          </div>',
  '          <div>',
  '            <div className="flex items-center gap-1.5">',
  '              <h1 className="text-lg font-black tracking-tight text-white">Obmin<span className="text-amber-400">FX</span></h1>',
  '              <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">',
  '                🇺🇦 M3',
  '              </span>',
  '            </div>',
  '            <p className="text-[11px] font-medium text-slate-400">',
  '              {currentSource.shortName}',
  '            </p>',
  '          </div>',
  '        </div>',
  '',
  '        {/* Right Controls */}',
  '        <div className="flex items-center gap-2">',
  '          {/* Source Selector Pill Button */}',
  '          <button',
  '            onClick={() => {',
  '              StorageService.triggerHaptic();',
  '              onOpenSourceModal();',
  '            }}',
  '            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all shadow-sm"',
  '            title="Change exchange rate source"',
  '          >',
  '            <Globe className="w-3.5 h-3.5 text-blue-400" />',
  '            <span>Sources</span>',
  '          </button>',
  '',
  '          {/* Refresh Button */}',
  '          <button',
  '            onClick={() => {',
  '              StorageService.triggerHaptic();',
  '              onRefreshRates();',
  '            }}',
  '            disabled={isRefreshing}',
  '            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition-all disabled:opacity-50 border border-slate-700/60"',
  '            title="Refresh exchange rates"',
  '          >',
  '            <RefreshCw className={"w-4 h-4 " + (isRefreshing ? "animate-spin text-amber-400" : "")} />',
  '          </button>',
  '',
  '          {/* Settings Button */}',
  '          <button',
  '            onClick={() => {',
  '              StorageService.triggerHaptic();',
  '              onOpenSettingsModal();',
  '            }}',
  '            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition-all border border-slate-700/60"',
  '            title="App settings"',
  '          >',
  '            <Settings className="w-4 h-4 text-slate-300" />',
  '          </button>',
  '        </div>',
  '      </div>',
  '',
  '      {/* Connectivity & Offline Status Bar */}',
  '      {!isOnline && (',
  '        <div className="mt-2 py-1 px-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-center gap-1.5 text-xs text-amber-300 font-medium animate-pulse">',
  '          <WifiOff className="w-3.5 h-3.5" /> Working offline with cached rates',
  '        </div>',
  '      )}',
  '    </header>',
  '  );',
  '};'
].join('\n');

fs.writeFileSync('src/components/Navbar.tsx', navbarContent, 'utf8');
console.log('Navbar and index.css written successfully');

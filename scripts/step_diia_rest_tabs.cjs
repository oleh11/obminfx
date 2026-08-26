const fs = require('fs');

// 1. AddCurrencyModal.tsx
let modal = fs.readFileSync('src/components/AddCurrencyModal.tsx', 'utf8');
modal = modal.replace(/bg-amber-500/g, 'bg-[#E2F163]');
modal = modal.replace(/text-amber-400/g, 'text-[#E2F163]');
modal = modal.replace(/text-amber-300/g, 'text-[#E2F163]');
modal = modal.replace(/fill-amber-400/g, 'fill-[#E2F163]');
modal = modal.replace(/border-amber-500\/20/g, 'border-[#E2F163]/25');
modal = modal.replace(/ring-amber-500\/50/g, 'ring-[#E2F163]/50');
modal = modal.replace(/shadow-amber-500\/25/g, 'shadow-[#E2F163]/25');
fs.writeFileSync('src/components/AddCurrencyModal.tsx', modal, 'utf8');

// 2. BankFeeCalculatorTab.tsx
let fee = fs.readFileSync('src/components/BankFeeCalculatorTab.tsx', 'utf8');
fee = fee.replace(/bg-amber-500\/15/g, 'bg-[#E2F163]/15');
fee = fee.replace(/bg-amber-500\/20/g, 'bg-[#E2F163]/20');
fee = fee.replace(/text-amber-400/g, 'text-[#E2F163]');
fee = fee.replace(/text-amber-300/g, 'text-[#E2F163]');
fee = fee.replace(/border-amber-400\/25/g, 'border-[#E2F163]/25');
fee = fee.replace(/border-amber-500\/30/g, 'border-[#E2F163]/30');
fee = fee.replace(/border-amber-500\/40/g, 'border-[#E2F163]/40');
fee = fee.replace(/accent-amber-400/g, 'accent-[#E2F163]');
fs.writeFileSync('src/components/BankFeeCalculatorTab.tsx', fee, 'utf8');

// 3. DebugTab.tsx
let debug = fs.readFileSync('src/components/DebugTab.tsx', 'utf8');
debug = debug.replace(/bg-amber-500/g, 'bg-[#E2F163]');
debug = debug.replace(/text-amber-400/g, 'text-[#E2F163]');
debug = debug.replace(/text-amber-300/g, 'text-[#E2F163]');
debug = debug.replace(/fill-amber-400/g, 'fill-[#E2F163]');
debug = debug.replace(/border-amber-400\/25/g, 'border-[#E2F163]/25');
debug = debug.replace(/text-amber-300\/90/g, 'text-[#E2F163]/90');
fs.writeFileSync('src/components/DebugTab.tsx', debug, 'utf8');

// 4. SourcesTab.tsx
let sources = fs.readFileSync('src/components/SourcesTab.tsx', 'utf8');
sources = sources.replace(/bg-amber-500/g, 'bg-[#E2F163]');
sources = sources.replace(/text-amber-400/g, 'text-[#E2F163]');
sources = sources.replace(/text-amber-300/g, 'text-[#E2F163]');
sources = sources.replace(/border-amber-400\/25/g, 'border-[#E2F163]/25');
sources = sources.replace(/border-amber-500/g, 'border-[#E2F163]');
sources = sources.replace(/ring-amber-500/g, 'ring-[#E2F163]');
sources = sources.replace(/shadow-amber-500/g, 'shadow-[#E2F163]');
fs.writeFileSync('src/components/SourcesTab.tsx', sources, 'utf8');

console.log('All remaining tabs unified under Diia styling');

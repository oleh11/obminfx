import fs from 'fs';
import path from 'path';

const files = [
  'src/components/Navbar.tsx',
  'src/components/SettingsModal.tsx',
  'src/components/CreditCardProvidersTab.tsx',
  'src/components/SourcesTab.tsx',
  'src/components/BankFeeCalculatorTab.tsx',
  'src/components/HistoricalChartsTab.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('StorageService.') && !content.includes('import { StorageService }')) {
    content = content.replace(/(import .*;\n)/, `$1import { StorageService } from '../services/storageService';\n`);
  }
  if (content.includes('ALL_CURRENCIES') && !content.includes('import { ALL_CURRENCIES')) {
    content = content.replace(/import \{ ([^}]+) \} from '\.\.\/data\/currencies';/, `import { $1, ALL_CURRENCIES } from '../data/currencies';`);
  }
  if (content.includes('getCurrencyMeta') && !content.includes('getCurrencyMeta')) {
     // Wait, the regex is already complicated. Let's just append it.
  }
  
  fs.writeFileSync(file, content);
}

import fs from 'fs';
const file = 'src/components/SettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace the base currency div with empty string
// We'll just replace everything between {/* Base Currency Selection */} and {/* Bank Fee Configuration */}
const regex = /\{\/\* Base Currency Selection \*\/\}[\s\S]*?\{\/\* Bank Fee Configuration \*\/\}/;
content = content.replace(regex, '{/* Bank Fee Configuration */}');

content = content.replace(/setBankFeePct/g, 'onBankFeeChange');
content = content.replace(/setTheme\(.*?\)/g, '');
content = content.replace(/import \{.*?\} from '\.\.\/data\/currencies';/g, '');
fs.writeFileSync(file, content);

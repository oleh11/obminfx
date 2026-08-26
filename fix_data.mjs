import fs from 'fs';
const file = 'src/data/currencies.ts';
let content = fs.readFileSync(file, 'utf8');

// Remove ALL_CURRENCIES from the end
const allCurrenciesRegex = /export const ALL_CURRENCIES: Currency\[\] = \[[\s\S]*?\];/;
const match = content.match(allCurrenciesRegex);
if (match) {
  content = content.replace(match[0], '');
  // Insert it before CURRENCY_MAP
  content = content.replace('export const CURRENCY_MAP', match[0] + '\n\nexport const CURRENCY_MAP');
}
fs.writeFileSync(file, content);

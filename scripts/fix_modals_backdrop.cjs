const fs = require('fs');

let addModal = fs.readFileSync('src/components/AddCurrencyModal.tsx', 'utf8');
addModal = addModal.replace(
  'animate-fade-in p-0 sm:p-4">',
  'animate-fade-in p-0 sm:p-4" onClick={onClose}>'
);
fs.writeFileSync('src/components/AddCurrencyModal.tsx', addModal, 'utf8');

let srcModal = fs.readFileSync('src/components/SourceSelectorModal.tsx', 'utf8');
srcModal = srcModal.replace(
  'animate-fade-in">',
  'animate-fade-in" onClick={onClose}>'
);
fs.writeFileSync('src/components/SourceSelectorModal.tsx', srcModal, 'utf8');

console.log('Added backdrop dismissal to AddCurrencyModal and SourceSelectorModal');

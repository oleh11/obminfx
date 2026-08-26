const fs = require('fs');
let s = fs.readFileSync('src/components/AddCurrencyModal.tsx', 'utf8');
s = s.replace('placeholder="Search Vietnam (VND), Canada (CAD), Euro...",', 'placeholder="Search Vietnam (VND), Canada (CAD), Euro..."');
fs.writeFileSync('src/components/AddCurrencyModal.tsx', s, 'utf8');
console.log('Fixed trailing comma in AddCurrencyModal.tsx');

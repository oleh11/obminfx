import fs from 'fs';

// Fix BottomNavigation
let bn = fs.readFileSync('src/components/BottomNavigation.tsx', 'utf8');
bn = bn.replace(/CreditCardList/g, 'CreditCard');
fs.writeFileSync('src/components/BottomNavigation.tsx', bn);

// Fix ConverterTab duplicate sx
let cv = fs.readFileSync('src/components/ConverterTab.tsx', 'utf8');
cv = cv.replace(/sx=\{\{ fontWeight: "bold" \}\} sx=\{\{ letterSpacing: 1\.5 \}\}/g, 'sx={{ fontWeight: "bold", letterSpacing: 1.5 }}');
cv = cv.replace(/sx=\{\{ fontWeight: "bold" \}\} sx=\{\{ fontFamily: 'monospace' \}\}/g, 'sx={{ fontWeight: "bold", fontFamily: "monospace" }}');
cv = cv.replace(/sx=\{\{ fontWeight: "medium" \}\} sx=\{\{ display: 'block', mt: 0\.5 \}\}/g, 'sx={{ fontWeight: "medium", display: "block", mt: 0.5 }}');
fs.writeFileSync('src/components/ConverterTab.tsx', cv);

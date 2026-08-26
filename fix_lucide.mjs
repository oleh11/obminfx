import fs from 'fs';
const file = 'src/components/CreditCardProvidersTab.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/CardCheck|CreditCardList/g, 'CreditCard');
content = content.replace(/ArrowRightLeft/g, 'RefreshCw');
content = content.replace(/Sparkles|ShieldCheck/g, 'Shield');
content = content.replace(/Layers/g, 'CreditCard');
content = content.replace(/hasFees &&/g, 'true &&');
content = content.replace(/onTabChange = false;/g, '');

fs.writeFileSync(file, content);

const file2 = 'src/components/SettingsModal.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/GridLines|Layer|Line/g, 'Menu');
fs.writeFileSync(file2, content2);

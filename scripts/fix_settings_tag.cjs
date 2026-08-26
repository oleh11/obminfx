const fs = require('fs');
let s = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
s = s.replace('</button\n          </div>', '</button>\n        </div>');
s = s.replace('</button\r\n          </div>', '</button>\r\n        </div>');
s = s.replace('</button', '</button>');
fs.writeFileSync('src/components/SettingsModal.tsx', s, 'utf8');
console.log('SettingsModal.tsx fixed');

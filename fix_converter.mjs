import fs from 'fs';
const file = 'src/components/ConverterTab.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/fontWeight="bold"/g, 'sx={{ fontWeight: "bold" }}');
content = content.replace(/fontWeight="medium"/g, 'sx={{ fontWeight: "medium" }}');
content = content.replace(/alignItems="center"/g, '');
content = content.replace(/justifyContent="space-between"/g, '');
content = content.replace(/justifyContent="flex-end"/g, '');
content = content.replace(/flexWrap="wrap"/g, '');
content = content.replace(/useFlexGap/g, '');

fs.writeFileSync(file, content);

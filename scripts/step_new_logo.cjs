const fs = require('fs');

// 1. Android Adaptive Icon Background (drawable/ic_launcher_background.xml)
const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <!-- Deep Obsidian Matte Surface -->
    <path
        android:fillColor="#0E121B"
        android:pathData="M0,0h108v108h-108z" />
    
    <!-- Outer Precision Bezel -->
    <path
        android:fillColor="#1B2232"
        android:pathData="M54,54m-44,0a44,44 0 1,1 88,0a44,44 0 1,1 -88,0" />

    <!-- Inner Radial Core -->
    <path
        android:fillColor="#242E42"
        android:pathData="M54,54m-34,0a34,34 0 1,1 68,0a34,34 0 1,1 -68,0" />
</vector>
`;
fs.writeFileSync('android/app/src/main/res/drawable/ic_launcher_background.xml', bgXml, 'utf8');

// 2. Android Adaptive Icon Foreground (drawable/ic_launcher_foreground.xml)
const fgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    
    <!-- Outer Gold Ring -->
    <path
        android:fillColor="#D97706"
        android:pathData="M54,20 C72.78,20 88,35.22 88,54 C88,72.78 72.78,88 54,88 C35.22,88 20,72.78 20,54 C20,35.22 35.22,20 54,20 Z M54,26 C38.54,26 26,38.54 26,54 C26,69.46 38.54,82 54,82 C69.46,82 82,69.46 82,54 C82,38.54 69.46,26 54,26 Z" />

    <!-- Left Exchange Geometric Facet (Vivid Gold) -->
    <path
        android:fillColor="#F59E0B"
        android:pathData="M32,54 L54,32 L54,54 Z" />

    <!-- Right Exchange Geometric Facet (Champagne Amber) -->
    <path
        android:fillColor="#FBBF24"
        android:pathData="M76,54 L54,76 L54,54 Z" />

    <!-- Top Counter-Facet (Warm Ivory) -->
    <path
        android:fillColor="#FEF3C7"
        android:pathData="M54,32 L76,54 L54,54 Z" />

    <!-- Bottom Counter-Facet (Deep Honey) -->
    <path
        android:fillColor="#B45309"
        android:pathData="M54,76 L32,54 L54,54 Z" />

    <!-- Center Minted Currency Glyph ₴ in Crisp White -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M50,41 C54,41 57,44 57,47 C57,50 55,52 52,53 C55,54 58,56 58,60 C58,64 54,67 49,67 L45,67 L45,63 L49,63 C52,63 54,61 54,59 C54,57 52,55 48,55 L46,55 L46,52 L49,52 C52,52 53,50 53,48 C53,46 51,44 48,44 L45,44 L45,41 L50,41 Z" />
    
    <!-- ₴ Horizontal Crossbars -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M42,48 L62,48 L62,50.5 L42,50.5 Z" />
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M42,55 L62,55 L62,57.5 L42,57.5 Z" />
</vector>
`;

fs.writeFileSync('android/app/src/main/res/drawable/ic_launcher_foreground.xml', fgXml, 'utf8');
if (fs.existsSync('android/app/src/main/res/drawable-v24')) {
  fs.writeFileSync('android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml', fgXml, 'utf8');
}

// 3. Update index.html Favicon
const svgFavicon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 108 108'><rect width='108' height='108' rx='28' fill='%230E121B'/><circle cx='54' cy='54' r='36' fill='none' stroke='%23D97706' stroke-width='6'/><path d='M32 54l22-22v22z' fill='%23F59E0B'/><path d='M76 54l-22 22V54z' fill='%23FBBF24'/><path d='M54 32l22 22H54z' fill='%23FEF3C7'/><path d='M54 76L32 54h22z' fill='%23B45309'/><path d='M50 41c4 0 7 3 7 6s-2 5-5 6c3 1 6 3 6 7s-4 7-9 7h-4v-4h4c3 0 5-2 5-4s-2-4-6-4h-2v-3h3c3 0 4-2 4-4s-2-4-5-4h-3v-3h5z' fill='%23FFFFFF'/><path d='M42 48h20v2.5H42zM42 55h20v2.5H42z' fill='%23FFFFFF'/></svg>`;

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/href="data:image\/svg\+xml,[^"]+"/, `href="${svgFavicon}"`);
fs.writeFileSync('index.html', indexHtml, 'utf8');

console.log('Minted Geometric Exchange Prism Logo applied');

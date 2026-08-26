const fs = require('fs');

// 1. Android Adaptive Icon Background (drawable/ic_launcher_background.xml)
const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <!-- Deep Obsidian Night Sky Surface -->
    <path
        android:fillColor="#0D1424"
        android:pathData="M0,0h108v108h-108z" />
    
    <!-- Soft Ambient Radial Glow -->
    <path
        android:fillColor="#1A2744"
        android:pathData="M54,54m-42,0a42,42 0 1,1 84,0a42,42 0 1,1 -84,0" />

    <path
        android:fillColor="#22355C"
        android:pathData="M54,54m-30,0a30,30 0 1,1 60,0a30,30 0 1,1 -60,0" />
</vector>
`;
fs.writeFileSync('android/app/src/main/res/drawable/ic_launcher_background.xml', bgXml, 'utf8');

// 2. Android Adaptive Icon Foreground (drawable/ic_launcher_foreground.xml & drawable-v24)
const fgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    
    <!-- Material You Squircle Badge in Safe Zone -->
    <path
        android:fillColor="#1E3A8A"
        android:pathData="M54,26 C68,26 80,38 80,52 C80,66 68,78 54,78 C40,78 28,66 28,52 C28,38 40,26 54,26 Z" />
    
    <!-- Upper Exchange Arrow (Pixel Blue) -->
    <path
        android:fillColor="#60A5FA"
        android:pathData="M38,36 L66,36 C68.2,36 70,37.8 70,40 C70,42.2 68.2,44 66,44 L44,44 L48,48 L44,52 L34,42 L44,32 L48,36 L44,40 L38,40 Z" />

    <!-- Lower Exchange Arrow (Warm Amber Gold) -->
    <path
        android:fillColor="#FBBF24"
        android:pathData="M70,68 L42,68 C39.8,68 38,66.2 38,64 C38,61.8 39.8,60 42,60 L64,60 L60,56 L64,52 L74,62 L64,72 L60,68 L64,64 L70,64 Z" />

    <!-- Center Hryvnia ₴ Emblem (Crisp Pure White) -->
    <!-- Vertical Spine & Curves of Hryvnia Symbol -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M50,38 C56,38 60,42 60,47 C60,51 57,53 54,54 C58,55 61,58 61,63 C61,68 56,72 49,72 L44,72 L44,67 L49,67 C53,67 56,65 56,62 C56,59 53,57 48,57 L46,57 L46,53 L49,53 C53,53 55,51 55,48 C55,45 52,43 48,43 L44,43 L44,38 L50,38 Z" />

    <!-- Double Crossbars for ₴ Currency Sign -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M40,48 L64,48 L64,51 L40,51 Z" />
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M40,57 L64,57 L64,60 L40,60 Z" />
</vector>
`;

fs.writeFileSync('android/app/src/main/res/drawable/ic_launcher_foreground.xml', fgXml, 'utf8');
if (fs.existsSync('android/app/src/main/res/drawable-v24')) {
  fs.writeFileSync('android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml', fgXml, 'utf8');
}

// 3. Update index.html with the matching high-res SVG favicon
const svgFavicon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 108 108'><rect width='108' height='108' rx='28' fill='%230D1424'/><circle cx='54' cy='54' r='38' fill='%231E3A8A'/><path d='M38 36h28c2.2 0 4 1.8 4 4s-1.8 4-4 4H44l4 4-4 4-10-10 10-10 4 4-4 4h-6z' fill='%2360A5FA'/><path d='M70 68H42c-2.2 0-4-1.8-4-4s1.8-4 4-4h22l-4-4 4-4 10 10-10 10-4-4 4-4h6z' fill='%23FBBF24'/><path d='M50 38c6 0 10 4 10 9 0 4-3 6-6 7 4 1 7 4 7 9 0 5-5 9-12 9h-5v-5h5c4 0 7-2 7-5s-3-5-8-5h-2v-4h3c4 0 6-2 6-5s-2-5-6-5h-4v-5h6z' fill='%23FFFFFF'/><path d='M40 48h24v3H40zM40 57h24v3H40z' fill='%23FFFFFF'/></svg>`;

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/href="data:image\/svg\+xml,[^"]+"/, `href="${svgFavicon}"`);
fs.writeFileSync('index.html', indexHtml, 'utf8');

console.log('App icons updated successfully!');

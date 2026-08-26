const fs = require('fs');

// 1. Android Adaptive Icon Background (drawable/ic_launcher_background.xml)
const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <!-- Diia Matte Deep Obsidian Surface -->
    <path
        android:fillColor="#0A0A0E"
        android:pathData="M0,0h108v108h-108z" />
    
    <!-- Subtle Diia Atmospheric Radial Gradient -->
    <path
        android:fillColor="#151722"
        android:pathData="M54,54m-45,0a45,45 0 1,1 90,0a45,45 0 1,1 -90,0" />

    <path
        android:fillColor="#1E2333"
        android:pathData="M54,54m-32,0a32,32 0 1,1 64,0a32,32 0 1,1 -64,0" />
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
    
    <!-- Diia Document Squircle Baseplate -->
    <path
        android:fillColor="#1C2130"
        android:pathData="M54,22 C72,22 86,36 86,54 C86,72 72,86 54,86 C36,86 22,72 22,54 C22,36 36,22 54,22 Z" />

    <!-- Outer Diia Modern Accent Border -->
    <path
        android:fillColor="#00000000"
        android:strokeColor="#E2F163"
        android:strokeWidth="2.5"
        android:pathData="M54,24 C71,24 84,37 84,54 C84,71 71,84 54,84 C37,84 24,71 24,54 C24,37 37,24 54,24 Z" />

    <!-- Modern Ukrainian Trident (Тризуб) Geometry in Pure White -->
    <!-- Center Spear -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M52,34 L56,34 L56,66 L52,66 Z" />
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M54,30 L57,34 L51,34 Z" />

    <!-- Left Trident Wing -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M43,40 C43,40 43,58 48,63 L51,63 C47,58 47,44 47,40 L43,40 Z" />
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M41,38 L45,41 L41,44 Z" />

    <!-- Right Trident Wing -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M65,40 C65,40 65,58 60,63 L57,63 C61,58 61,44 61,40 L65,40 Z" />
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M67,38 L63,41 L67,44 Z" />

    <!-- Trident Base Anchor -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M46,65 L62,65 L58,74 L50,74 Z" />

    <!-- Dynamic Diia FX Exchange Orbit (Electric Lime & Gold) -->
    <path
        android:fillColor="#E2F163"
        android:pathData="M32,46 C35,36 43,30 54,30 L54,33 C45,33 38,38 35,46 Z" />
    <path
        android:fillColor="#FFD700"
        android:pathData="M76,62 C73,72 65,78 54,78 L54,75 C63,75 70,70 73,62 Z" />
</vector>
`;
fs.writeFileSync('android/app/src/main/res/drawable/ic_launcher_foreground.xml', fgXml, 'utf8');
if (fs.existsSync('android/app/src/main/res/drawable-v24')) {
  fs.writeFileSync('android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml', fgXml, 'utf8');
}

// 3. Web Favicon
const svgFavicon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 108 108'><rect width='108' height='108' rx='28' fill='%230A0A0E'/><circle cx='54' cy='54' r='38' fill='%231C2130' stroke='%23E2F163' stroke-width='3'/><path d='M52 34h4v32h-4zM54 30l3 4h-6z' fill='%23FFFFFF'/><path d='M43 40c0 0 0 18 5 23h3c-4-5-4-19-4-23h-4zM41 38l4 3-4 3z' fill='%23FFFFFF'/><path d='M65 40c0 0 0 18-5 23h-3c4-5 4-19 4-23h4zM67 38l-4 3 4 3z' fill='%23FFFFFF'/><path d='M46 65h16l-4 9h-8z' fill='%23FFFFFF'/><path d='M32 46c3-10 11-16 22-16v3c-9 0-16 5-19 13z' fill='%23E2F163'/><path d='M76 62c-3 10-11 16-22 16v-3c9 0 16-5 19-13z' fill='%23FFD700'/></svg>`;

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/href="data:image\/svg\+xml,[^"]+"/, `href="${svgFavicon}"`);
fs.writeFileSync('index.html', indexHtml, 'utf8');

console.log('Diia-inspired app launcher icon and favicon updated');

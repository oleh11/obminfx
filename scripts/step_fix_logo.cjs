const fs = require('fs');

// 1. Android Adaptive Icon Background (drawable/ic_launcher_background.xml)
const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0B0E14"
        android:pathData="M0,0h108v108h-108z" />
    <path
        android:fillColor="#151A24"
        android:pathData="M54,54m-44,0a44,44 0 1,1 88,0a44,44 0 1,1 -88,0" />
</vector>
`;
fs.writeFileSync('android/app/src/main/res/drawable/ic_launcher_background.xml', bgXml, 'utf8');

// 2. Android Adaptive Icon Foreground (drawable/ic_launcher_foreground.xml)
// Sleek minimalist geometric exchange emblem with Trident-inspired architectural geometry (No words)
const fgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    
    <!-- Outer Floating Squircle Ring -->
    <path
        android:fillColor="#00000000"
        android:strokeColor="#1F2636"
        android:strokeWidth="4"
        android:pathData="M54,20 C73,20 88,35 88,54 C88,73 73,88 54,88 C35,88 20,73 20,54 C20,35 35,20 54,20 Z" />

    <!-- Minimalist Geometric Trident-Prism (Crisp White & Neon Lime Accent) -->
    <!-- Center Column -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M51,32 L57,32 L57,68 L51,68 Z" />
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M54,27 L58.5,32 L49.5,32 Z" />

    <!-- Left Wing -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M41,39 C41,39 41,58 46,64 L50,64 C45,58 45,43 45,39 L41,39 Z" />

    <!-- Right Wing -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M67,39 C67,39 67,58 62,64 L58,64 C63,58 63,43 63,39 L67,39 Z" />

    <!-- Base Anchor -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M44,67 L64,67 L60,76 L48,76 Z" />

    <!-- Sleek Diia-Lime Dynamic FX Accent Arc -->
    <path
        android:fillColor="#00000000"
        android:strokeColor="#D4FF00"
        android:strokeWidth="3.5"
        android:pathData="M30,46 C34,34 43,26 54,26" />

    <path
        android:fillColor="#00000000"
        android:strokeColor="#F59E0B"
        android:strokeWidth="3.5"
        android:pathData="M78,62 C74,74 65,82 54,82" />
</vector>
`;

fs.writeFileSync('android/app/src/main/res/drawable/ic_launcher_foreground.xml', fgXml, 'utf8');
if (fs.existsSync('android/app/src/main/res/drawable-v24')) {
  fs.writeFileSync('android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml', fgXml, 'utf8');
}

// 3. Web Favicon (Clean Minimalist Vector)
const svgFavicon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 108 108'><rect width='108' height='108' rx='28' fill='%230B0E14'/><circle cx='54' cy='54' r='36' fill='none' stroke='%231F2636' stroke-width='4'/><path d='M51 32h6v36h-6zM54 27l4.5 5h-9z' fill='%23FFFFFF'/><path d='M41 39c0 0 0 19 5 25h4c-5-6-5-21-5-25h-4zM67 39c0 0 0 19-5 25h-4c5-6 5-21 5-25h4z' fill='%23FFFFFF'/><path d='M44 67h20l-4 9h-12z' fill='%23FFFFFF'/><path d='M30 46c4-12 13-20 24-20' stroke='%23D4FF00' stroke-width='3.5' fill='none'/><path d='M78 62c-4 12-13 20-24 20' stroke='%23F59E0B' stroke-width='3.5' fill='none'/></svg>`;

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/href="data:image\/svg\+xml,[^"]+"/, `href="${svgFavicon}"`);
fs.writeFileSync('index.html', indexHtml, 'utf8');

console.log('Clean English Minimalist Diia-Influenced Logo applied');

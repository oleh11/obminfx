// Copies the on-device text recognizer (Tesseract) into public/ocr so the app works offline
// and never downloads code or data at runtime. Runs before `npm run dev` and `npm run build`.
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public', 'ocr');
const files = [
  ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
  // SIMD build: every supported Android WebView (Chrome 91+) has WebAssembly SIMD
  ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  // Unpacked: Android's build drops the .gz ending from asset names, and the APK compresses it anyway
  ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'eng.traineddata', 'gunzip']
];

fs.mkdirSync(out, { recursive: true });
for (const [from, to, how] of files) {
  const src = path.join(root, from);
  const dest = path.join(out, to);
  const data = how === 'gunzip' ? zlib.gunzipSync(fs.readFileSync(src)) : fs.readFileSync(src);
  if (fs.existsSync(dest) && fs.statSync(dest).size === data.length) continue;
  fs.writeFileSync(dest, data);
  console.log(`ocr: copied ${to} (${(data.length / 1e6).toFixed(1)} MB)`);
}
// Remove the packed copy left by earlier versions of this script
fs.rmSync(path.join(out, 'eng.traineddata.gz'), { force: true });

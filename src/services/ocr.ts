import type { Worker } from 'tesseract.js';
import type { OcrLine } from './priceScan';

/**
 * On-device text reader (Tesseract, open source). Its code and English data ship inside the app
 * (public/ocr, copied by tools/copy-ocr.cjs), so nothing is downloaded and no image leaves the phone.
 */
let workerPromise: Promise<Worker> | null = null;

const asset = (name: string) => new URL(`ocr/${name}`, document.baseURI).href;

export function getOcrWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM, OEM } = await import('tesseract.js');
      const worker = await createWorker('eng', OEM.LSTM_ONLY, {
        workerPath: asset('worker.min.js'),
        corePath: asset('tesseract-core-simd-lstm.wasm.js'),
        langPath: new URL('ocr', document.baseURI).href,
        gzip: false,
        workerBlobURL: false,
        cacheMethod: 'none'
      });
      await worker.setParameters({
        // Price tags: find scattered text. All characters are read, so units like "/ kg" don't garble the price
        tessedit_pageseg_mode: PSM.SPARSE_TEXT
      });
      return worker;
    })();
    // Let a failed start be retried next time
    workerPromise.catch(() => {
      workerPromise = null;
    });
  }
  return workerPromise;
}

/** Reads lines of words (with boxes in the image's pixels) from a canvas */
export async function readLines(image: HTMLCanvasElement): Promise<OcrLine[]> {
  const worker = await getOcrWorker();
  const { data } = await worker.recognize(image, {}, { blocks: true, text: false });
  const lines: OcrLine[] = [];
  for (const block of data.blocks ?? []) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        lines.push({ words: line.words.map(w => ({ text: w.text, confidence: w.confidence, bbox: w.bbox })) });
      }
    }
  }
  return lines;
}

/** Frees the reader's memory (about 30 MB) when the scanner closes */
export async function stopOcr(): Promise<void> {
  const pending = workerPromise;
  workerPromise = null;
  if (pending) {
    try {
      (await pending).terminate();
    } catch {
      // Already gone
    }
  }
}

import { normalizePolarity } from './imagePrep';

interface PolarityRequest {
  id: number;
  buffer: ArrayBuffer;
  width: number;
  height: number;
}

self.onmessage = (event: MessageEvent<PolarityRequest>) => {
  const { id, buffer, width, height } = event.data;
  const pixels = new Uint8ClampedArray(buffer);
  normalizePolarity(pixels, width, height);
  (self as unknown as Worker).postMessage({ id, buffer }, [buffer]);
};

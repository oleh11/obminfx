/**
 * Prepares camera frames for the text reader.
 *
 * The reader expects dark text on a light background and decides that for the whole image at once,
 * so a price printed white on a red sale tag inside a light shelf photo gets skipped. This flips
 * every area whose surroundings are dark, so all text ends up dark on light. Works on RGBA pixels
 * in place and leaves a grayscale image.
 */
export function normalizePolarity(pixels: Uint8ClampedArray, width: number, height: number, radiusFraction = 0.08): void {
  const n = width * height;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    lum[i] = 0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2];
  }
  // Summed-area table for fast local averages
  const stride = width + 1;
  const sums = new Float64Array(stride * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += lum[y * width + x];
      sums[(y + 1) * stride + x + 1] = sums[y * stride + x + 1] + row;
    }
  }
  const r = Math.max(6, Math.round(Math.max(width, height) * radiusFraction));
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(height, y + r + 1);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(width, x + r + 1);
      const mean = (sums[y1 * stride + x1] - sums[y0 * stride + x1] - sums[y1 * stride + x0] + sums[y0 * stride + x0]) / ((x1 - x0) * (y1 - y0));
      const l = lum[y * width + x];
      const v = mean < 128 ? 255 - l : l;
      const i = (y * width + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = v;
    }
  }
}

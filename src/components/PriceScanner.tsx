import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Pause, Play, ScanLine, ArrowRight, Loader2, CameraOff } from 'lucide-react';
import { useT } from '../i18n';
import { ExchangeRateData } from '../types/currency';
import { RateService } from '../services/rateService';
import { formatCurrencyAmount } from '../services/feeCalculator';
import { StorageService } from '../services/storageService';
import { findPrices, mergePrices, detectCurrency, FoundPrice } from '../services/priceScan';
import { readLines, stopOcr } from '../services/ocr';
import { normalizePolarity } from '../services/imagePrep';

interface PriceScannerProps {
  isOpen: boolean;
  onClose: () => void;
  rateData: ExchangeRateData | null;
  /** Converter base: the currency prices are shown in */
  homeCurrency: string;
  /** Currency of the price tags at first: the Converter's top currency */
  defaultPriceCurrency: string;
  /** Currencies offered for the price tags */
  currencyCodes: string[];
  bankFeePct: number;
}

type Status = 'starting' | 'loading' | 'scanning' | 'paused' | 'denied' | 'error';

/** Longest side of the frame given to the text reader: big enough for shelf tags, small enough to stay quick */
const READ_SIZE = 1280;
const PAUSE_BETWEEN_READS_MS = 250;
/** 1×1 transparent GIF, so the video never shows the WebView's default play-button poster */
const BLANK_POSTER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** Four corner brackets of a viewfinder, filling the parent */
const Corners: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={'absolute inset-0 ' + className}>
    {['top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-2xl', 'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-2xl',
      'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-2xl', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-2xl'].map(pos => (
      <span key={pos} className={'absolute w-8 h-8 border-white drop-shadow-[0_0_3px_rgba(0,0,0,0.6)] ' + pos} />
    ))}
  </div>
);

/** Size of the extra copy used for big prices */
const SMALL_FACTOR = 1 / 3;

/**
 * Point the camera at price tags: each price found gets a label with its value in the home currency.
 * Frames are read on the phone and never saved or sent anywhere.
 */
export const PriceScanner: React.FC<PriceScannerProps> = ({
  isOpen,
  onClose,
  rateData,
  homeCurrency,
  defaultPriceCurrency,
  currencyCodes,
  bankFeePct
}) => {
  const { t, locale, currency, pct } = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('starting');
  const [prices, setPrices] = useState<FoundPrice[]>([]);
  const [priceCurrency, setPriceCurrency] = useState(defaultPriceCurrency);
  const [withFee, setWithFee] = useState(bankFeePct > 0);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const pausedRef = useRef(false);
  /** True once camera frames are showing */
  const [live, setLive] = useState(false);
  /** Currency read from the tags, shown as a hint */
  const [detected, setDetected] = useState<string | null>(null);
  /** True once the user chose the tag currency themselves; detection then stops */
  const pickedRef = useRef(false);
  const codesRef = useRef(currencyCodes);
  codesRef.current = currencyCodes;

  useEffect(() => {
    if (!isOpen) return;
    setPriceCurrency(defaultPriceCurrency);
    setDetected(null);
    pickedRef.current = false;
  }, [isOpen, defaultPriceCurrency]);

  // Camera, then the read loop; everything stops when the scanner closes
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    const canvas = document.createElement('canvas');
    let smallCanvas: HTMLCanvasElement | null = null;
    pausedRef.current = false;
    setLive(false);
    setPrices([]);
    setStatus('starting');

    const readFrame = async () => {
      const video = videoRef.current;
      if (cancelled || !video) return;
      const el = stageRef.current;
      if (!pausedRef.current && video.videoWidth > 0 && el && el.clientWidth > 0) {
        // Only read the part of the camera image that is on screen (the preview is cropped to fill it)
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const cover = Math.max(el.clientWidth / vw, el.clientHeight / vh);
        const sw = Math.min(vw, el.clientWidth / cover);
        const sh = Math.min(vh, el.clientHeight / cover);
        const sx = (vw - sw) / 2;
        const sy = (vh - sh) / 2;
        const scale = Math.min(1, READ_SIZE / Math.max(sw, sh));
        canvas.width = Math.round(sw * scale);
        canvas.height = Math.round(sh * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx?.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        try {
          // The reader misses very large text, so big tag prices are read again from a smaller copy.
          // Both copies are flipped to dark-on-light first (sale tags often print white on red).
          const small = smallCanvas ?? (smallCanvas = document.createElement('canvas'));
          small.width = Math.round(canvas.width * SMALL_FACTOR);
          small.height = Math.round(canvas.height * SMALL_FACTOR);
          const sctx = small.getContext('2d', { willReadFrequently: true });
          sctx?.drawImage(canvas, 0, 0, small.width, small.height);
          for (const [c, cx] of [[canvas, ctx], [small, sctx]] as const) {
            if (!cx) continue;
            const img = cx.getImageData(0, 0, c.width, c.height);
            normalizePolarity(img.data, c.width, c.height);
            cx.putImageData(img, 0, 0);
          }
          const up = 1 / SMALL_FACTOR;
          const smallLines = sctx ? await readLines(small) : [];
          const fullLines = await readLines(canvas);
          const big = findPrices(smallLines).map(p => ({
            ...p,
            bbox: { x0: p.bbox.x0 * up, y0: p.bbox.y0 * up, x1: p.bbox.x1 * up, y1: p.bbox.y1 * up }
          }));
          const found = mergePrices(big, findPrices(fullLines));
          if (cancelled) return;
          // Follow the currency printed on the tags ("€ 12,99") until the user picks one
          const printed = detectCurrency([...smallLines, ...fullLines]);
          if (printed && !pickedRef.current && codesRef.current.includes(printed)) {
            setPriceCurrency(printed);
            setDetected(printed);
          }
          // Boxes back in the camera's own pixels, so they can be placed over the preview at any size
          const back = 1 / scale;
          if (!pausedRef.current) {
            setPrices(found.map(p => ({
              ...p,
              bbox: { x0: sx + p.bbox.x0 * back, y0: sy + p.bbox.y0 * back, x1: sx + p.bbox.x1 * back, y1: sy + p.bbox.y1 * back }
            })));
            setStatus('scanning');
          }
        } catch (err) {
          console.error('Price scan failed', err);
          if (!cancelled) setStatus('error');
          return;
        }
      }
      timer = window.setTimeout(readFrame, PAUSE_BETWEEN_READS_MS);
    };

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });
      } catch (err) {
        console.warn('Camera unavailable', err);
        if (!cancelled) setStatus('denied');
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach(tr => tr.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});
      setStatus('loading');
      readFrame();
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach(tr => tr.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      stopOcr();
    };
  }, [isOpen]);

  // Track the preview size to place labels over the prices
  useEffect(() => {
    if (!isOpen || !stageRef.current) return;
    const el = stageRef.current;
    const update = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen]);

  const rate = useMemo(
    () => (rateData ? RateService.calculateRate(priceCurrency, homeCurrency, rateData) : NaN),
    [rateData, priceCurrency, homeCurrency]
  );
  const home = currency(homeCurrency);
  const source = currency(priceCurrency);
  const feeFactor = withFee ? 1 + bankFeePct / 100 : 1;

  const formatHome = useCallback(
    (amount: number) => formatCurrencyAmount(amount * rate * feeFactor, home.decimalPlaces, true, home.symbol, locale),
    [rate, feeFactor, home, locale]
  );

  // The preview fills the screen (object-fit: cover): map camera pixels to screen points
  const video = videoRef.current;
  const vw = video?.videoWidth || 0;
  const vh = video?.videoHeight || 0;
  const cover = vw && vh && stage.w ? Math.max(stage.w / vw, stage.h / vh) : 0;
  const offsetX = (stage.w - vw * cover) / 2;
  const offsetY = (stage.h - vh * cover) / 2;

  const togglePause = () => {
    StorageService.triggerHaptic();
    const video = videoRef.current;
    pausedRef.current = !pausedRef.current;
    if (pausedRef.current) video?.pause();
    else video?.play().catch(() => {});
    setStatus(pausedRef.current ? 'paused' : 'scanning');
  };

  if (!isOpen) return null;

  const hint =
    status === 'starting' ? t('scan.starting')
    : status === 'loading' ? t('scan.loading')
    : status === 'paused' ? t('scan.paused')
    : status === 'error' ? t('scan.error')
    : prices.length === 0 ? t('scan.pointAt')
    : t('scan.found', { n: prices.length });

  // Biggest prices first in the list: usually the main price on the tag
  const listed = [...prices].sort((a, b) => (b.bbox.y1 - b.bbox.y0) - (a.bbox.y1 - a.bbox.y0)).slice(0, 4);

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col animate-fade-in" role="dialog" aria-modal="true" aria-label={t('scan.title')}>
      {/* Camera preview with labels */}
      <div ref={stageRef} className="absolute inset-0 overflow-hidden">
        {/* Transparent poster and hidden until frames arrive: Android otherwise shows a gray play button */}
        <video
          ref={videoRef}
          className={'absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ' + (live ? 'opacity-100' : 'opacity-0')}
          poster={BLANK_POSTER}
          playsInline
          muted
          disablePictureInPicture
          controls={false}
          onPlaying={() => setLive(true)}
        />
        {!live && status !== 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white pointer-events-none">
            <div className="relative w-56 h-36">
              <Corners className="opacity-60 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold opacity-80">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('scan.starting')}
            </div>
          </div>
        )}
        {live && prices.length === 0 && status !== 'paused' && (
          // Viewfinder hint while nothing is found yet
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 pointer-events-none">
            <Corners className="opacity-70" />
          </div>
        )}
        {cover > 0 && isFinite(rate) && prices.map((p, i) => {
          const boxLeft = offsetX + p.bbox.x0 * cover;
          const boxTop = offsetY + p.bbox.y0 * cover;
          const boxW = (p.bbox.x1 - p.bbox.x0) * cover;
          const boxH = (p.bbox.y1 - p.bbox.y0) * cover;
          // Label centered just below the price
          const left = boxLeft + boxW / 2;
          const top = boxTop + boxH + 6;
          return (
            <React.Fragment key={`${i}-${p.text}`}>
              <div
                className="absolute rounded-md border-2 border-accent/90 pointer-events-none"
                style={{ left: boxLeft - 3, top: boxTop - 3, width: boxW + 6, height: boxH + 6 }}
              />
              <div
                className="absolute -translate-x-1/2 px-2 py-1 rounded-lg bg-accent text-onaccent text-xs font-black whitespace-nowrap shadow-lg pointer-events-none"
                style={{ left, top }}
              >
                ≈ {formatHome(p.amount)}
              </div>
            </React.Fragment>
          );
        })}
        {status === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white">
            <CameraOff className="w-8 h-8 opacity-80" />
            <p className="text-sm font-bold">{t('scan.denied')}</p>
            <p className="text-xs opacity-70">{t('scan.deniedHint')}</p>
          </div>
        )}
      </div>

      {/* Top bar: close and currencies */}
      <div className="relative safe-area-pt px-4 pb-3 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onClose();
            }}
            className="p-2 rounded-full bg-black/40 text-white"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2 text-white text-xs font-bold">
            <label className="sr-only" htmlFor="scan-currency">{t('scan.pricesIn')}</label>
            <select
              id="scan-currency"
              value={priceCurrency}
              onChange={e => {
                pickedRef.current = true;
                setDetected(null);
                setPriceCurrency(e.target.value);
              }}
              className="bg-black/50 border border-white/20 rounded-full px-3 py-1.5 text-white text-xs font-black"
            >
              {currencyCodes.map(code => (
                <option key={code} value={code}>{currency(code).flag} {code}</option>
              ))}
            </select>
            <ArrowRight className="w-4 h-4 opacity-80" />
            <span className="px-3 py-1.5 rounded-full bg-black/50 border border-white/20 font-black">
              {home.flag} {homeCurrency}
            </span>
          </div>
          <div className="w-9" />
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom panel: status, found prices, controls */}
      <div className="relative safe-area-pb px-4 pt-6 bg-gradient-to-t from-black/85 via-black/60 to-transparent text-white space-y-3">
        <div className={'flex items-center gap-2 text-xs font-bold opacity-90' + (live || status === 'denied' ? '' : ' invisible')}>
          {status === 'starting' || status === 'loading'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <ScanLine className="w-4 h-4" />}
          <span>{hint}</span>
          {detected && <span className="ml-auto opacity-75">{t('scan.detected', { code: detected })}</span>}
        </div>

        {listed.length > 0 && isFinite(rate) && (
          <div className="space-y-1.5">
            {listed.map((p, i) => (
              <div key={`${i}-${p.text}`} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 text-sm">
                <span className="font-bold">{formatCurrencyAmount(p.amount, source.decimalPlaces, true, source.symbol, locale)}</span>
                <span className="font-black text-accent">≈ {formatHome(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
        {!isFinite(rate) && <p className="text-xs text-amber-300">{t('scan.noRate', { from: priceCurrency, to: homeCurrency })}</p>}

        <div className="flex items-center gap-2 pb-2">
          {bankFeePct > 0 && (
            <button
              onClick={() => {
                StorageService.triggerHaptic();
                setWithFee(!withFee);
              }}
              className={'flex-1 py-2.5 rounded-2xl text-xs font-black border transition-all ' + (withFee ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/30')}
            >
              {t('scan.withFee', { fee: pct(bankFeePct) })}
            </button>
          )}
          <button
            onClick={togglePause}
            disabled={status === 'denied' || status === 'starting'}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-accent text-onaccent text-xs font-black disabled:opacity-40"
          >
            {status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {status === 'paused' ? t('scan.resume') : t('scan.hold')}
          </button>
        </div>
      </div>
    </div>
  );
};

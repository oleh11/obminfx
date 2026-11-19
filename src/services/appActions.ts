import { Capacitor, registerPlugin } from '@capacitor/core';

/** Native side: android/app/src/main/java/com/obminfx/app/AppActionsPlugin.java */
interface AppActionsPlugin {
  share(options: { text: string; title?: string }): Promise<void>;
  openUrl(options: { url: string; fallback?: string }): Promise<void>;
}

const AppActions = registerPlugin<AppActionsPlugin>('AppActions');
const isAndroid = () => Capacitor.getPlatform() === 'android';

export const APP_ID = 'com.obminfx.app';
export const PLAY_URL = `https://play.google.com/store/apps/details?id=${APP_ID}`;
export const ISSUES_URL = 'https://github.com/oleh11/obminfx/issues';

/** Opens the share sheet. Returns false if sharing isn't available (the text is copied instead when possible). */
export async function shareText(text: string, title?: string): Promise<boolean> {
  try {
    if (isAndroid()) {
      await AppActions.share({ text, title });
      return true;
    }
    const nav = navigator as Navigator & { share?: (d: { text: string; title?: string }) => Promise<void> };
    if (nav.share) {
      await nav.share({ text, title });
      return true;
    }
    await navigator.clipboard?.writeText(text);
  } catch {
    // Dismissing the share sheet also lands here
  }
  return false;
}

async function openUrl(url: string, fallback?: string): Promise<void> {
  try {
    if (isAndroid()) {
      await AppActions.openUrl({ url, fallback });
      return;
    }
  } catch {
    if (!fallback) return;
    url = fallback;
  }
  window.open(url.startsWith('market:') && fallback ? fallback : url, '_blank', 'noopener');
}

/** Opens ObminFX in the Play Store app (or the web page) so the user can rate it */
export function openStoreListing(): Promise<void> {
  return openUrl(`market://details?id=${APP_ID}`, PLAY_URL);
}

/** Opens a new GitHub issue with the feedback draft filled in; falls back to the issues list */
export function sendFeedback(subject: string, body: string): Promise<void> {
  const newIssue = `${ISSUES_URL}/new?title=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return openUrl(newIssue, ISSUES_URL);
}

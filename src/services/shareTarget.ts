import { Capacitor, registerPlugin, PluginListenerHandle } from '@capacitor/core';

export type LaunchAction = 'scan' | 'check_card';

/** Native side: android/app/src/main/java/com/obminfx/app/ShareTargetPlugin.java */
interface ShareTargetPlugin {
  getSharedText(): Promise<{ text: string | null }>;
  getLaunchAction(): Promise<{ action: LaunchAction | null }>;
  addListener(event: 'sharedText', fn: (data: { text: string }) => void): Promise<PluginListenerHandle>;
  addListener(event: 'launchAction', fn: (data: { action: LaunchAction }) => void): Promise<PluginListenerHandle>;
}

const ShareTarget = registerPlugin<ShareTargetPlugin>('ShareTarget');

/**
 * Calls `onText` with text shared to the app (a bank notification or SMS): once for text shared
 * while the app was starting, then for every later share. Does nothing outside the Android app.
 * Returns a function that stops listening.
 */
export function listenForSharedText(onText: (text: string) => void): () => void {
  if (Capacitor.getPlatform() !== 'android') return () => {};
  let handle: PluginListenerHandle | null = null;
  let stopped = false;
  ShareTarget.addListener('sharedText', d => d?.text && onText(d.text))
    .then(h => {
      if (stopped) h.remove();
      else handle = h;
    })
    .catch(() => {});
  ShareTarget.getSharedText()
    .then(r => r?.text && onText(r.text))
    .catch(() => {});
  return () => {
    stopped = true;
    handle?.remove();
  };
}

/**
 * Calls `onAction` when the app is opened from an Android launcher shortcut (Scan prices / Check my card).
 */
export function listenForLaunchAction(onAction: (action: LaunchAction) => void): () => void {
  if (Capacitor.getPlatform() !== 'android') return () => {};
  let handle: PluginListenerHandle | null = null;
  let stopped = false;
  ShareTarget.addListener('launchAction', d => d?.action && onAction(d.action))
    .then(h => {
      if (stopped) h.remove();
      else handle = h;
    })
    .catch(() => {});
  ShareTarget.getLaunchAction()
    .then(r => r?.action && onAction(r.action))
    .catch(() => {});
  return () => {
    stopped = true;
    handle?.remove();
  };
}

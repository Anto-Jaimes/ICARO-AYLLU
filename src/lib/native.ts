import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const isNative = Capacitor.isNativePlatform();

/** A short vibration on key actions. Does nothing on the web. */
export function tapFeedback(): void {
  if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/** Pick status bar icons that stay readable over the colour behind them. */
export function setStatusBarOverDark(isDark: boolean): void {
  if (!isNative) return;
  SystemBars.setStyle({ style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => {});
}

export function listenForBackButton(onBack: () => void): () => void {
  if (!isNative) return () => {};
  const listener = CapacitorApp.addListener('backButton', onBack);
  return () => {
    listener.then((handle) => handle.remove());
  };
}

export function exitApp(): void {
  if (isNative) CapacitorApp.exitApp();
}

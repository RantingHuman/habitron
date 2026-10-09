import { platform } from '@tauri-apps/plugin-os';

export const isTauriRuntime = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// Synchronous: the OS plugin injects the platform into the page at startup
export const isMobileRuntime = () =>
  isTauriRuntime() && ['ios', 'android'].includes(platform());

export const isIosRuntime = () => isTauriRuntime() && platform() === 'ios';

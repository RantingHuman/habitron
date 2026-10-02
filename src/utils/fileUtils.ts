import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { isTauriRuntime } from './platform';

const JSON_FILTERS = [{ name: 'JSON', extensions: ['json'] }];

// Returns false if the user cancelled
export const saveTextFile = async (fileName: string, content: string): Promise<boolean> => {
  if (isTauriRuntime()) {
    // Webviews ignore <a download>, so ask for a location and write the file natively
    const path = await save({ defaultPath: fileName, filters: JSON_FILTERS });
    if (!path) return false;
    await writeTextFile(path, content);
    return true;
  }

  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
};

// Returns null if the user cancelled
export const openTextFile = async (): Promise<string | null> => {
  if (isTauriRuntime()) {
    const path = await open({ multiple: false, directory: false, filters: JSON_FILTERS });
    return path ? readTextFile(path) : null;
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) file.text().then(resolve, reject);
      else resolve(null);
    });
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
};

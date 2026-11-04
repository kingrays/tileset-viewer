import type { AppSettings, TilesetService } from './types';

const KEY_TIANDITU = 'tileset-viewer:tianditu-key';
const KEY_SERVICES = 'tileset-viewer:services';
const KEY_SETTINGS = 'tileset-viewer:settings';

const DEFAULT_SETTINGS: AppSettings = {
  baseMap: 'img',
  globeTransparency: 0,
  tilesetProxyBase: '',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadTiandituKey(): string {
  return localStorage.getItem(KEY_TIANDITU) ?? '';
}

export function saveTiandituKey(key: string): void {
  localStorage.setItem(KEY_TIANDITU, key.trim());
}

export function loadServices(): TilesetService[] {
  const list = readJson<TilesetService[]>(KEY_SERVICES, []);
  return list.filter((item) => item && item.id && item.url);
}

export function saveServices(services: TilesetService[]): void {
  localStorage.setItem(KEY_SERVICES, JSON.stringify(services));
}

export function loadSettings(): AppSettings {
  const stored = readJson<Partial<AppSettings>>(KEY_SETTINGS, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    // 旧版本地数据可能没有该字段
    tilesetProxyBase: stored.tilesetProxyBase?.trim() ?? DEFAULT_SETTINGS.tilesetProxyBase,
  };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
}

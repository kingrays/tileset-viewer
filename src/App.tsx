import { useCallback, useMemo, useRef, useState } from 'react';
import { CesiumMap, type CesiumMapHandle } from './cesium/CesiumMap';
import { ControlPanel } from './components/ControlPanel';
import { ToolDock } from './components/ToolDock';
import {
  loadServices,
  loadSettings,
  loadTiandituKey,
  saveServices,
  saveSettings,
  saveTiandituKey,
} from './storage';
import type { BaseMapType, ServiceStatus, TilesetService } from './types';

export default function App() {
  const mapRef = useRef<CesiumMapHandle>(null);
  const [tiandituKey, setTiandituKey] = useState(loadTiandituKey);
  const [services, setServices] = useState<TilesetService[]>(loadServices);
  const [settings, setSettings] = useState(loadSettings);
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({});

  const handleSaveKey = useCallback((key: string) => {
    const trimmed = key.trim();
    saveTiandituKey(trimmed);
    setTiandituKey(trimmed);
  }, []);

  const updateSettings = useCallback((patch: Partial<typeof settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const persistServices = useCallback(
    (updater: (current: TilesetService[]) => TilesetService[]) => {
      setServices((current) => {
        const next = updater(current);
        saveServices(next);
        return next;
      });
    },
    [],
  );

  /** 校验名称和 tileset.json 地址后写入服务列表 */
  const handleAddService = useCallback(
    (name: string, url: string) => {
      const trimmedName = name.trim();
      const trimmedUrl = url.trim();
      if (!trimmedName) {
        return '请填写服务名称';
      }
      if (!trimmedUrl) {
        return '请填写服务地址';
      }
      try {
        const parsed = new URL(trimmedUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return '服务地址必须是 http 或 https';
        }
      } catch {
        return '服务地址格式不正确';
      }

      if (services.some((item) => item.url === trimmedUrl)) {
        return '该服务地址已添加';
      }
      persistServices((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          name: trimmedName,
          url: trimmedUrl,
          visible: true,
        },
      ]);
      return undefined;
    },
    [persistServices, services],
  );

  const handleStatusChange = useCallback((id: string, status: ServiceStatus) => {
    setStatuses((current) => ({ ...current, [id]: status }));
  }, []);

  const visibleHint = useMemo(() => services.filter((item) => item.visible).length, [services]);

  return (
    <div className="app">
      <CesiumMap
        ref={mapRef}
        tiandituKey={tiandituKey}
        baseMap={settings.baseMap}
        services={services}
        globeTransparency={settings.globeTransparency}
        tilesetProxyBase={settings.tilesetProxyBase}
        onStatusChange={handleStatusChange}
      />
      <ControlPanel
        services={services}
        statuses={statuses}
        onAddService={handleAddService}
        onToggleVisible={(id) =>
          persistServices((current) =>
            current.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)),
          )
        }
        onRemoveService={(id) =>
          persistServices((current) => current.filter((item) => item.id !== id))
        }
        onFlyTo={(id) => mapRef.current?.flyToService(id)}
      />
      <ToolDock
        tiandituKey={tiandituKey}
        onSaveKey={handleSaveKey}
        baseMap={settings.baseMap}
        onBaseMapChange={(value: BaseMapType) => updateSettings({ baseMap: value })}
        globeTransparency={settings.globeTransparency}
        onTransparencyChange={(value) => updateSettings({ globeTransparency: value })}
        tilesetProxyBase={settings.tilesetProxyBase}
        onTilesetProxyBaseChange={(value) => updateSettings({ tilesetProxyBase: value })}
        visibleCount={visibleHint}
      />
    </div>
  );
}

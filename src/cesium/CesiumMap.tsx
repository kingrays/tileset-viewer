import {
  BoundingSphere,
  Cartesian3,
  Cesium3DTileset,
  Color,
  EllipsoidTerrainProvider,
  HeadingPitchRange,
  Math as CesiumMath,
  Viewer,
} from 'cesium';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { BaseMapType, ServiceStatus, TilesetService } from '../types';
import { applyGlobeTransparency } from './globeTransparency';
import { toProxyUrl } from './proxyUrl';
import { applyTiandituLayers } from './tianditu';

export interface CesiumMapHandle {
  flyToService: (id: string) => void;
}

interface CesiumMapProps {
  tiandituKey: string;
  baseMap: BaseMapType;
  services: TilesetService[];
  globeTransparency: number;
  onStatusChange: (id: string, status: ServiceStatus) => void;
}

interface TilesetRecord {
  url: string;
  tileset: Cesium3DTileset;
}

export const CesiumMap = forwardRef<CesiumMapHandle, CesiumMapProps>(function CesiumMap(
  { tiandituKey, baseMap, services, globeTransparency, onStatusChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const recordsRef = useRef<Map<string, TilesetRecord>>(new Map());
  const loadTokenRef = useRef<Map<string, number>>(new Map());
  const servicesRef = useRef(services);
  const onStatusChangeRef = useRef(onStatusChange);
  servicesRef.current = services;
  onStatusChangeRef.current = onStatusChange;

  useImperativeHandle(ref, () => ({
    flyToService(id: string) {
      const viewer = viewerRef.current;
      const record = recordsRef.current.get(id);
      if (!viewer || !record) {
        return;
      }
      flyToTileset(viewer, record.tileset);
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const viewer = new Viewer(container, {
      animation: false,
      timeline: false,
      geocoder: false,
      homeButton: true,
      sceneModePicker: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      fullscreenButton: true,
      vrButton: false,
      infoBox: true,
      selectionIndicator: true,
      baseLayer: false,
      terrainProvider: new EllipsoidTerrainProvider(),
      // 跟随系统缩放（100% / 125% / 200%），不要固定按 1 倍 CSS 像素拉伸
      useBrowserRecommendedResolution: false,
      msaaSamples: 4,
    });

    applyPixelRatio(viewer);
    const unsubscribePixelRatio = subscribePixelRatio(() => applyPixelRatio(viewer));
    viewer.scene.postProcessStages.fxaa.enabled = true;

    viewer.scene.globe.baseColor = Color.fromCssColorString('#243044');
    viewer.scene.backgroundColor = Color.fromCssColorString('#070b12');
    viewer.scene.globe.enableLighting = false;
    viewer.scene.light.intensity = 2.2;
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1;
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
    applyGlobeTransparency(viewer, 0);

    const ionLogo = viewer.container.querySelector('.cesium-credit-logoContainer');
    if (ionLogo instanceof HTMLElement) {
      ionLogo.style.display = 'none';
    }

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(108.0, 34.0, 4_500_000),
    });

    viewer.homeButton.viewModel.command.beforeExecute.addEventListener((event) => {
      event.cancel = true;
      flyHome(viewer, recordsRef.current);
    });

    viewerRef.current = viewer;
    if (import.meta.env.DEV) {
      window.__cesiumViewer = viewer;
    }

    return () => {
      unsubscribePixelRatio();
      recordsRef.current.forEach((record) => {
        viewer.scene.primitives.remove(record.tileset);
      });
      recordsRef.current.clear();
      viewer.destroy();
      viewerRef.current = null;
      if (import.meta.env.DEV && window.__cesiumViewer === viewer) {
        delete window.__cesiumViewer;
      }
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) {
      return;
    }
    applyTiandituLayers(viewer, tiandituKey, baseMap);
  }, [tiandituKey, baseMap]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) {
      return;
    }
    applyGlobeTransparency(viewer, globeTransparency);
  }, [globeTransparency]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) {
      return;
    }

    const records = recordsRef.current;
    const activeIds = new Set(services.map((service) => service.id));

    records.forEach((record, id) => {
      if (!activeIds.has(id)) {
        viewer.scene.primitives.remove(record.tileset);
        records.delete(id);
      }
    });

    services.forEach((service) => {
      const existing = records.get(service.id);
      if (existing && existing.url !== service.url) {
        viewer.scene.primitives.remove(existing.tileset);
        records.delete(service.id);
      }

      const current = records.get(service.id);
      if (current) {
        current.tileset.show = service.visible;
        return;
      }

      if (!service.visible) {
        onStatusChangeRef.current(service.id, { state: 'idle' });
        return;
      }

      const token = (loadTokenRef.current.get(service.id) ?? 0) + 1;
      loadTokenRef.current.set(service.id, token);
      onStatusChangeRef.current(service.id, { state: 'loading' });

      void loadTileset(viewer, service)
        .then((tileset) => {
          if (loadTokenRef.current.get(service.id) !== token || viewer.isDestroyed()) {
            viewer.scene.primitives.remove(tileset);
            return;
          }
          const latest = servicesRef.current.find((item) => item.id === service.id);
          if (!latest) {
            viewer.scene.primitives.remove(tileset);
            return;
          }
          records.set(service.id, { url: service.url, tileset });
          tileset.show = latest.visible;
          onStatusChangeRef.current(service.id, { state: 'ready' });
          if (latest.visible) {
            flyToTileset(viewer, tileset);
          }
        })
        .catch((error: unknown) => {
          if (loadTokenRef.current.get(service.id) !== token) {
            return;
          }
          const message = error instanceof Error ? error.message : '未知错误';
          onStatusChangeRef.current(service.id, {
            state: 'error',
            message: `加载失败：${message}`,
          });
        });
    });
  }, [services]);

  return <div ref={containerRef} className="cesium-container" />;
});

async function loadTileset(viewer: Viewer, service: TilesetService) {
  // SSE 越小越清晰（更易细化到高精度瓦片），过大时倾斜摄影会像「融化」
  const tileset = await Cesium3DTileset.fromUrl(toProxyUrl(service.url), {
    maximumScreenSpaceError: 1,
  });
  viewer.scene.primitives.add(tileset);
  return tileset;
}

function flyToTileset(viewer: Viewer, tileset: Cesium3DTileset) {
  const sphere = BoundingSphere.clone(tileset.boundingSphere);
  const radius = Math.max(sphere.radius, 20);
  // 管廊/BIM 通常扁平细长，按完整包围球距离飞会太远
  const range = Math.min(Math.max(radius * 0.45, 80), 1600);
  viewer.camera.flyToBoundingSphere(sphere, {
    duration: 1.6,
    offset: new HeadingPitchRange(0, CesiumMath.toRadians(-28), range),
  });
}

function flyHome(viewer: Viewer, records: Map<string, TilesetRecord>) {
  const ready = [...records.values()].filter((item) => item.tileset.show);
  if (ready.length === 1) {
    flyToTileset(viewer, ready[0].tileset);
    return;
  }
  if (ready.length > 1) {
    const sphere = BoundingSphere.fromBoundingSpheres(
      ready.map((item) => item.tileset.boundingSphere),
    );
    viewer.camera.flyToBoundingSphere(sphere, { duration: 1.6 });
    return;
  }
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(108.0, 34.0, 4_500_000),
    duration: 1.4,
  });
}

/** 100% 保持 1x；高分屏跟随 DPR；超过 2 倍时封顶，避免过卡 */
function applyPixelRatio(viewer: Viewer) {
  if (viewer.isDestroyed()) {
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  viewer.resolutionScale = Math.min(dpr, 1);
}

/** 在不同缩放显示器之间拖动窗口时重新匹配分辨率 */
function subscribePixelRatio(onChange: () => void): () => void {
  let media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
  const handleChange = () => {
    onChange();
    media.removeEventListener('change', handleChange);
    media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    media.addEventListener('change', handleChange);
  };
  media.addEventListener('change', handleChange);
  return () => media.removeEventListener('change', handleChange);
}

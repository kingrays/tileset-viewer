import { Credit, UrlTemplateImageryProvider, type ImageryLayer, type Viewer } from 'cesium';
import type { BaseMapType } from '../types';

const tiandituLayers = new WeakSet<ImageryLayer>();

function createTiandituProvider(layer: string, token: string) {
  return new UrlTemplateImageryProvider({
    url: `https://t{s}.tianditu.gov.cn/DataServer?T=${layer}&x={x}&y={y}&l={z}&tk=${encodeURIComponent(token)}`,
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    maximumLevel: 18,
    minimumLevel: 1,
    credit: new Credit('天地图'),
  });
}

/** 按当前 Key 与底图类型刷新天地图影像/注记图层 */
export function applyTiandituLayers(
  viewer: Viewer,
  token: string,
  baseMap: BaseMapType,
): void {
  const layers = viewer.imageryLayers;
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    const layer = layers.get(i);
    if (tiandituLayers.has(layer)) {
      layers.remove(layer, true);
    }
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return;
  }

  const mainType = baseMap === 'vec' ? 'vec_w' : 'img_w';
  const annoType = baseMap === 'vec' ? 'cva_w' : 'cia_w';
  const main = layers.addImageryProvider(createTiandituProvider(mainType, trimmed));
  const anno = layers.addImageryProvider(createTiandituProvider(annoType, trimmed));
  tiandituLayers.add(main);
  tiandituLayers.add(anno);
}

import { Color, type Viewer } from 'cesium';

/**
 * 地表透明度：0 为完全不透明，100 为完全透明。
 * frontFaceAlpha 表示不透明度，因此需要取反。
 */
export function applyGlobeTransparency(viewer: Viewer, transparency: number): void {
  const globe = viewer.scene.globe;
  const clamped = Math.min(100, Math.max(0, transparency));
  const opacity = 1 - clamped / 100;

  globe.translucency.enabled = clamped > 0;
  globe.translucency.frontFaceAlpha = opacity;
  // 背面完全不画，避免透过地球看到对面半球
  globe.translucency.backFaceAlpha = 0;
  globe.showGroundAtmosphere = clamped === 0;

  // 关闭地下雾效，避免管廊/BIM 在地下发黑
  globe.undergroundColor = Color.BLACK;
  globe.undergroundColorAlphaByDistance.nearValue = 0;
  globe.undergroundColorAlphaByDistance.farValue = 0;

  viewer.scene.fog.enabled = clamped === 0;
  viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
  viewer.scene.globe.depthTestAgainstTerrain = true;
}

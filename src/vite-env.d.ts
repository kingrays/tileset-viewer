/// <reference types="vite/client" />

interface Window {
  CESIUM_BASE_URL: string;
  __cesiumViewer?: import('cesium').Viewer;
}

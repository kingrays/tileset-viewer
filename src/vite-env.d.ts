/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 可选：生产构建时写入的瓦片代理根地址，如 https://xxx.workers.dev */
  readonly VITE_TILESET_PROXY_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  CESIUM_BASE_URL: string;
  __cesiumViewer?: import('cesium').Viewer;
}

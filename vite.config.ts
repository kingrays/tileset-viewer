import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { tilesetProxyPlugin } from './plugins/tileset-proxy';

const cesiumSource = 'node_modules/cesium/Build/Cesium';
const cesiumBaseUrl = 'cesiumStatic';

/** GitHub Pages 项目站是 /仓库名/，本地开发保持根路径 */
function resolveBase(): string {
  const fromEnv = process.env.BASE_PATH?.trim();
  if (!fromEnv) {
    return '/';
  }
  const withLeading = fromEnv.startsWith('/') ? fromEnv : `/${fromEnv}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

const base = resolveBase();

export default defineConfig({
  base,
  define: {
    CESIUM_BASE_URL: JSON.stringify(`${base}${cesiumBaseUrl}/`),
  },
  plugins: [
    react(),
    tilesetProxyPlugin(),
    viteStaticCopy({
      targets: [
        { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
      ],
    }),
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/.tmp-chrome/**', '**/.tmp-tileset.json', '**/verify-*.png'],
    },
  },
});

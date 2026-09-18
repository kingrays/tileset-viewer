/**
 * 把原始 tileset 地址转换成开发服务器代理地址。
 * 例：http://host/a/tileset.json -> /tileset-proxy/http/host/a/tileset.json
 * GitHub Pages 等纯静态托管没有该代理，直接使用原始地址（需要服务端允许 CORS）。
 */
export function toProxyUrl(url: string): string {
  if (!shouldUseTilesetProxy()) {
    return url;
  }

  const parsed = new URL(url);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return url;
  }
  return `/tileset-proxy/${parsed.protocol.replace(':', '')}/${parsed.host}${parsed.pathname}${parsed.search}`;
}

/** 仅本地 Vite 开发 / preview 有代理中间件 */
function shouldUseTilesetProxy(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  const { hostname, port } = window.location;
  return (hostname === 'localhost' || hostname === '127.0.0.1') && Boolean(port);
}

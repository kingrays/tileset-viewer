/**
 * 把原始 tileset 地址转换成代理地址。
 * 本地：http://host/a/tileset.json -> /tileset-proxy/http/host/a/tileset.json
 * 生产：可配置 HTTPS 代理根地址（如 Cloudflare Worker），避免 Mixed Content / CORS。
 */

/** 规范化用户填写或环境变量中的代理根地址（去掉末尾斜杠） */
export function normalizeProxyBase(raw?: string | null): string {
  const value = raw?.trim() ?? '';
  if (!value) {
    return '';
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '');
  } catch {
    return '';
  }
}

/** 构建时注入的默认生产代理（可选） */
export function getEnvProxyBase(): string {
  return normalizeProxyBase(import.meta.env.VITE_TILESET_PROXY_BASE);
}

/** 当前实际生效的代理根：本地 Vite 优先，否则用页面配置 / 环境变量 */
export function resolveProxyBase(userProxyBase?: string | null): string {
  if (shouldUseLocalTilesetProxy()) {
    return '';
  }
  return normalizeProxyBase(userProxyBase) || getEnvProxyBase();
}

/**
 * HTTPS 页面请求 HTTP 资源会被浏览器直接拦截（Mixed Content）。
 * 无可用代理时提前给出可读错误，避免 Cesium 抛出难懂的网络失败。
 */
export function getMixedContentBlockReason(
  url: string,
  userProxyBase?: string | null,
): string | undefined {
  if (typeof window === 'undefined' || window.location.protocol !== 'https:') {
    return undefined;
  }
  if (resolveProxyBase(userProxyBase)) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:') {
      return undefined;
    }
  } catch {
    return undefined;
  }

  return (
    '当前页面为 HTTPS，浏览器会拦截 HTTP 瓦片请求（Mixed Content）。' +
    '请改用 HTTPS 服务地址，或在右下角配置瓦片代理（见 README 中的 Cloudflare Worker）。'
  );
}

/** 把原始 tileset 地址转换成代理地址；无代理时原样返回 */
export function toProxyUrl(url: string, userProxyBase?: string | null): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return url;
  }

  const path = `/tileset-proxy/${parsed.protocol.replace(':', '')}/${parsed.host}${parsed.pathname}${parsed.search}`;

  if (shouldUseLocalTilesetProxy()) {
    return path;
  }

  const base = resolveProxyBase(userProxyBase);
  if (!base) {
    return url;
  }
  return `${base}${path}`;
}

/** 仅本地 Vite 开发 / preview 有同域代理中间件 */
function shouldUseLocalTilesetProxy(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  const { hostname, port } = window.location;
  return (hostname === 'localhost' || hostname === '127.0.0.1') && Boolean(port);
}

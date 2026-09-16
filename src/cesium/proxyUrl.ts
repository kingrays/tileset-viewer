/**
 * 把原始 tileset 地址转换成开发服务器代理地址。
 * 例：http://host/a/tileset.json -> /tileset-proxy/http/host/a/tileset.json
 */
export function toProxyUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return url;
  }
  return `/tileset-proxy/${parsed.protocol.replace(':', '')}/${parsed.host}${parsed.pathname}${parsed.search}`;
}

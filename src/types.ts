export type BaseMapType = 'img' | 'vec';

export type ServiceLoadState = 'idle' | 'loading' | 'ready' | 'error';

export interface TilesetService {
  id: string;
  name: string;
  url: string;
  visible: boolean;
}

export interface ServiceStatus {
  state: ServiceLoadState;
  message?: string;
}

export interface AppSettings {
  baseMap: BaseMapType;
  /** 0–100，数值越大地表越透明 */
  globeTransparency: number;
  /**
   * 生产环境 HTTPS 瓦片代理根地址（如 Cloudflare Worker 域名）。
   * 留空则仅本地 Vite 代理生效；GitHub Pages 加载 HTTP 服务时必须配置。
   */
  tilesetProxyBase: string;
}

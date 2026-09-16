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
}

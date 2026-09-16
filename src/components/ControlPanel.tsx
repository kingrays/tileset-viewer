import { useEffect, useState, type FormEvent } from 'react';
import type { BaseMapType, ServiceStatus, TilesetService } from '../types';

interface ControlPanelProps {
  tiandituKey: string;
  onSaveKey: (key: string) => void;
  baseMap: BaseMapType;
  onBaseMapChange: (value: BaseMapType) => void;
  globeTransparency: number;
  onTransparencyChange: (value: number) => void;
  services: TilesetService[];
  statuses: Record<string, ServiceStatus>;
  onAddService: (name: string, url: string) => string | void;
  onToggleVisible: (id: string) => void;
  onRemoveService: (id: string) => void;
  onFlyTo: (id: string) => void;
}

export function ControlPanel({
  tiandituKey,
  onSaveKey,
  baseMap,
  onBaseMapChange,
  globeTransparency,
  onTransparencyChange,
  services,
  statuses,
  onAddService,
  onToggleVisible,
  onRemoveService,
  onFlyTo,
}: ControlPanelProps) {
  const [keyDraft, setKeyDraft] = useState(tiandituKey);
  const [showKey, setShowKey] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setKeyDraft(tiandituKey);
  }, [tiandituKey]);

  const handleSaveKey = () => {
    onSaveKey(keyDraft);
  };

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    const error = onAddService(name, url);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError('');
    setName('');
    setUrl('');
  };

  return (
    <aside className="panel">
      <header className="panel-header">
        <h1>3D Tiles 预览</h1>
        <p>天地图底图 + 三维瓦片服务</p>
      </header>

      <section className="panel-section">
        <h2>天地图 Key</h2>
        <label className="field">
          <span>在天地图控制台申请 tk，保存后写入本地浏览器</span>
          <div className="key-row">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyDraft}
              onChange={(event) => setKeyDraft(event.target.value)}
              placeholder="请输入天地图 tk"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="ghost" onClick={() => setShowKey((value) => !value)}>
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>
        </label>
        <button type="button" className="primary" onClick={handleSaveKey}>
          保存 Key
        </button>
        {!tiandituKey && <p className="hint warn">尚未配置 Key，底图不会显示。</p>}
      </section>

      <section className="panel-section">
        <h2>底图与地表</h2>
        <div className="segment">
          <button
            type="button"
            className={baseMap === 'img' ? 'active' : ''}
            onClick={() => onBaseMapChange('img')}
          >
            影像
          </button>
          <button
            type="button"
            className={baseMap === 'vec' ? 'active' : ''}
            onClick={() => onBaseMapChange('vec')}
          >
            矢量
          </button>
        </div>
        <label className="field">
          <span>地表透明度 {globeTransparency}%</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={globeTransparency}
            onChange={(event) => onTransparencyChange(Number(event.target.value))}
          />
        </label>
        <p className="hint">调高透明度可透过地表查看地下管廊、BIM 等服务，相机也可进入地下。</p>
      </section>

      <section className="panel-section">
        <h2>三维服务</h2>
        <form className="service-form" onSubmit={handleAdd}>
          <label className="field">
            <span>服务名称</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：B2F 管廊 BIM"
            />
          </label>
          <label className="field">
            <span>服务地址</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="http://host/path/tileset.json"
              spellCheck={false}
            />
          </label>
          {formError && <p className="hint warn">{formError}</p>}
          <button type="submit" className="primary">
            添加并加载
          </button>
        </form>

        <ul className="service-list">
          {services.length === 0 && <li className="empty">尚未添加三维服务</li>}
          {services.map((service) => {
            const status = statuses[service.id];
            return (
              <li key={service.id} className="service-item">
                <div className="service-main">
                  <strong>{service.name}</strong>
                  <small title={service.url}>{service.url}</small>
                  <em className={`status status-${status?.state ?? 'idle'}`}>
                    {statusLabel(status)}
                  </em>
                </div>
                <div className="service-actions">
                  <button type="button" onClick={() => onToggleVisible(service.id)}>
                    {service.visible ? '隐藏' : '显示'}
                  </button>
                  <button
                    type="button"
                    disabled={status?.state !== 'ready'}
                    onClick={() => onFlyTo(service.id)}
                  >
                    定位
                  </button>
                  <button type="button" className="danger" onClick={() => onRemoveService(service.id)}>
                    删除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}

function statusLabel(status: ServiceStatus | undefined): string {
  if (!status || status.state === 'idle') {
    return '未加载';
  }
  if (status.state === 'loading') {
    return '加载中…';
  }
  if (status.state === 'ready') {
    return '已加载';
  }
  return status.message ?? '加载失败';
}

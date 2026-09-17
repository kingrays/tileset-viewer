import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ServiceStatus, TilesetService } from '../types';

interface ControlPanelProps {
  services: TilesetService[];
  statuses: Record<string, ServiceStatus>;
  onAddService: (name: string, url: string) => string | void;
  onToggleVisible: (id: string) => void;
  onRemoveService: (id: string) => void;
  onFlyTo: (id: string) => void;
}

/** 左侧主面板只展示服务列表，添加表单通过按钮弹出 */
export function ControlPanel({
  services,
  statuses,
  onAddService,
  onToggleVisible,
  onRemoveService,
  onFlyTo,
}: ControlPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState('');
  const addPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (addPanelRef.current?.contains(event.target as Node)) {
        return;
      }
      setAddOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAddOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [addOpen]);

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
    setAddOpen(false);
  };

  return (
    <aside className="panel">
      <header className="panel-header">
        <h1>3D Tiles 预览</h1>
        <p>天地图底图 + 三维瓦片服务</p>
      </header>

      <section className="panel-section panel-list">
        <div className="list-header" ref={addPanelRef}>
          <h2>服务列表</h2>
          <button
            type="button"
            className="primary add-btn"
            aria-expanded={addOpen}
            onClick={() =>
              setAddOpen((value) => {
                if (!value) {
                  setFormError('');
                }
                return !value;
              })
            }
          >
            添加三维服务
          </button>

          {addOpen && (
            <div className="flyout-panel">
              <div className="flyout-header">
                <h2>添加三维服务</h2>
                <button type="button" className="ghost" onClick={() => setAddOpen(false)}>
                  关闭
                </button>
              </div>
              <form className="service-form" onSubmit={handleAdd}>
                <label className="field">
                  <span>服务名称</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="例如：B2F 管廊 BIM"
                    autoFocus
                  />
                </label>
                <label className="field">
                  <span>服务地址</span>
                  <input
                    type="text"
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
            </div>
          )}
        </div>
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

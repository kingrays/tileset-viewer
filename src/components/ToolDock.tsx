import { useEffect, useRef, useState } from 'react';
import { getEnvProxyBase, normalizeProxyBase } from '../cesium/proxyUrl';
import type { BaseMapType } from '../types';

type DockPanel = 'key' | 'globe' | 'proxy' | null;

interface ToolDockProps {
  tiandituKey: string;
  onSaveKey: (key: string) => void;
  baseMap: BaseMapType;
  onBaseMapChange: (value: BaseMapType) => void;
  globeTransparency: number;
  onTransparencyChange: (value: number) => void;
  tilesetProxyBase: string;
  onTilesetProxyBaseChange: (value: string) => void;
  visibleCount: number;
}

/** 右下角工具条：天地图 Key / 地表透明度 / 瓦片代理 */
export function ToolDock({
  tiandituKey,
  onSaveKey,
  baseMap,
  onBaseMapChange,
  globeTransparency,
  onTransparencyChange,
  tilesetProxyBase,
  onTilesetProxyBaseChange,
  visibleCount,
}: ToolDockProps) {
  const [openPanel, setOpenPanel] = useState<DockPanel>(null);
  const [keyDraft, setKeyDraft] = useState(tiandituKey);
  const [proxyDraft, setProxyDraft] = useState(tilesetProxyBase);
  const [showKey, setShowKey] = useState(false);
  const [savedHint, setSavedHint] = useState<'key' | 'proxy' | null>(null);
  const [proxyError, setProxyError] = useState('');
  const dockRef = useRef<HTMLDivElement>(null);
  const envProxyBase = getEnvProxyBase();
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const effectiveProxy = normalizeProxyBase(tilesetProxyBase) || envProxyBase;
  const proxyMissingOnHttps = isHttpsPage && !effectiveProxy;

  useEffect(() => {
    setKeyDraft(tiandituKey);
  }, [tiandituKey]);

  useEffect(() => {
    setProxyDraft(tilesetProxyBase);
  }, [tilesetProxyBase]);

  useEffect(() => {
    if (!openPanel) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (dockRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpenPanel(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPanel(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openPanel]);

  useEffect(() => {
    if (!savedHint) {
      return;
    }
    const timer = window.setTimeout(() => setSavedHint(null), 1600);
    return () => window.clearTimeout(timer);
  }, [savedHint]);

  const handleSaveKey = () => {
    onSaveKey(keyDraft);
    setSavedHint('key');
  };

  const handleSaveProxy = () => {
    const trimmed = proxyDraft.trim();
    if (!trimmed) {
      setProxyError('');
      onTilesetProxyBaseChange('');
      setSavedHint('proxy');
      return;
    }
    const normalized = normalizeProxyBase(trimmed);
    if (!normalized) {
      setProxyError('请填写有效的 http/https 根地址，例如 https://xxx.workers.dev');
      return;
    }
    setProxyError('');
    setProxyDraft(normalized);
    onTilesetProxyBaseChange(normalized);
    setSavedHint('proxy');
  };

  const togglePanel = (panel: Exclude<DockPanel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  return (
    <div className="tool-dock" ref={dockRef}>
      {openPanel === 'key' && (
        <section className="tool-panel">
          <div className="flyout-header">
            <h2>天地图 Key</h2>
            <button type="button" className="ghost" onClick={() => setOpenPanel(null)}>
              关闭
            </button>
          </div>
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
          {savedHint === 'key' && <p className="hint">已保存到本地浏览器</p>}
          {!tiandituKey && <p className="hint warn">尚未配置 Key，底图不会显示。</p>}
        </section>
      )}

      {openPanel === 'globe' && (
        <section className="tool-panel">
          <div className="flyout-header">
            <h2>底图与地表</h2>
            <button type="button" className="ghost" onClick={() => setOpenPanel(null)}>
              关闭
            </button>
          </div>
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
      )}

      {openPanel === 'proxy' && (
        <section className="tool-panel">
          <div className="flyout-header">
            <h2>瓦片代理</h2>
            <button type="button" className="ghost" onClick={() => setOpenPanel(null)}>
              关闭
            </button>
          </div>
          <label className="field">
            <span>HTTPS 页面加载 HTTP 倾斜摄影时需要代理（绕过 Mixed Content / CORS）</span>
            <input
              type="url"
              value={proxyDraft}
              onChange={(event) => {
                setProxyDraft(event.target.value);
                setProxyError('');
              }}
              placeholder="https://your-worker.workers.dev"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="button" className="primary" onClick={handleSaveProxy}>
            保存代理
          </button>
          {proxyError && <p className="hint warn">{proxyError}</p>}
          {savedHint === 'proxy' && (
            <p className="hint">已保存到本地浏览器，服务将按新代理重新加载</p>
          )}
          {envProxyBase && !normalizeProxyBase(tilesetProxyBase) && (
            <p className="hint">构建已注入默认代理：{envProxyBase}</p>
          )}
          {proxyMissingOnHttps && (
            <p className="hint warn">
              当前为 HTTPS 站点且未配置代理，HTTP 的 tileset.json 会被浏览器拦截。请部署
              workers/tileset-proxy.js 后填写 Worker 地址。
            </p>
          )}
          {!isHttpsPage && (
            <p className="hint">本地开发已自动使用 Vite 同域代理，通常无需填写此项。</p>
          )}
        </section>
      )}

      <div className="tool-dock-bar">
        <button
          type="button"
          className={`dock-btn${openPanel === 'key' ? ' active' : ''}${!tiandituKey ? ' warn' : ''}`}
          aria-expanded={openPanel === 'key'}
          onClick={() => togglePanel('key')}
        >
          天地图 Key
        </button>
        <button
          type="button"
          className={`dock-btn${openPanel === 'globe' ? ' active' : ''}`}
          aria-expanded={openPanel === 'globe'}
          onClick={() => togglePanel('globe')}
        >
          地表透明度
        </button>
        <button
          type="button"
          className={`dock-btn${openPanel === 'proxy' ? ' active' : ''}${proxyMissingOnHttps ? ' warn' : ''}`}
          aria-expanded={openPanel === 'proxy'}
          onClick={() => togglePanel('proxy')}
        >
          瓦片代理
        </button>
        <span className="status-pill">已加载服务 {visibleCount} 个</span>
      </div>
    </div>
  );
}

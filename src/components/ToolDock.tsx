import { useEffect, useRef, useState } from 'react';
import type { BaseMapType } from '../types';

type DockPanel = 'key' | 'globe' | null;

interface ToolDockProps {
  tiandituKey: string;
  onSaveKey: (key: string) => void;
  baseMap: BaseMapType;
  onBaseMapChange: (value: BaseMapType) => void;
  globeTransparency: number;
  onTransparencyChange: (value: number) => void;
  visibleCount: number;
}

/** 右下角工具条：点击按钮展开天地图 Key / 地表透明度面板 */
export function ToolDock({
  tiandituKey,
  onSaveKey,
  baseMap,
  onBaseMapChange,
  globeTransparency,
  onTransparencyChange,
  visibleCount,
}: ToolDockProps) {
  const [openPanel, setOpenPanel] = useState<DockPanel>(null);
  const [keyDraft, setKeyDraft] = useState(tiandituKey);
  const [showKey, setShowKey] = useState(false);
  const [savedHint, setSavedHint] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setKeyDraft(tiandituKey);
  }, [tiandituKey]);

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
    const timer = window.setTimeout(() => setSavedHint(false), 1600);
    return () => window.clearTimeout(timer);
  }, [savedHint]);

  const handleSaveKey = () => {
    onSaveKey(keyDraft);
    setSavedHint(true);
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
          {savedHint && <p className="hint">已保存到本地浏览器</p>}
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
        <span className="status-pill">已加载服务 {visibleCount} 个</span>
      </div>
    </div>
  );
}

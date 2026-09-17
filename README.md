# 3D Tiles 预览系统

基于 Cesium 的本地三维瓦片预览工具。可叠加天地图底图，添加多个 `tileset.json` 服务，并透过地表查看地下管廊、BIM 等模型。

## 功能

- 添加、显示/隐藏、定位、删除多个 3D Tiles 服务
- 天地图影像 / 矢量底图（含注记），需自行填写 tk
- 地表透明度可调，相机可进入地下
- 开发与预览模式自动代理瓦片请求，绕过跨域限制
- 天地图 Key、服务列表、底图与透明度写入浏览器 `localStorage`，刷新后保留

## 技术栈

- React 19 + TypeScript
- Vite 7
- Cesium 1.134

## 快速开始

需要 Node.js 18+。推荐使用 pnpm：

```bash
pnpm install
pnpm dev
```

浏览器打开 [http://localhost:5173](http://localhost:5173)。

其他命令：

```bash
pnpm build    # 类型检查并打包
pnpm preview  # 预览生产构建（同样带瓦片代理）
```

也可用 `npm` 或 `yarn` 安装依赖后执行对应脚本。

## 使用说明

1. 右下角打开 **天地图 Key**，填入 [天地图控制台](https://console.tianditu.gov.cn/) 申请的 tk 并保存。未配置时底图不会显示，三维服务仍可加载。
2. 左侧点击 **添加三维服务**，填写名称和 `tileset.json` 的 http/https 地址。
3. 服务加载成功后可 **定位** 到模型；右下角可切换影像/矢量底图，并调节地表透明度。

服务地址示例：

```text
http://example.com/path/tileset.json
```

## 瓦片代理

浏览器直接请求远程 `tileset.json` 常会遇到 CORS。开发服务器会把：

```text
http://host/a/tileset.json
```

改写成：

```text
/tileset-proxy/http/host/a/tileset.json
```

再转发到原始地址。Cesium 按 tileset 所在目录解析相对瓦片路径，因此代理前缀必须保留在 URL 中。`pnpm preview` 同样启用该代理。

生产环境若不用本仓库的 Vite 服务，需要自行处理跨域（反向代理或服务端 CORS）。

## 本地存储

数据保存在当前浏览器，不会上传：

| Key | 内容 |
| --- | --- |
| `tileset-viewer:tianditu-key` | 天地图 tk |
| `tileset-viewer:services` | 服务列表 |
| `tileset-viewer:settings` | 底图类型、地表透明度 |

## 目录结构

```text
src/
  App.tsx                 # 状态与面板编排
  storage.ts              # localStorage 读写
  components/
    ControlPanel.tsx      # 左侧服务列表
    ToolDock.tsx          # 右下角 Key / 底图 / 透明度
  cesium/
    CesiumMap.tsx         # Viewer 与 3D Tiles 加载
    tianditu.ts           # 天地图图层
    globeTransparency.ts  # 地表透明与地下相机
    proxyUrl.ts           # 瓦片地址改写
plugins/
  tileset-proxy.ts        # Vite 开发/预览代理
```

## 许可

私有项目。Cesium、天地图及其数据各自遵循对应许可与服务条款。

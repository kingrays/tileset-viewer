# 3D Tiles 预览系统

基于 Cesium 的本地三维瓦片预览工具。可叠加天地图底图，添加多个 `tileset.json` 服务，并透过地表查看地下管廊、BIM 等模型。

## 功能

- 添加、显示/隐藏、定位、删除多个 3D Tiles 服务
- 天地图影像 / 矢量底图（含注记），需自行填写 tk
- 地表透明度可调，相机可进入地下
- 开发与预览模式自动代理瓦片请求，绕过跨域限制
- GitHub Pages 等 HTTPS 站点可通过「瓦片代理」加载 HTTP 服务（绕过 Mixed Content）
- 天地图 Key、服务列表、底图与透明度、瓦片代理写入浏览器 `localStorage`，刷新后保留

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

## GitHub Pages

GitHub Pages 只能托管静态文件，不能编译 `src/main.tsx`。请用 Actions 发布 `pnpm build` 后的 `dist`：

1. 将本仓库推送到 `main`（工作流见 `.github/workflows/deploy-pages.yml`）。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**（不要选 Deploy from a branch 的源码根目录）。
3. 等待 workflow 成功后访问：`https://<用户名>.github.io/tileset-viewer/`。

### 重要：HTTPS 与 HTTP 瓦片（Mixed Content）

GitHub Pages 页面本身是 **HTTPS**。若倾斜摄影地址是 `http://...`（例如带自定义端口的内网/演示服务），浏览器会直接拦截请求，控制台类似：

```text
Mixed Content: The page was loaded over HTTPS, but requested an insecure XMLHttpRequest endpoint 'http://...'
```

这不是 Cesium 本身坏了，而是浏览器安全策略。可选处理方式：

1. **优先**：把服务改成可公网访问的 **HTTPS** 地址，并允许 CORS。
2. **继续用 HTTP**：部署本仓库的 Cloudflare Worker 代理（见下方），在页面右下角 **瓦片代理** 填入 Worker 域名；或在仓库 Variables 设置 `VITE_TILESET_PROXY_BASE` 后重新部署。

控制台里 `contentscript.js` / `ObjectMultiplex` 一类报错通常来自浏览器扩展（如钱包插件），与本系统无关，可忽略。

## 使用说明

1. 右下角打开 **天地图 Key**，填入 [天地图控制台](https://console.tianditu.gov.cn/) 申请的 tk 并保存。未配置时底图不会显示，三维服务仍可加载。
2. 左侧点击 **添加三维服务**，填写名称和 `tileset.json` 的 http/https 地址。
3. 服务加载成功后可 **定位** 到模型；右下角可切换影像/矢量底图，并调节地表透明度。
4. 在 GitHub Pages 上加载 HTTP 服务时，打开右下角 **瓦片代理** 并填写已部署的代理根地址。

服务地址示例：

```text
http://example.com/path/tileset.json
```

## 瓦片代理

浏览器直接请求远程 `tileset.json` 常会遇到 CORS；在 HTTPS 站点上请求 HTTP 还会触发 Mixed Content。开发服务器会把：

```text
http://host/a/tileset.json
```

改写成：

```text
/tileset-proxy/http/host/a/tileset.json
```

再转发到原始地址。Cesium 按 tileset 所在目录解析相对瓦片路径，因此代理前缀必须保留在 URL 中。`pnpm preview` 同样启用该代理。

### 生产环境（GitHub Pages）

静态托管没有 Node 中间件，需要一个 **HTTPS** 同源外的转发服务，路径约定与本地一致。仓库提供 Cloudflare Worker 脚本：

[`workers/tileset-proxy.js`](workers/tileset-proxy.js)

部署步骤（Cloudflare 免费账号即可）：

1. 打开 [Cloudflare Workers](https://workers.cloudflare.com/) → Create Worker。
2. 将 `workers/tileset-proxy.js` 内容粘贴进去并 Deploy。
3. 记下域名，例如 `https://tileset-proxy.你的账号.workers.dev`。
4. 打开 GitHub Pages 站点 → 右下角 **瓦片代理** → 填入该域名并保存。

也可在仓库 **Settings → Secrets and variables → Actions → Variables** 增加：

| Name                      | 示例值                                  |
| ------------------------- | --------------------------------------- |
| `VITE_TILESET_PROXY_BASE` | `https://tileset-proxy.xxx.workers.dev` |

保存后重新跑 Deploy workflow，构建产物会带上默认代理；页面里仍可用本地设置覆盖。

## 本地存储

数据保存在当前浏览器，不会上传：

| Key                           | 内容                         |
| ----------------------------- | ---------------------------- |
| `tileset-viewer:tianditu-key` | 天地图 tk                    |
| `tileset-viewer:services`     | 服务列表                     |
| `tileset-viewer:settings`     | 底图、透明度、瓦片代理根地址 |

## 目录结构

```text
src/
  App.tsx                 # 状态与面板编排
  storage.ts              # localStorage 读写
  components/
    ControlPanel.tsx      # 左侧服务列表
    ToolDock.tsx          # 右下角 Key / 底图 / 代理
  cesium/
    CesiumMap.tsx         # Viewer 与 3D Tiles 加载
    tianditu.ts           # 天地图图层
    globeTransparency.ts  # 地表透明与地下相机
    proxyUrl.ts           # 瓦片地址改写
plugins/
  tileset-proxy.ts        # Vite 开发/预览代理
workers/
  tileset-proxy.js        # Cloudflare Worker（生产 HTTPS 代理）
```

## 许可

私有项目。Cesium、天地图及其数据各自遵循对应许可与服务条款。

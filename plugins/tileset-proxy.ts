import type { Plugin } from 'vite';
import http from 'node:http';
import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * 将 /tileset-proxy/http/host/path 转发到 http://host/path。
 * Cesium 会按 tileset.json 所在目录解析相对瓦片路径，因此代理前缀必须保留在 URL 中。
 */
function handleProxy(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const rawUrl = req.url ?? '';
  if (!rawUrl.startsWith('/tileset-proxy/')) {
    next();
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  const rest = rawUrl.slice('/tileset-proxy/'.length);
  const slashIndex = rest.indexOf('/');
  const protocol = rest.slice(0, slashIndex);
  if (protocol !== 'http' && protocol !== 'https') {
    res.writeHead(400, errorHeaders());
    res.end('仅支持 http / https 代理');
    return;
  }

  let target: URL;
  try {
    target = new URL(`${protocol}://${rest.slice(slashIndex + 1)}`);
  } catch {
    res.writeHead(400, errorHeaders());
    res.end('无效的代理地址');
    return;
  }

  const transport = protocol === 'https' ? https : http;
  const proxyReq = transport.request(
    target,
    {
      method: req.method,
      headers: {
        host: target.host,
        accept: req.headers.accept ?? '*/*',
        'user-agent': req.headers['user-agent'] ?? 'tileset-viewer',
        ...(req.headers.range ? { range: req.headers.range } : {}),
      },
    },
    (proxyRes) => {
      const headers = { ...proxyRes.headers };
      delete headers['access-control-allow-origin'];
      res.writeHead(proxyRes.statusCode ?? 502, {
        ...headers,
        ...corsHeaders(),
      });
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (error) => {
    if (!res.headersSent) {
      res.writeHead(502, errorHeaders());
      res.end(`代理失败：${error.message}`);
      return;
    }
    res.destroy();
  });

  req.pipe(proxyReq);
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

function errorHeaders(): Record<string, string> {
  return {
    ...corsHeaders(),
    'Content-Type': 'text/plain; charset=utf-8',
  };
}

export function tilesetProxyPlugin(): Plugin {
  return {
    name: 'tileset-proxy',
    configureServer(server) {
      server.middlewares.use(handleProxy);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleProxy);
    },
  };
}

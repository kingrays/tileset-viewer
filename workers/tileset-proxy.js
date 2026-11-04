/**
 * Cloudflare Worker：与 Vite tileset-proxy 插件同路径约定。
 * 例：/tileset-proxy/http/host/a/tileset.json -> http://host/a/tileset.json
 *
 * 部署后把 Worker 域名填到页面右下角「瓦片代理」，或构建时设置
 * VITE_TILESET_PROXY_BASE=https://your-worker.workers.dev
 */
export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith('/tileset-proxy/')) {
      return new Response(
        'tileset-proxy ready。用法：/tileset-proxy/http/host/path 或 /tileset-proxy/https/host/path',
        {
          status: 200,
          headers: {
            ...corsHeaders(),
            'Content-Type': 'text/plain; charset=utf-8',
          },
        },
      );
    }

    const rest = `${url.pathname.slice('/tileset-proxy/'.length)}${url.search}`;
    const slashIndex = rest.indexOf('/');
    const protocol = rest.slice(0, slashIndex);
    if (protocol !== 'http' && protocol !== 'https') {
      return new Response('仅支持 http / https 代理', {
        status: 400,
        headers: errorHeaders(),
      });
    }

    let target;
    try {
      target = new URL(`${protocol}://${rest.slice(slashIndex + 1)}`);
    } catch {
      return new Response('无效的代理地址', {
        status: 400,
        headers: errorHeaders(),
      });
    }

    try {
      const upstreamHeaders = {
        Accept: request.headers.get('Accept') ?? '*/*',
        'User-Agent': request.headers.get('User-Agent') ?? 'tileset-viewer-proxy',
      };
      const range = request.headers.get('Range');
      if (range) {
        upstreamHeaders.Range = range;
      }

      const proxyRes = await fetch(target.toString(), {
        method: request.method,
        headers: upstreamHeaders,
      });

      const headers = new Headers(proxyRes.headers);
      headers.delete('access-control-allow-origin');
      for (const [key, value] of Object.entries(corsHeaders())) {
        headers.set(key, value);
      }

      return new Response(proxyRes.body, {
        status: proxyRes.status,
        headers,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return new Response(`代理失败：${message}`, {
        status: 502,
        headers: errorHeaders(),
      });
    }
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

function errorHeaders() {
  return {
    ...corsHeaders(),
    'Content-Type': 'text/plain; charset=utf-8',
  };
}

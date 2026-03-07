import { createServer as createNetServer, connect } from "node:net";
import http from "node:http";
import { spawn } from "node:child_process";

const START_PORT = 5173;
const HOST = "127.0.0.1";
const AUTH_PROXY_PORT = 4180;
const MAX_PORT = 65535;

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = createNetServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, HOST);
  });

const findAvailablePort = async (startPort) => {
  for (let port = startPort; port <= MAX_PORT; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(
    `利用可能なポートが見つかりませんでした (${startPort}-${MAX_PORT})`,
  );
};

const createProxyServer = (targetPort) => {
  const server = http.createServer((request, response) => {
    const upstream = http.request(
      {
        hostname: HOST,
        port: targetPort,
        method: request.method,
        path: request.url,
        headers: request.headers,
      },
      (upstreamResponse) => {
        response.writeHead(
          upstreamResponse.statusCode ?? 502,
          upstreamResponse.headers,
        );
        upstreamResponse.pipe(response);
      },
    );

    upstream.on("error", (error) => {
      response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
      response.end(`proxy error: ${error.message}`);
    });

    request.pipe(upstream);
  });

  server.on("upgrade", (request, socket, head) => {
    const upstream = connect(targetPort, HOST, () => {
      const headerLines = [
        `${request.method} ${request.url} HTTP/${request.httpVersion}`,
        ...Object.entries(request.headers).flatMap(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map((entry) => `${key}: ${entry}`);
          }

          return value === undefined ? [] : [`${key}: ${value}`];
        }),
        "",
        "",
      ];

      upstream.write(headerLines.join("\r\n"));

      if (head.length > 0) {
        upstream.write(head);
      }

      upstream.pipe(socket);
      socket.pipe(upstream);
    });

    const closeSockets = () => {
      if (!socket.destroyed) {
        socket.destroy();
      }
      if (!upstream.destroyed) {
        upstream.destroy();
      }
    };

    upstream.on("error", closeSockets);
    socket.on("error", closeSockets);
  });

  return server;
};

const run = async () => {
  const port = await findAvailablePort(START_PORT);
  const authProxyAvailable = await isPortAvailable(AUTH_PROXY_PORT);

  if (!authProxyAvailable) {
    throw new Error(
      `認証用プロキシのポート ${AUTH_PROXY_PORT} は既に使用中です。`,
    );
  }

  const proxyServer = createProxyServer(port);
  await new Promise((resolve, reject) => {
    proxyServer.once("error", reject);
    proxyServer.listen(AUTH_PROXY_PORT, HOST, resolve);
  });

  const child = spawn(
    process.platform === "win32" ? "pnpm.cmd" : "pnpm",
    ["exec", "vite", "dev", "--host", HOST, "--port", String(port)],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:4180",
      },
    },
  );

  console.log(
    `\nVite: http://${HOST}:${port}\nAuth proxy: http://localhost:${AUTH_PROXY_PORT}\n`,
  );

  const shutdown = () => {
    proxyServer.close();
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  child.on("exit", (code, signal) => {
    proxyServer.close();
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

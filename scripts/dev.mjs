import { createServer } from 'node:net';
import { spawn } from 'node:child_process';

const START_PORT = 5173;
const HOST = '127.0.0.1';
const MAX_PORT = 65535;

const isPortAvailable = (port) =>
	new Promise((resolve) => {
		const server = createServer();

		server.once('error', () => resolve(false));
		server.once('listening', () => {
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

	throw new Error(`利用可能なポートが見つかりませんでした (${startPort}-${MAX_PORT})`);
};

const run = async () => {
	const port = await findAvailablePort(START_PORT);

	const child = spawn(
		process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
		['exec', 'vite', 'dev', '--port', String(port)],
		{ stdio: 'inherit' }
	);

	child.on('exit', (code, signal) => {
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

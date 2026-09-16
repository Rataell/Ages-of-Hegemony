import { createHttpServer } from './http.js';

const port = Number(process.env.PORT ?? 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
const server = createHttpServer();
server.listen(port, '127.0.0.1', () => console.log(`Ages of Hegemony server: http://127.0.0.1:${port}/health`));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close());

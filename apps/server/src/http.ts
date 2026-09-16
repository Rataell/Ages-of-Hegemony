import { createServer } from 'node:http';

// Read-only transport shell. Mutating routes await authentication and lobby design.
export function createHttpServer() {
  return createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200).end(JSON.stringify({ service: 'ages-of-hegemony', status: 'ok', stage: 'foundation' }));
    } else {
      response.writeHead(404).end(JSON.stringify({ error: 'NOT_FOUND' }));
    }
  });
}

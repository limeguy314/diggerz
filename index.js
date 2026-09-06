'use strict';

/**
 * diggerz-server — serves the HTML client + WebSocket game protocol.
 *
 * Local:  http://localhost:10000/
 * Render: https://YOUR-SERVICE.onrender.com/
 *
 * Client auto-connects to the same host (see public/index.html boot script).
 * Use ?local=1 to force the in-browser Dig+Trade service instead.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { Room } = require('./room');

const PORT = Number(process.env.PORT) || 10000;
const PUBLIC = path.join(__dirname, '..', 'public');
const room = new Room(process.env.WORLD_NAME || 'Free Dig');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain' });
      res.end(err.code === 'ENOENT' ? 'not found' : 'error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        service: 'diggerz-server',
        players: room.players.size,
        world: room.name,
      })
    );
    return;
  }

  // Static client
  let rel = url === '/' ? '/index.html' : url;
  rel = path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC, rel);
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  sendFile(res, filePath);
});

const wss = new WebSocketServer({
  server,
  handleProtocols: (protocols) => {
    const list = [...protocols];
    if (list.length === 0) return false;
    return list[0];
  },
});

wss.on('connection', (ws, req) => {
  const proto = req.headers['sec-websocket-protocol'] || '';
  console.log('client connected', { proto, ip: req.socket.remoteAddress });

  room.addClient(ws);
  room.onOpen(ws);

  ws.on('message', (data) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    try {
      room.onMessage(ws, buf);
    } catch (e) {
      console.error('packet error', e);
    }
  });

  ws.on('close', () => {
    room.removeClient(ws);
    console.log('client disconnected', { players: room.players.size });
  });

  ws.on('error', (err) => {
    console.error('ws error', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`diggerz-server listening on :${PORT}`);
  console.log(`game:   http://localhost:${PORT}/`);
  console.log(`health: http://localhost:${PORT}/health`);
});

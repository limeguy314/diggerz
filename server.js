/*
 * Diggerz multiplayer bridge server (JSON)
 * Works with the full client that keeps local dig/inv/skin and syncs via WS.
 *
 * Messages (client → server):
 *   { t:"join", name, x, y }
 *   { t:"move", x, y }
 *   { t:"tile", x, y, id }
 *   { t:"hit", x, y, stage }
 *
 * Messages (server → client):
 *   { t:"welcome", id, tiles, players:[{id,name,x,y}] }
 *   { t:"player", id, name, x, y }
 *   { t:"move", id, name, x, y }
 *   { t:"leave", id }
 *   { t:"tile", x, y, id }
 *   { t:"hit", x, y, stage }
 *
 * Room resets when the last player leaves.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const HTML_CANDIDATES = [
  path.join(__dirname, "diggerz-multiplayer.html"),
  path.join(__dirname, "diggerz-fixed-build15.html"),
  path.join(__dirname, "diggerz-original-multiplayer.html"),
];

function resolveHtmlFile() {
  for (const file of HTML_CANDIDATES) {
    if (fs.existsSync(file)) return file;
  }
  return HTML_CANDIDATES[0];
}

const HTML_FILE = resolveHtmlFile();

const WIDTH = 80;
const HEIGHT = 48;
const TILE_GRASS = 100;
const TILE_DIRT = 108;

const rooms = new Map();

function makeWorld() {
  const tiles = new Array(WIDTH * HEIGHT).fill(0);
  for (let x = 0; x < WIDTH; x++) {
    let surface = 13 + Math.floor(1.8 * Math.sin(x / 7) + 1.2 * Math.sin(x / 3.3));
    if (x < 12) surface = 14;
    for (let y = 0; y < HEIGHT; y++) {
      const cave =
        y > surface + 5 &&
        Math.sin(x * 0.47 + y * 0.31) + Math.sin(x * 0.13 - y * 0.57) > 1.35;
      const solid = y >= surface;
      tiles[x + y * WIDTH] =
        solid && !cave ? (y === surface ? TILE_GRASS : TILE_DIRT) : 0;
    }
  }
  for (let x = 4; x < 14; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      tiles[x + y * WIDTH] = y >= 14 ? (y === 14 ? TILE_GRASS : TILE_DIRT) : 0;
    }
  }
  return tiles;
}

function getRoom(name) {
  let room = rooms.get(name);
  if (!room) {
    room = { name, tiles: makeWorld(), players: new Map() };
    rooms.set(name, room);
    console.log("[room] created", name);
  }
  return room;
}

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function broadcast(room, obj, except) {
  const data = JSON.stringify(obj);
  for (const p of room.players.values()) {
    if (p.ws !== except && p.ws.readyState === 1) p.ws.send(data);
  }
}

function playerList(room) {
  const list = [];
  for (const p of room.players.values()) {
    list.push({ id: p.id, name: p.name, x: p.x, y: p.y });
  }
  return list;
}

function safeName(name) {
  name = String(name || "Player").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!name || name === "Enter Name") name = "Player";
  return name.slice(0, 24);
}

const httpServer = http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  if (url.pathname === "/health") {
    const info = [];
    for (const [n, r] of rooms) info.push(n + ":" + r.players.size);
    res.writeHead(200, { "content-type": "text/plain" });
    res.end(
      "diggerz bridge ok\nhtml=" +
        path.basename(HTML_FILE) +
        " exists=" +
        fs.existsSync(HTML_FILE) +
        "\nrooms=" +
        (info.join(", ") || "(none)") +
        "\n"
    );
    return;
  }
  if (
    url.pathname === "/" ||
    url.pathname === "/index.html" ||
    url.pathname === "/diggerz-multiplayer.html"
  ) {
    fs.readFile(HTML_FILE, (err, data) => {
      if (err) {
        res.writeHead(500, { "content-type": "text/plain" });
        res.end("Game HTML missing\n");
        return;
      }
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(data);
    });
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "/", "http://localhost");
  const roomName =
    (url.searchParams.get("room") || "public").trim().slice(0, 64) || "public";
  const room = getRoom(roomName);

  const player = {
    id: crypto.randomBytes(8).toString("hex"),
    name: "Player",
    x: 8,
    y: 12,
    ws,
    room,
  };
  ws.player = player;

  console.log("[ws] connect", player.id, "room", roomName);

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch (e) {
      return;
    }
    if (!msg || !msg.t) return;

    if (msg.t === "join") {
      player.name = safeName(msg.name);
      if (Number.isFinite(msg.x)) player.x = msg.x;
      if (Number.isFinite(msg.y)) player.y = msg.y;
      room.players.set(player.id, player);

      send(ws, {
        t: "welcome",
        id: player.id,
        tiles: room.tiles,
        players: playerList(room).filter((p) => p.id !== player.id),
      });

      broadcast(
        room,
        { t: "player", id: player.id, name: player.name, x: player.x, y: player.y },
        ws
      );
      console.log("[join]", player.name, player.id, "players", room.players.size);
      return;
    }

    if (!room.players.has(player.id)) return;

    if (msg.t === "move") {
      if (Number.isFinite(msg.x)) player.x = msg.x;
      if (Number.isFinite(msg.y)) player.y = msg.y;
      broadcast(
        room,
        { t: "move", id: player.id, name: player.name, x: player.x, y: player.y },
        ws
      );
      return;
    }

    if (msg.t === "tile") {
      const x = msg.x | 0;
      const y = msg.y | 0;
      const id = msg.id | 0;
      if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
      room.tiles[x + y * WIDTH] = id;
      broadcast(room, { t: "tile", x, y, id }, ws);
      console.log("[tile]", player.name, x, y, id);
      return;
    }

    if (msg.t === "hit") {
      broadcast(
        room,
        { t: "hit", x: msg.x | 0, y: msg.y | 0, stage: msg.stage | 0 },
        ws
      );
      return;
    }
  });

  ws.on("close", () => {
    if (room.players.has(player.id)) {
      room.players.delete(player.id);
      broadcast(room, { t: "leave", id: player.id });
      console.log("[leave]", player.name, "left", room.players.size);
      if (room.players.size === 0) {
        rooms.delete(room.name);
        console.log("[room] reset", room.name);
      }
    }
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log("Diggerz bridge on", HOST + ":" + PORT);
  console.log("HTML:", HTML_FILE, "exists=", fs.existsSync(HTML_FILE));
});

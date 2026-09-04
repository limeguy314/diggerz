/*
 * Diggerz multiplayer server — protocol matched to the full client
 * (diggerz-fixed-build15 / diggerz-multiplayer.html DiggerzService flow)
 *
 * Client request → server response:
 *   2   login          → 2 login
 *   4   world request  → 95 world name + 4 world tiles
 *   18  spawn/ready    → 5 self + others, 14 inventory, 143 access, 17 coins, chat
 *   6   movement       → broadcast 6 to others
 *   11  build          → broadcast 11 tile
 *   287 dig            → broadcast 68 hit / 11 tile + 14 inventory to miner
 *   12  chat           → broadcast 13
 *   14  inventory req  → 14 inventory
 *
 * Room is destroyed (map resets) when the last player leaves.
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
const DURABILITY = 5;
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

function makeRoom(roomName) {
  return {
    roomName,
    tiles: makeWorld(),
    players: new Map(),
    damage: new Map(),
  };
}

function getRoom(roomName) {
  let room = rooms.get(roomName);
  if (!room) {
    room = makeRoom(roomName);
    rooms.set(roomName, room);
    console.log("[room] created", roomName);
  }
  return room;
}

function int32(value) {
  return value | 0;
}

class Reader {
  constructor(buffer) {
    this.b = Buffer.from(buffer);
    this.o = 0;
  }
  u16() {
    if (this.o + 2 > this.b.length) return 0;
    const v = this.b.readUInt16LE(this.o);
    this.o += 2;
    return v;
  }
  i32() {
    if (this.o + 4 > this.b.length) return 0;
    const v = this.b.readInt32LE(this.o);
    this.o += 4;
    return v;
  }
  q4() {
    const whole = this.i32();
    const frac = this.i32();
    return whole + frac / 100000;
  }
  r1() {
    if (this.o + 1 > this.b.length) return 0;
    return this.b[this.o++];
  }
  r5() {
    const len = this.i32();
    if (len <= 0 || this.o + len > this.b.length) return "";
    const end = this.o + len - 1;
    const value = this.b.subarray(this.o, end).toString("latin1");
    this.o += len;
    return value;
  }
  guid() {
    return [this.i32(), this.i32(), this.i32(), this.i32()];
  }
}

class Writer {
  constructor(opcode, status = 1) {
    this.parts = [];
    this.u16(opcode);
    this.u16(status);
  }
  u16(v) {
    const b = Buffer.allocUnsafe(2);
    b.writeUInt16LE(v & 0xffff, 0);
    this.parts.push(b);
  }
  i32(v) {
    const b = Buffer.allocUnsafe(4);
    b.writeInt32LE(int32(v), 0);
    this.parts.push(b);
  }
  r8(v) {
    const whole = Math.floor(Number(v) || 0);
    const frac = Math.floor(100000 * ((Number(v) || 0) - whole));
    this.i32(whole);
    this.i32(frac);
  }
  byte(v) {
    this.parts.push(Buffer.from([v & 255]));
  }
  bool(v) {
    this.byte(v ? 1 : 0);
  }
  guid(g) {
    for (const v of g) this.i32(v);
  }
  str(text) {
    text = String(text ?? "");
    const chars = Buffer.allocUnsafe(text.length);
    for (let i = 0; i < text.length; i++) chars[i] = text.charCodeAt(i) & 255;
    this.i32(text.length + 1);
    this.parts.push(chars, Buffer.from([0]));
  }
  finish() {
    let out = Buffer.concat(this.parts);
    const pad = (8 - (out.length % 8)) % 8;
    if (pad) out = Buffer.concat([out, Buffer.alloc(pad)]);
    return out;
  }
}

function newGuid() {
  const bytes = crypto.randomBytes(16);
  const g = [];
  for (let i = 0; i < 4; i++) g.push(bytes.readInt32LE(i * 4));
  return g;
}

function safeName(name) {
  name = String(name || "Player").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (!name || name === "Enter Name") name = "Player";
  return name.slice(0, 24);
}

function send(ws, writer) {
  if (ws.readyState === 1) ws.send(writer.finish());
}

function broadcast(room, writer, exceptWs = null) {
  const data = writer.finish();
  for (const player of room.players.values()) {
    if (player.ws !== exceptWs && player.ws.readyState === 1) {
      player.ws.send(data);
    }
  }
}

function packetLogin(player) {
  const w = new Writer(2, 1);
  w.guid(player.id);
  w.guid(player.pocketId);
  w.guid([0, 0, 0, 0]);
  w.str("0.946");
  w.bool(true);
  w.str("0:reconstructed");
  for (let i = 0; i < 7; i++) w.guid([0, 0, 0, 0]);
  return w;
}

function packetWorld(room) {
  const w = new Writer(4, 1);
  w.i32(0);
  w.u16(WIDTH);
  w.u16(5);
  w.u16(HEIGHT);

  const chunksX = Math.ceil(WIDTH / 4);
  const chunksY = Math.ceil(HEIGHT / 4);
  w.i32(chunksX * chunksY);

  for (let cx = 0; cx < chunksX; cx++) {
    for (let cy = 0; cy < chunksY; cy++) {
      w.i32(cx);
      w.i32(0);
      w.i32(cy);
      for (let dx = 0; dx < 4; dx++) {
        for (let dl = 0; dl < 4; dl++) {
          for (let dy = 0; dy < 4; dy++) {
            const x = cx * 4 + dx;
            const y = cy * 4 + dy;
            const id =
              dl === 0 && x < WIDTH && y < HEIGHT
                ? room.tiles[x + y * WIDTH]
                : 0;
            w.u16(id);
          }
        }
      }
    }
  }
  return w;
}

function packetWorldName() {
  const w = new Writer(95, 1);
  w.str("Free Dig");
  return w;
}

function packetPlayer(player) {
  const w = new Writer(5, 1);
  w.guid(player.id);
  w.str(player.name);
  w.r8(player.x);
  w.r8(0);
  w.r8(player.y);
  w.r8(0);

  const appearance = player.appearance || new Array(11).fill(0);
  w.u16(appearance.length);
  for (const id of appearance) w.u16(id || 0);
  w.str(player.appearanceText || "");

  w.u16(0);
  w.byte(0);
  w.u16(0);
  w.bool(false);
  w.u16(1);
  w.i32(0);
  w.bool(false);
  w.i32(0);
  w.u16(0);
  w.guid([0, 0, 0, 0]);
  w.i32(0);
  w.r8(0.9);
  w.r8(1);
  return w;
}

function packetMovement(player) {
  const w = new Writer(6, 1);
  w.guid(player.id);
  w.r8(player.x);
  w.r8(player.y);
  w.r8(0);
  w.r8(0);
  w.r8(0);
  w.r8(0);
  w.u16(0);
  w.byte(0);
  w.byte(0);
  w.u16(0);
  w.u16(0);
  return w;
}

function packetRemovePlayer(player) {
  const w = new Writer(3, 1);
  w.guid(player.id);
  return w;
}

function packetChat(text) {
  const w = new Writer(13, 1);
  w.byte(0);
  w.str(text);
  return w;
}

function packetTile(x, y, id) {
  const w = new Writer(11, 1);
  w.u16(1);
  w.i32(x);
  w.i32(0);
  w.i32(y);
  w.u16(id & 2047);
  return w;
}

function packetHit(x, y, stage) {
  const w = new Writer(68, 1);
  w.r8(x);
  w.r8(0);
  w.r8(y);
  w.i32(stage);
  return w;
}

function packetInventory(player) {
  const w = new Writer(14, 1);
  w.guid(player.id);
  w.i32(0);

  const slots = player.slots;
  w.byte(Math.min(127, slots.length));
  const texts = [];

  for (let i = 0; i < slots.length && i < 127; i++) {
    const item = slots[i] || {
      category: 0,
      id: 0,
      variant: 0,
      count: 0,
      extra: 0,
      text: "",
    };
    w.byte(item.category);
    w.u16((item.id & 2047) | ((item.variant & 31) << 11));
    w.u16(item.count);
    w.u16(item.extra || 0);
    if (item.text) texts.push([i, item.text]);
  }

  w.u16(texts.length);
  for (const [i, text] of texts) {
    w.u16(i);
    w.str(text);
  }
  return w;
}

function packetAccess() {
  const w = new Writer(143, 1);
  w.bool(true);
  w.bool(false);
  return w;
}

function packetCoins(coins) {
  const w = new Writer(17, 1);
  w.i32(coins || 0);
  return w;
}

function initialSlots() {
  const slots = [];
  for (let i = 0; i < 20; i++) {
    slots.push({ category: 0, id: 0, variant: 0, count: 0, extra: 0, text: "" });
  }
  slots[0] = { category: 2, id: 240, variant: 1, count: 1, extra: 0, text: "" };
  slots[1] = {
    category: 1,
    id: TILE_GRASS,
    variant: 0,
    count: 24,
    extra: 0,
    text: "",
  };
  slots[2] = {
    category: 1,
    id: TILE_DIRT,
    variant: 0,
    count: 40,
    extra: 0,
    text: "",
  };
  return slots;
}

function addBlockToInventory(player, id, amount = 1) {
  for (const slot of player.slots) {
    if (slot.category === 1 && slot.id === id) {
      slot.count = Math.min(65535, slot.count + amount);
      return true;
    }
  }
  for (const slot of player.slots) {
    if (!slot.category || !slot.count) {
      slot.category = 1;
      slot.id = id;
      slot.variant = 0;
      slot.count = amount;
      slot.extra = 0;
      slot.text = "";
      return true;
    }
  }
  return false;
}

function createPlayer(ws, room, name) {
  const n = room.players.size;
  return {
    ws,
    room,
    id: newGuid(),
    pocketId: newGuid(),
    name: safeName(name),
    x: 8 + (n % 5),
    y: 12,
    appearance: [0, 0, 0, 0, 240, 0, 0, 0, 0, 0, 0],
    appearanceText: "",
    slots: initialSlots(),
    coins: 0,
    spawned: false,
  };
}

function handleLogin(ws, room, reader) {
  let name = "Player";
  try {
    if (reader.o + 4 <= reader.b.length) {
      const maybeLen = reader.b.readInt32LE(reader.o);
      if (maybeLen < 0 || maybeLen > 200) {
        reader.u16();
      }
    }
    reader.r5();
    reader.r5();
    name = reader.r5() || name;
  } catch (e) {}

  const player = createPlayer(ws, room, name);
  ws.player = player;
  room.players.set(player.id.join(","), player);

  console.log(
    "[login]",
    player.name,
    "room=",
    room.roomName,
    "players=",
    room.players.size
  );

  send(ws, packetLogin(player));
}

function spawnPlayer(ws, room, player) {
  send(ws, packetPlayer(player));

  for (const other of room.players.values()) {
    if (other === player) continue;
    send(ws, packetPlayer(other));
    send(ws, packetMovement(other));
  }

  broadcast(room, packetPlayer(player), ws);
  broadcast(room, packetMovement(player), ws);

  send(ws, packetInventory(player));
  send(ws, packetAccess());
  send(ws, packetCoins(player.coins));
  send(
    ws,
    packetChat(
      "^2Shared multiplayer world. ^7Players in this room share the same map."
    )
  );
  send(
    ws,
    packetChat(
      "^7WASD moves. Mine with the pickaxe. Place blocks from the toolbar."
    )
  );

  player.spawned = true;
  console.log("[spawn]", player.name, "others=", room.players.size - 1);
}

function parseBuild(room, player, reader) {
  reader.q4();
  reader.q4();
  reader.q4();
  reader.q4();
  const id = reader.u16();
  const x = reader.i32();
  const layer = reader.i32();
  const y = reader.i32();
  const slot = reader.u16();
  reader.u16();
  reader.r1();

  if (layer !== 0 || x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  if (Math.hypot(x - player.x, y - player.y) > 5) return;
  if (y <= 0 || y >= HEIGHT - 1) return;
  if (room.tiles[x + y * WIDTH]) return;
  if (Math.hypot(x - player.x, y - player.y) < 1.1) return;

  const item = player.slots[slot];
  if (!item || item.category !== 1 || item.id !== id || item.count <= 0) return;

  item.count--;
  room.tiles[x + y * WIDTH] = id;
  room.damage.delete(x + ":" + y);

  for (const p of room.players.values()) {
    if (p.ws.readyState === 1) send(p.ws, packetTile(x, y, id));
  }
  send(player.ws, packetInventory(player));
  console.log("[build]", player.name, x, y, id);
}

function parseMovement(room, player, reader) {
  const x = reader.q4();
  const y = reader.q4();
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;

  player.x = Math.max(1, Math.min(WIDTH - 2, x));
  player.y = Math.max(1, Math.min(HEIGHT - 2, y));

  broadcast(room, packetMovement(player), player.ws);
}

function parseDig(room, player, reader) {
  const attackX = reader.q4();
  const attackY = reader.q4();
  reader.q4();
  reader.q4();
  const attackType = reader.r1();
  reader.i32();

  if (![25, 21, 36, 40].includes(attackType)) return;

  const x = Math.round(attackX);
  const y = Math.round(attackY);
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  if (Math.hypot(x - player.x, y - player.y) > 3.6) return;

  const id = room.tiles[x + y * WIDTH];
  if (!id) return;

  const key = x + ":" + y;
  const hits = (room.damage.get(key) || 0) + 1;
  room.damage.set(key, hits);

  for (const p of room.players.values()) {
    if (p.ws.readyState === 1) send(p.ws, packetHit(x, y, hits));
  }

  if (hits < DURABILITY) return;

  room.damage.delete(key);
  room.tiles[x + y * WIDTH] = 0;

  for (const p of room.players.values()) {
    if (p.ws.readyState === 1) send(p.ws, packetTile(x, y, 0));
  }

  addBlockToInventory(player, id, 1);
  send(player.ws, packetInventory(player));
  console.log("[dig]", player.name, x, y, "broke", id);
}

function parseChat(room, player, reader) {
  const text = reader.r5().replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  if (!text) return;
  const clipped = text.slice(0, 160);

  if (clipped.toLowerCase() === "/help") {
    send(
      player.ws,
      packetChat(
        "^7WASD moves. Mine blocks with the pickaxe. Place Grass/Dirt from the toolbar."
      )
    );
    return;
  }

  for (const p of room.players.values()) {
    if (p.ws.readyState === 1) {
      send(p.ws, packetChat("^7[" + player.name + "] " + clipped));
    }
  }
}

function handlePacket(ws, data) {
  const reader = new Reader(data);
  const opcode = reader.u16();
  const room = ws.player ? ws.player.room : ws.room;
  if (!room) return;

  if (opcode === 2) {
    handleLogin(ws, room, reader);
    return;
  }

  const player = ws.player;
  if (!player) {
    console.log("[warn] packet", opcode, "before login");
    return;
  }

  switch (opcode) {
    case 4:
      send(ws, packetWorldName());
      send(ws, packetWorld(room));
      break;

    case 18:
      spawnPlayer(ws, room, player);
      break;

    case 6:
      parseMovement(room, player, reader);
      break;

    case 11:
      parseBuild(room, player, reader);
      break;

    case 12:
      parseChat(room, player, reader);
      break;

    case 14:
      send(ws, packetInventory(player));
      break;

    case 51:
      try {
        reader.i32();
      } catch (e) {}
      parseChat(room, player, reader);
      break;

    case 287:
      parseDig(room, player, reader);
      break;

    case 288:
      break;

    default:
      break;
  }
}

function removePlayer(ws) {
  const player = ws.player;
  if (!player) return;
  const room = player.room;

  room.players.delete(player.id.join(","));
  broadcast(room, packetRemovePlayer(player));
  console.log(
    "[leave]",
    player.name,
    "room=",
    room.roomName,
    "left=",
    room.players.size
  );

  if (room.players.size === 0) {
    rooms.delete(room.roomName);
    console.log("[room] destroyed (map reset)", room.roomName);
  }
  ws.player = null;
}

setInterval(() => {
  for (const room of rooms.values()) {
    for (const player of room.players.values()) {
      if (!player.spawned) continue;
      broadcast(room, packetMovement(player), player.ws);
    }
  }
}, 500);

const httpServer = http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");

  if (url.pathname === "/health") {
    const roomInfo = [];
    for (const [name, room] of rooms) {
      roomInfo.push(name + ":" + room.players.size);
    }
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end(
      "diggerz multiplayer server ok\n" +
        "html=" +
        path.basename(HTML_FILE) +
        " exists=" +
        fs.existsSync(HTML_FILE) +
        "\n" +
        "rooms=" +
        (roomInfo.join(", ") || "(none)") +
        "\n"
    );
    return;
  }

  if (
    url.pathname === "/" ||
    url.pathname === "/diggerz-multiplayer.html" ||
    url.pathname === "/index.html" ||
    url.pathname === "/diggerz-fixed-build15.html"
  ) {
    fs.readFile(HTML_FILE, (err, data) => {
      if (err) {
        res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
        res.end(
          "Game HTML missing.\nLooked for:\n" +
            HTML_CANDIDATES.map((f) => " - " + path.basename(f)).join("\n") +
            "\n"
        );
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

  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

const wss = new WebSocketServer({
  server: httpServer,
  handleProtocols: (protocols) => {
    if (!protocols || protocols.size === 0) return false;
    const first = protocols.values().next().value;
    return first || false;
  },
});

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "/", "http://localhost");
  const roomName =
    (url.searchParams.get("room") || "public").trim().slice(0, 64) || "public";
  const room = getRoom(roomName);
  ws.room = room;

  console.log("[ws] connect room=", roomName, "from", req.socket.remoteAddress);

  ws.on("message", (data) => {
    try {
      handlePacket(ws, data);
    } catch (err) {
      console.error("packet error:", err);
    }
  });

  ws.on("close", () => removePlayer(ws));
  ws.on("error", () => removePlayer(ws));
});

httpServer.listen(PORT, HOST, () => {
  console.log("Diggerz multiplayer server listening on " + HOST + ":" + PORT);
  console.log(
    "Serving HTML: " + HTML_FILE + " (exists=" + fs.existsSync(HTML_FILE) + ")"
  );
});

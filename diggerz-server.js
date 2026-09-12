'use strict';

const http = require('http');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_ROOM_PLAYERS = 10;
const MAX_MESSAGE_BYTES = 64 * 1024;
const MAX_MESSAGES_PER_SECOND = 180;
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const ALLOWED_RELAY_TYPES = new Set(['session', 'hello', 'chat', 'typing', 'health']);
const BUILD = '23.2';
const WORLD_WIDTH = 128;
const BATTLE_BUILD_MS = Number(process.env.DIGGERZ_BUILD_MS || 40 * 1000);
const BATTLE_FIRST_SHRINK_MS = Number(process.env.DIGGERZ_FIRST_SHRINK_MS || 90 * 1000);
const BATTLE_SHRINK_INTERVAL_MS = Number(process.env.DIGGERZ_SHRINK_INTERVAL_MS || 60 * 1000);
const BATTLE_SHRINK_WARNING_MS = Number(process.env.DIGGERZ_SHRINK_WARNING_MS || 3 * 1000);
const BATTLE_SHRINK_STEP = Number(process.env.DIGGERZ_SHRINK_STEP || 8);
const BATTLE_MIN_LEFT = -0.5;
const BATTLE_MAX_RIGHT = WORLD_WIDTH - 0.5;
const BATTLE_MIN_PLAY_WIDTH = 12;
const BATTLE_MAX_INSET = Math.max(0, Math.floor((WORLD_WIDTH - BATTLE_MIN_PLAY_WIDTH) / 2));
const PROJECTILE_ATTACKS = new Set([20,22,23,29,31,33,35,37,39]);
const GAME_HTML_PATH = path.join(__dirname, 'index.html');
const MAP_EDITOR_PATH = path.join(__dirname, 'map-editor.html');
const TILES_PNG_PATH = path.join(__dirname, 'tiles.png');
const BKND_PNG_PATH = path.join(__dirname, 'bknd.png');
const LEVELUP_OGG_PATH = path.join(__dirname, 'levelup.ogg');
const MUSIC_OGG_PATHS = [1,2,3,4].map((n,i)=>path.join(__dirname, i===0?'music_theme.ogg':`music_theme${n}.ogg`));
const BALLOON_POP_OGG_PATH = path.join(__dirname, 'balloon_pop.ogg');
const SWAP_OGG_PATH = path.join(__dirname, 'swap.ogg');
const MAPS_DIR = path.join(__dirname, 'maps');

const DIGGERZ_ADMIN_EMAILS = (process.env.DIGGERZ_ADMIN_EMAILS || 'limeroni413@gmail.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const AUTH_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const AUTH_ACCOUNTS_PATH = path.join(__dirname, 'data', 'accounts.json');
const authSessions = new Map();
 

let gameHtml = null;
let mapEditorHtml = null;
let tilesPng = null;
let bkndPng = null;
let levelupOgg = null;
let musicOgg = [null,null,null,null];
let balloonPopOgg = null;
let swapOgg = null;
try { gameHtml = fs.readFileSync(GAME_HTML_PATH); } catch (error) { console.warn('[Diggerz] index.html not found at startup:', error.message); }
try { mapEditorHtml = fs.readFileSync(MAP_EDITOR_PATH); } catch (error) { console.warn('[Diggerz] map-editor.html not found:', error.message); }
try { tilesPng = fs.readFileSync(TILES_PNG_PATH); } catch (error) { console.warn('[Diggerz] tiles.png not found:', error.message); }
try { bkndPng = fs.readFileSync(BKND_PNG_PATH); } catch (error) { console.warn('[Diggerz] bknd.png not found:', error.message); }
try { levelupOgg = fs.readFileSync(LEVELUP_OGG_PATH); } catch (error) { console.warn('[Diggerz] levelup.ogg not found:', error.message); }
for (let i=0;i<MUSIC_OGG_PATHS.length;i++) try { musicOgg[i]=fs.readFileSync(MUSIC_OGG_PATHS[i]); } catch(error) { console.warn(`[Diggerz] music theme ${i+1} not found:`,error.message); }
try { balloonPopOgg=fs.readFileSync(BALLOON_POP_OGG_PATH); } catch(error) { console.warn('[Diggerz] balloon_pop.ogg not found:',error.message); }
try { swapOgg=fs.readFileSync(SWAP_OGG_PATH); } catch(error) { console.warn('[Diggerz] swap.ogg not found:',error.message); }

const rooms = new Map();
let nextConnectionNumber = 1;
let nextMatchNumber = 1;
let nextTradeNumber = 1;
let lastBattleMapKey = '';
const SPEAKER_TRACK_MS = [126485,148571,30316,60632];
const COTTON_SPAWN_MS = Number(process.env.DIGGERZ_COTTON_SPAWN_MS || 60 * 1000);
const TURRET_FIRE_MS = Number(process.env.DIGGERZ_TURRET_FIRE_MS || 1150);

function nowIso() {
  return new Date().toISOString();
}

function log(...args) {
  console.log(`[${nowIso()}]`, ...args);
}

function normalizeRoom(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}

function normalizeMode(value) {
  return value === 'digtrade' ? 'digtrade' : 'pvp';
}

function normalizeName(value) {
  const name = String(value || 'Player').replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 24);
  return name || 'Player';
}

function normEmail(s) {
  return String(s || '').trim().toLowerCase();
}
function isStaffEmail(email) {
  return DIGGERZ_ADMIN_EMAILS.includes(normEmail(email));
}
function loadAccounts() {
  try {
    if (!fs.existsSync(AUTH_ACCOUNTS_PATH)) return {};
    return JSON.parse(fs.readFileSync(AUTH_ACCOUNTS_PATH, 'utf8') || '{}') || {};
  } catch (e) {
    return {};
  }
}
function saveAccounts(accounts) {
  try {
    fs.mkdirSync(path.dirname(AUTH_ACCOUNTS_PATH), { recursive: true });
    fs.writeFileSync(AUTH_ACCOUNTS_PATH, JSON.stringify(accounts, null, 0));
  } catch (e) {}
}
function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), s, 32).toString('hex');
  return { salt: s, hash };
}
function verifyPassword(password, salt, hash) {
  try {
    const h = crypto.scryptSync(String(password), String(salt), 32).toString('hex');
    const a = Buffer.from(h, 'hex');
    const b = Buffer.from(String(hash), 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}
function createSession(email) {
  email = normEmail(email);
  const token = crypto.randomBytes(24).toString('hex');
  const role = isStaffEmail(email) ? 'lime' : 'player';
  const exp = Date.now() + AUTH_SESSION_TTL_MS;
  authSessions.set(token, { email, role, exp });
  return { token, role, expiresAt: exp };
}
function getSession(token) {
  const s = authSessions.get(String(token || ''));
  if (!s) return null;
  if (Date.now() > s.exp) { authSessions.delete(String(token || '')); return null; }
  return s;
}
function verifyAdminSession(message) {
  const token = String(message && (message.adminToken || message.token || message.adminCode) || '');
  const s = getSession(token);
  if (!s) return false;
  if (!isStaffEmail(s.email)) return false;
  return true;
}
function verifyAdminCode(value) {
  const s = getSession(value);
  return !!(s && isStaffEmail(s.email));
}


function sanitizeMap(raw, filename = '') {
  if (!raw || typeof raw !== 'object' || raw.format !== 'diggerz-pvp-map-v1') return null;
  if ((Number(raw.width)|0) !== 128 || (Number(raw.height)|0) !== 80 || !Array.isArray(raw.tiles)) return null;
  const tiles = [];
  const seen = new Set();
  for (const row of raw.tiles.slice(0, 128 * 80)) {
    if (!Array.isArray(row) || row.length < 3) continue;
    const x=Number(row[0])|0, y=Number(row[1])|0, id=Number(row[2])|0, variant=(Number(row[3])|0)&31, flags=(Number(row[4])|0)&3;
    if (x<0 || x>=128 || y<0 || y>=80 || id<=0 || id>2047) continue;
    const key=`${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tiles.push(flags ? [x,y,id,variant,flags] : [x,y,id,variant]);
  }
  const fallback = path.basename(filename || 'Custom Map', path.extname(filename || '')) || 'Custom Map';
  const name = String(raw.name || fallback).replace(/[\x00-\x1F\x7F]/g,'').trim().slice(0,40) || fallback;
  const backgroundTiles=[]; const seenBg=new Set();
  if(Array.isArray(raw.backgroundTiles)) for(const row of raw.backgroundTiles.slice(0,128*80)){
    if(!Array.isArray(row)||row.length<3)continue; const x=Number(row[0])|0,y=Number(row[1])|0,id=Number(row[2])|0,variant=(Number(row[3])|0)&31,flags=(Number(row[4])|0)&3;
    if(x<0||x>=128||y<0||y>=80||id<=0||id>2047)continue; const key=`${x},${y}`; if(seenBg.has(key))continue; seenBg.add(key); backgroundTiles.push(flags?[x,y,id,variant,flags]:[x,y,id,variant]);
  }
  return { format:'diggerz-pvp-map-v1', name, width:128, height:80, background:Math.max(0,Math.min(9,Number(raw.background)|0)), tiles, backgroundTiles };
}

function loadCustomMaps() {
  const maps=[];
  try { fs.mkdirSync(MAPS_DIR,{recursive:true}); } catch {}
  let files=[];
  try { files=fs.readdirSync(MAPS_DIR).filter(f=>f.toLowerCase().endsWith('.json')&&f.toLowerCase()!=='digtrade.json').sort((a,b)=>a.localeCompare(b)); }
  catch (error) { console.warn('[Diggerz] could not read maps folder:', error.message); return maps; }
  for (const file of files) {
    try {
      const raw=JSON.parse(fs.readFileSync(path.join(MAPS_DIR,file),'utf8'));
      const map=sanitizeMap(raw,file);
      if (!map) { console.warn(`[Diggerz] skipped invalid map ${file}`); continue; }
      maps.push(map);
    } catch (error) { console.warn(`[Diggerz] skipped map ${file}:`,error.message); }
  }
  return maps;
}

const customBattleMaps = loadCustomMaps();
let digTradeMap=null;
try {
  const file=path.join(MAPS_DIR,'digtrade.json');
  if(fs.existsSync(file)) digTradeMap=sanitizeMap(JSON.parse(fs.readFileSync(file,'utf8')),'digtrade.json');
  if(digTradeMap) console.log(`[Diggerz] loaded dedicated Dig+Trade map: ${digTradeMap.name}`);
} catch(error) { console.warn('[Diggerz] skipped digtrade.json:',error.message); digTradeMap=null; }

function pickBattleMap() {
  const rotation=[null,...customBattleMaps];
  if (rotation.length === 1) return null;
  let index=0,key='Default Map';
  for (let tries=0; tries<8; tries++) {
    index=Math.floor(Math.random()*rotation.length);
    key=rotation[index] ? rotation[index].name : 'Default Map';
    if (key!==lastBattleMapKey) break;
  }
  lastBattleMapKey=key;
  return rotation[index] || null;
}

function battleMapName(room) {
  return room && room.map ? room.map.name : 'Default Map';
}

function serveBuffer(res, buffer, contentType) {
  if (!buffer) { res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}); res.end('Missing file.\n'); return; }
  res.writeHead(200,{'Content-Type':contentType,'Content-Length':buffer.length,'Cache-Control':'no-store'});
  res.end(buffer);
}

function sendJson(client, payload) {
  if (!client || client.closed || !client.socket.writable) return false;
  try {
    client.socket.write(encodeFrame(Buffer.from(JSON.stringify(payload), 'utf8'), 0x1));
    return true;
  } catch (error) {
    closeClient(client, 1011, 'send failed');
    return false;
  }
}

function broadcastRoom(room, payload, exceptClient = null) {
  if (!room) return;
  for (const client of room.clients) {
    if (client !== exceptClient) sendJson(client, payload);
  }
}

function sendBinary(client, payload) {
  if (!client || client.closed || !client.socket.writable) return false;
  try { client.socket.write(encodeFrame(payload, 0x2)); return true; }
  catch (error) { closeClient(client, 1011, 'binary send failed'); return false; }
}

function relayBinary(client, payload) {
  if (!client.room) return;
  for (const peer of client.room.clients) if (peer !== client) sendBinary(peer, payload);
}

function roomSnapshot(room) {
  return [...room.clients].map(client => ({
    connectionId: client.connectionId,
    name: client.name,
    mode: client.mode
  }));
}

function randomSpawnX(room) {
  const battle = room && room.battle;
  const left = battle ? battle.left : BATTLE_MIN_LEFT;
  const right = battle ? battle.right : BATTLE_MAX_RIGHT;
  const pad = Math.min(7, Math.max(2, Math.floor((right - left) / 8)));
  const lo = Math.min(right - 1, left + pad);
  const hi = Math.max(lo + 1, right - pad);
  return lo + Math.random() * Math.max(1, hi - lo);
}

function ensureRoomState(room) {
  if (!room.drops) room.drops = new Map();
  if (!room.tiles) room.tiles = new Map();
  if (!room.coins) room.coins = new Map();
  if (!room.cottonMachines) room.cottonMachines = new Map();
  if (!room.turretCooldowns) room.turretCooldowns = new Map();
  if (room.speaker === undefined) room.speaker = null;
  if (room.mode === 'pvp' && !room.battle) {
    room.battle = {
      phase: 'waiting',
      fightAt: 0,
      nextShrinkAt: 0,
      shrinkStage: 0,
      warningStage: 0,
      inset: 0,
      left: BATTLE_MIN_LEFT,
      right: BATTLE_MAX_RIGHT,
      elimination: false,
      winnerConnectionId: '',
      finishedAt: 0
    };
  }
  return room;
}

function battleSnapshot(room) {
  ensureRoomState(room);
  const b = room.battle;
  if (!b) return null;
  return {
    t: 'battle-state',
    phase: b.phase,
    fightAt: b.fightAt,
    nextShrinkAt: b.nextShrinkAt,
    shrinkStage: b.shrinkStage,
    inset: Number.isFinite(b.inset) ? b.inset : 0,
    left: b.left,
    right: b.right,
    elimination: !!b.elimination,
    winnerConnectionId: b.winnerConnectionId || '',
    serverNow: Date.now()
  };
}

function sendBattleState(client) {
  if (client && client.room && client.room.mode === 'pvp') sendJson(client, battleSnapshot(client.room));
}

function broadcastBattleState(room) {
  if (room && room.mode === 'pvp') broadcastRoom(room, battleSnapshot(room));
}

function battleJoinable(room) {
  if (!room || room.mode !== 'pvp') return true;
  ensureRoomState(room);
  return room.battle.phase === 'waiting' || room.battle.phase === 'build';
}

function startBattleBuild(room) {
  ensureRoomState(room);
  const b = room.battle;
  if (!b || b.phase !== 'waiting' || room.clients.size < 2) return;
  b.phase = 'build';
  b.fightAt = Date.now() + BATTLE_BUILD_MS;
  b.nextShrinkAt = 0;
  b.shrinkStage = 0;
  b.warningStage = 0;
  b.inset = 0;
  b.left = BATTLE_MIN_LEFT;
  b.right = BATTLE_MAX_RIGHT;
  b.elimination = false;
  b.winnerConnectionId = '';
  for (const c of room.clients) {
    c.pvpHealth = 3;
    c.alive = true;
    c.eliminated = false;
    c.kills = 0;
    c.shots = 0;
    c.hits = 0;
  }
  broadcastBattleState(room);
  broadcastRoom(room, { t:'battle-event', kind:'build-start', seconds:40, fightAt:b.fightAt, serverNow:Date.now() });
  log(`Battle ${room.code}: 40-second build phase started.`);
}

function beginBattleFight(room) {
  const b = room.battle;
  if (!b || b.phase !== 'build') return;
  b.phase = 'fight';
  b.nextShrinkAt = Date.now() + BATTLE_FIRST_SHRINK_MS;
  b.warningStage = 0;
  room.matchmaking = false;
  broadcastBattleState(room);
  broadcastRoom(room, { t:'battle-event', kind:'fight', serverNow:Date.now() });
  log(`Battle ${room.code}: FIGHT.`);
}

function playersRemaining(room) {
  let n = 0;
  for (const c of room.clients) if (!c.eliminated && c.alive) n++;
  return n;
}

function broadcastRemaining(room) {
  broadcastRoom(room, { t:'players-remaining', count:playersRemaining(room) });
}

function finishBattleIfNeeded(room) {
  if (!room || room.mode !== 'pvp' || !room.battle || !room.battle.elimination) return false;
  const alive = [...room.clients].filter(c => !c.eliminated && c.alive);
  if (alive.length !== 1) return false;
  const winner = alive[0], b = room.battle;
  if (b.phase === 'finished') return true;
  b.phase = 'finished';
  b.winnerConnectionId = winner.connectionId;
  b.finishedAt = Date.now();
  room.matchmaking = false;
  sendJson(winner, { t:'coin-award', amount:10, reason:'win' });
  broadcastRoom(room, { t:'winner', connectionId:winner.connectionId, name:winner.name, kills:winner.kills|0 });
  broadcastBattleState(room);
  log(`Battle ${room.code}: ${winner.name} wins with ${winner.kills|0} kills.`);
  return true;
}

function respawnBattleClient(client) {
  const room = client && client.room;
  if (!room || room.mode !== 'pvp' || !room.battle || room.battle.elimination || client.eliminated) return;
  client.pvpHealth = 3;
  client.alive = true;
  client.position = { x:randomSpawnX(room), y:2 };
  sendJson(client, { t:'force-respawn', x:client.position.x, y:client.position.y, health:3 });
  broadcastRoom(room, { t:'respawn', x:client.position.x, y:client.position.y, _serverFrom:client.connectionId, _serverName:client.name }, client);
}

function spawnKillCoin(room, x, y, killer) {
  ensureRoomState(room);
  const id = `COIN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const coin = { id, x:Number(x)||0, y:Number(y)||0, value:1, killerConnectionId:killer ? killer.connectionId : '' };
  room.coins.set(id, coin);
  broadcastRoom(room, { t:'coin-spawn', coin });
  return coin;
}

function eliminateOrRespawn(victim, attacker, source) {
  const room = victim.room;
  if (!room || room.mode !== 'pvp') return;
  ensureRoomState(room);
  if (!victim.alive) return;
  victim.alive = false;
  victim.pvpHealth = 0;
  const pos = victim.position || {x:12,y:16};
  broadcastRoom(room, { t:'death', x:pos.x, y:pos.y, _serverFrom:victim.connectionId, _serverName:victim.name });

  if (attacker && attacker !== victim && attacker.room === room) {
    attacker.kills = (attacker.kills|0) + 1;
    sendJson(attacker, { t:'kill-confirm', victimName:victim.name, kills:attacker.kills });
    broadcastRoom(room, { t:'kill-feed', killerName:attacker.name, killerConnectionId:attacker.connectionId, victimName:victim.name, victimConnectionId:victim.connectionId, kills:attacker.kills, source:String(source||'weapon') });
    spawnKillCoin(room, pos.x, pos.y - .35, attacker);
  }

  if (room.battle.elimination) {
    victim.eliminated = true;
    sendJson(victim, { t:'eliminated', killerName:attacker ? attacker.name : '', kills:victim.kills|0 });
    broadcastRemaining(room);
    finishBattleIfNeeded(room);
  } else {
    setTimeout(() => respawnBattleClient(victim), 1850).unref?.();
  }
}

function dealPvpDamage(attacker, victim, amount, source) {
  if (!attacker || !victim || attacker === victim || !attacker.room || attacker.room !== victim.room) return false;
  const room = attacker.room;
  if (room.mode !== 'pvp' || !room.battle || (room.battle.phase !== 'fight' && room.battle.phase !== 'elimination')) return false;
  if (!victim.alive || victim.eliminated) return false;
  const damage = Math.max(1, Math.min(3, Number(amount)|0));
  victim.lastAttackerConnectionId = attacker.connectionId;
  victim.lastDamagedAt = Date.now();
  victim.pvpHealth = Math.max(0, (victim.pvpHealth == null ? 3 : victim.pvpHealth) - damage);
  attacker.hits = (attacker.hits|0) + 1;
  sendJson(victim, { t:'damage', amount:damage, source:String(source||'weapon'), attackerConnectionId:attacker.connectionId, attackerName:attacker.name });
  sendJson(attacker, { t:'hit-confirm', targetConnectionId:victim.connectionId, targetName:victim.name, health:victim.pvpHealth });
  broadcastRoom(room, { t:'health', current:victim.pvpHealth, maximum:3, _serverFrom:victim.connectionId, _serverName:victim.name }, victim);
  if (victim.pvpHealth <= 0) eliminateOrRespawn(victim, attacker, source);
  return true;
}

function lineHitTarget(attacker, message) {
  const room = attacker.room;
  const fx=Number(message.fromX), fy=Number(message.fromY), tx=Number(message.toX), ty=Number(message.toY);
  if (![fx,fy,tx,ty].every(Number.isFinite)) return null;
  const vx=tx-fx, vy=ty-fy, vv=vx*vx+vy*vy;
  let best=null, bestT=2;
  for (const target of room.clients) {
    if (target===attacker || !target.alive || target.eliminated || !target.position) continue;
    const px=target.position.x, py=target.position.y;
    let t=vv>0?((px-fx)*vx+(py-fy)*vy)/vv:0;
    if (t<0 || t>1) continue;
    const cx=fx+vx*t, cy=fy+vy*t;
    if (Math.hypot(px-cx,py-cy)<=1.2 && t<bestT) {best=target;bestT=t;}
  }
  return best;
}

function impactHits(impactType, x, y, px, py) {
  const dx=px-x, dy=py-y;
  if (impactType===36) return Math.hypot(dx,dy)<=.95;
  if (impactType===30) return Math.abs(dx)<=.9 && Math.abs(dy)<=.9;
  if (impactType===24) return Math.abs(dx)<=1.7 && Math.abs(dy)<=1.7;
  if (impactType===38) return Math.abs(dx)<=2.8 && Math.abs(dy)<=2.8;
  if (impactType===40) return (Math.abs(dx)<=.8 && dy>=0 && dy<=3.4) || (Math.abs(dx)<=1.7 && Math.abs(dy-3)<=1.7);
  return Math.hypot(dx,dy)<=2.35;
}

function broadcastWorldSound(room, sound, x, y) {
  broadcastRoom(room,{t:'world-sound',sound:String(sound||''),x:Number(x)||0,y:Number(y)||0});
}

function spawnWorldCoin(room,x,y,value=1,reason='world') {
  ensureRoomState(room);
  const id=`COIN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  const coin={id,x:Number(x)||0,y:Number(y)||0,value:Math.max(1,Number(value)|0),reason:String(reason||'world')};
  room.coins.set(id,coin);
  broadcastRoom(room,{t:'coin-spawn',coin});
  return coin;
}

const COTTON_ITEM_POOL=[93,139,248,276,326,327,328,329,370,371,215,110,112,114,117,138,154,155,156,157,190,312,313,328,329,330,331,332,333];
function cottonCandyReward(room,breaker,x,y) {
  const roll=Math.random();
  if (roll < .22) { spawnWorldCoin(room,x,y-.25,1,'cotton-candy'); return; }
  if (roll < .42 && breaker) {
    const id=COTTON_ITEM_POOL[Math.floor(Math.random()*COTTON_ITEM_POOL.length)];
    const category=id>=215 && ![248,276,326,327,328,329,370,371].includes(id) ? 1 : 2;
    sendJson(breaker,{t:'cotton-item-award',category,id,count:1,x,y:y-.25});
  }
}

function syncSpeaker(room) {
  broadcastRoom(room,{t:'speaker-state',speaker:room.speaker ? {...room.speaker} : null,serverNow:Date.now()});
}

function tickSpeaker(room,now) {
  if (!room || room.mode!=='digtrade' || !room.speaker || !room.speaker.on) return;
  const sp=room.speaker, duration=SPEAKER_TRACK_MS[sp.trackIndex|0]||60000;
  if (now-(sp.startedAt||now) >= duration) {
    sp.trackIndex=((sp.trackIndex|0)+1)%4;
    sp.startedAt=now;
    syncSpeaker(room);
  }
}

function findHighestCandySpace(room,x,machineY) {
  let y=machineY-1;
  for (;y>=1;y--) {
    const tile=room.tiles.get(`${x},${y}`);
    if (!tile || tile.id===0) return y;
    if (tile.id!==211) return -1;
  }
  return -1;
}

function tickCottonCandy(room,now) {
  if (!room || room.mode!=='digtrade') return;
  ensureRoomState(room);
  for (const [key,tile] of room.tiles) {
    if ((tile.id|0)!==212) continue;
    let next=room.cottonMachines.get(key);
    if (!next) { room.cottonMachines.set(key,now+COTTON_SPAWN_MS); continue; }
    if (now<next) continue;
    room.cottonMachines.set(key,now+COTTON_SPAWN_MS);
    const y=findHighestCandySpace(room,tile.x|0,tile.y|0);
    if (y<1) continue;
    const candy={x:tile.x|0,y,id:211,variant:(tile.variant|0)&3,ownerConnectionId:tile.ownerConnectionId||''};
    room.tiles.set(`${candy.x},${candy.y}`,candy);
    broadcastRoom(room,{t:'tile',x:candy.x,y:candy.y,id:211,variant:candy.variant,_serverFrom:'SERVER',_serverName:'Cotton Candy Machine'});
    broadcastWorldSound(room,'swap',candy.x,candy.y);
  }
  for (const key of [...room.cottonMachines.keys()]) {
    const tile=room.tiles.get(key); if(!tile || tile.id!==212) room.cottonMachines.delete(key);
  }
}

function allTurretTiles(room) {
  const out=[];
  if (room.map && Array.isArray(room.map.tiles)) for (const row of room.map.tiles) {
    const id=Number(row[2])|0; if(id===363||id===364||id===365) out.push({x:Number(row[0])|0,y:Number(row[1])|0,id,ownerConnectionId:''});
  }
  for (const tile of room.tiles.values()) if(tile && (tile.id===363||tile.id===364||tile.id===365)) out.push(tile);
  const unique=new Map(); for(const t of out) unique.set(`${t.x},${t.y}`,t); return [...unique.values()];
}

function tickTurrets(room,now) {
  if (!room || room.mode!=='pvp' || !room.battle || (room.battle.phase!=='fight'&&room.battle.phase!=='elimination')) return;
  ensureRoomState(room);
  for (const turret of allTurretTiles(room)) {
    const key=`${turret.x},${turret.y}`; if((room.turretCooldowns.get(key)||0)>now) continue;
    const owner=turret.ownerConnectionId?findRoomClient(room,turret.ownerConnectionId):null;
    const range=turret.id===364?20:18;
    let best=null,bestD=range+1;
    for(const target of room.clients){
      if(!target.alive||target.eliminated||!target.position||target===owner)continue;
      const d=Math.hypot(target.position.x-turret.x,target.position.y-turret.y);
      if(d<bestD){best=target;bestD=d;}
    }
    if(!best)continue;
    room.turretCooldowns.set(key,now+TURRET_FIRE_MS);
    broadcastRoom(room,{t:'turret-fire',x:turret.x+.5,y:turret.y-.45,toX:best.position.x,toY:best.position.y,variant:turret.id,ownerConnectionId:owner?owner.connectionId:''});
    if(owner) dealPvpDamage(owner,best,1,'turret');
    else {
      best.pvpHealth=Math.max(0,(best.pvpHealth==null?3:best.pvpHealth)-1);
      sendJson(best,{t:'damage',amount:1,source:'turret',attackerConnectionId:'',attackerName:'Swivel Turret'});
      broadcastRoom(room,{t:'health',current:best.pvpHealth,maximum:3,_serverFrom:best.connectionId,_serverName:best.name},best);
      if(best.pvpHealth<=0) eliminateOrRespawn(best,null,'turret');
    }
  }
}

function specialWorldTick(room,now){ tickSpeaker(room,now); tickCottonCandy(room,now); tickTurrets(room,now); }

function battleTick(room, now) {
  if (!room || room.mode !== 'pvp') return;
  ensureRoomState(room);
  const b=room.battle;
  if (b.phase==='waiting') { if (room.clients.size>=2) startBattleBuild(room); return; }
  if (b.phase==='build') { if (now>=b.fightAt) beginBattleFight(room); return; }
  if (b.phase!=='fight' && b.phase!=='elimination') return;
  if (b.nextShrinkAt && now>=b.nextShrinkAt-BATTLE_SHRINK_WARNING_MS && b.warningStage===b.shrinkStage) {
    b.warningStage=b.shrinkStage+1;
    broadcastRoom(room,{t:'battle-event',kind:'shrink-warning',stage:b.shrinkStage+1,shrinkAt:b.nextShrinkAt,serverNow:now});
  }
  if (b.nextShrinkAt && now>=b.nextShrinkAt) {
    b.shrinkStage++;
    
    
    b.inset=Math.min(BATTLE_MAX_INSET,Math.max(0,b.shrinkStage*BATTLE_SHRINK_STEP));
    b.left=b.inset-0.5;
    b.right=WORLD_WIDTH-0.5-b.inset;
    if (b.shrinkStage===2 && !b.elimination) {
      
      for (const c of room.clients) if (!c.alive && !c.eliminated) respawnBattleClient(c);
      b.elimination=true;
      b.phase='elimination';
      broadcastRoom(room,{t:'battle-event',kind:'elimination',serverNow:now});
      broadcastRemaining(room);
    }
    broadcastRoom(room,{t:'battle-event',kind:'shrink',stage:b.shrinkStage,inset:b.inset,left:b.left,right:b.right,serverNow:now});
    b.nextShrinkAt=now+BATTLE_SHRINK_INTERVAL_MS;
    b.warningStage=b.shrinkStage;
    broadcastBattleState(room);
    finishBattleIfNeeded(room);
  }
}

function addClientToRoom(client, room, mode, name) {
  ensureRoomState(room);
  client.room = room;
  client.roomCode = room.code;
  client.mode = mode;
  client.name = name;
  client.pvpHealth = 3;
  client.alive = true;
  client.eliminated = false;
  client.kills = 0;
  client.shots = 0;
  client.hits = 0;
  client.position = { x: randomSpawnX(room), y: 2 };
  room.clients.add(client);

  sendJson(client, {
    t: 'welcome', connectionId: client.connectionId, room: room.code, mode,
    count: room.clients.size, max: MAX_ROOM_PLAYERS, players: roomSnapshot(room)
  });

  sendJson(client, {
    t: 'room-state', room: room.code,
    map: room.map || null,
    mapName: room.map ? String(room.map.name||'Custom Map') : (room.mode==='pvp' ? battleMapName(room) : 'Default Dig+Trade'),
    tiles: [...room.tiles.values()], drops: [...room.drops.values()], coins: [...room.coins.values()], speaker: room.speaker ? {...room.speaker} : null, serverNow: Date.now()
  });
  if (mode === 'pvp') sendBattleState(client);

  broadcastRoom(room, { t:'player-count', room:room.code, count:room.clients.size, max:MAX_ROOM_PLAYERS });
  log(`${client.connectionId} (${name}) joined ${room.code}. ${room.clients.size}/${MAX_ROOM_PLAYERS}`);

  if (room.clients.size >= 2) {
    broadcastRoom(room, { t:'room-ready', room:room.code, mode, count:room.clients.size });
    log(`Room ${room.code} READY.`);
    if (mode === 'pvp') startBattleBuild(room);
  }
}

function matchmake(client, message) {
  if (client.room) {
    sendJson(client, { t: 'server-error', code: 'already-joined', message: 'This connection is already in matchmaking.' });
    return;
  }

  const mode = normalizeMode(message.mode);
  const name = normalizeName(message.name);
  let room = null;

  for (const candidate of rooms.values()) {
    if (candidate.matchmaking && candidate.mode === mode && candidate.clients.size < MAX_ROOM_PLAYERS && battleJoinable(candidate)) {
      room = candidate;
      break;
    }
  }

  if (!room) {
    let code;
    do {
      code = `AUTO${(nextMatchNumber++).toString(36).toUpperCase().padStart(6, '0')}`;
    } while (rooms.has(code));
    room = {
      code,
      mode,
      clients: new Set(),
      createdAt: Date.now(),
      matchmaking: true,
      drops: new Map(),
      tiles: new Map(),
      map: mode === 'pvp' ? pickBattleMap() : (mode === 'digtrade' ? digTradeMap : null)
    };
    rooms.set(code, room);
    log(`Automatic ${mode} match ${code} created${mode === 'pvp' ? ` on ${battleMapName(room)}` : ''}.`);
  }

  addClientToRoom(client, room, mode, name);
}

function joinRoom(client, message) {
  if (client.room) {
    sendJson(client, { t: 'server-error', code: 'already-joined', message: 'This connection already joined a room.' });
    return;
  }

  const roomCode = normalizeRoom(message.room);
  const mode = normalizeMode(message.mode);
  const name = normalizeName(message.name);

  if (roomCode.length < 4) {
    sendJson(client, { t: 'server-error', code: 'bad-room', message: 'Room codes must be at least 4 letters/numbers.' });
    return;
  }

  let room = rooms.get(roomCode);
  if (!room) {
    if (message.role === 'join') {
      sendJson(client, { t: 'server-error', code: 'room-not-found', message: `Room ${roomCode} does not exist yet.` });
      return;
    }
    room = {
      code: roomCode,
      mode,
      clients: new Set(),
      createdAt: Date.now(),
      drops: new Map(),
      tiles: new Map(),
      map: mode === 'pvp' ? pickBattleMap() : (mode === 'digtrade' ? digTradeMap : null)
    };
    rooms.set(roomCode, room);
    log(`Room ${roomCode} created (${mode})${mode === 'pvp' ? ` on ${battleMapName(room)}` : ''}.`);
  }

  if (room.mode !== mode) {
    sendJson(client, { t: 'server-error', code: 'mode-mismatch', message: `Room ${roomCode} is ${room.mode}, not ${mode}.` });
    return;
  }

  if (mode === 'pvp' && !battleJoinable(room)) {
    sendJson(client, { t:'server-error', code:'match-in-progress', message:`Room ${roomCode} already started fighting.` });
    return;
  }

  if (room.clients.size >= MAX_ROOM_PLAYERS) {
    sendJson(client, { t: 'server-error', code: 'room-full', message: `Room ${roomCode} already has ${MAX_ROOM_PLAYERS} players.` });
    return;
  }

  addClientToRoom(client, room, mode, name);
}

function findRoomClient(room, connectionId) {
  if (!room || !connectionId) return null;
  for (const c of room.clients) if (c.connectionId === connectionId) return c;
  return null;
}

function guidKey(parts) {
  if (!Array.isArray(parts) || parts.length < 4) return '';
  return parts.slice(0, 4).map(v => Number(v) | 0).join(':');
}

function sanitizeItem(item) {
  if (!item || typeof item !== 'object') return null;
  const category = Number(item.category) | 0;
  const id = Number(item.id) | 0;
  const count = Math.max(0, Math.min(65535, Number(item.count) | 0));
  if ((category !== 1 && category !== 2) || id <= 0 || id > 2047 || count <= 0) return null;
  return { category, id, variant: (Number(item.variant) | 0) & 31, count, extra: Number(item.extra) | 0, text: String(item.text || '').slice(0, 180) };
}

function sanitizeOffer(offer) {
  const out = [];
  for (const item of Array.isArray(offer) ? offer.slice(0, 3) : []) {
    const clean = sanitizeItem(item);
    out.push(clean || { category:0,id:0,variant:0,count:0,extra:0,text:'' });
  }
  while (out.length < 3) out.push({ category:0,id:0,variant:0,count:0,extra:0,text:'' });
  return out;
}

function cancelTrade(client, reason = 'Cancelled.') {
  if (!client || !client.trade) return;
  const trade = client.trade;
  const partner = findRoomClient(client.room, trade.partnerConnectionId);
  client.trade = null;
  sendJson(client, { t:'trade-cancelled', tradeId:trade.id, reason });
  if (partner && partner.trade && partner.trade.id === trade.id) {
    partner.trade = null;
    sendJson(partner, { t:'trade-cancelled', tradeId:trade.id, reason });
  }
}

function beginTrade(client, target) {
  if (!client.room || !target || target === client || client.room.mode !== 'digtrade') return;
  if (client.trade) cancelTrade(client, 'A new trade started.');
  if (target.trade) cancelTrade(target, 'A new trade started.');
  const id = `TR${(nextTradeNumber++).toString(36).toUpperCase().padStart(6,'0')}`;
  const makeState = partnerConnectionId => ({
    id, partnerConnectionId, accepted:false, confirmed:false,
    offer:sanitizeOffer([]), reviewToken:'', revision:0
  });
  client.trade = makeState(target.connectionId);
  target.trade = makeState(client.connectionId);
  sendJson(client, { t:'trade-start', tradeId:id, partnerConnectionId:target.connectionId, partnerName:target.name });
  sendJson(target, { t:'trade-start', tradeId:id, partnerConnectionId:client.connectionId, partnerName:client.name });
}

function tradePartner(client) {
  if (!client || !client.trade || !client.room) return null;
  const partner=findRoomClient(client.room,client.trade.partnerConnectionId);
  return partner && partner.trade && partner.trade.id===client.trade.id ? partner : null;
}

function resetTradeReview(client, partner, reason='Trade changed.') {
  if (!client || !client.trade) return;
  const id=client.trade.id;
  const hadReview=!!client.trade.reviewToken || !!(partner && partner.trade && partner.trade.reviewToken);
  const hadAcceptance=!!client.trade.accepted || !!(partner && partner.trade && partner.trade.accepted);
  client.trade.accepted=false; client.trade.confirmed=false; client.trade.reviewToken='';
  if (partner && partner.trade && partner.trade.id===id) {
    partner.trade.accepted=false; partner.trade.confirmed=false; partner.trade.reviewToken='';
  }
  if (hadReview || hadAcceptance) {
    sendJson(client,{t:'trade-review-close',tradeId:id,reason});
    if (partner) sendJson(partner,{t:'trade-review-close',tradeId:id,reason});
  }
}

function openTradeReview(client, partner) {
  if (!client || !partner || !client.trade || !partner.trade || client.trade.id!==partner.trade.id) return;
  const token=`RV-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
  client.trade.reviewToken=token; partner.trade.reviewToken=token;
  client.trade.confirmed=false; partner.trade.confirmed=false;
  sendJson(client,{t:'trade-review',tradeId:client.trade.id,reviewToken:token,receive:partner.trade.offer});
  sendJson(partner,{t:'trade-review',tradeId:partner.trade.id,reviewToken:token,receive:client.trade.offer});
}

function completeTrade(client, partner) {
  if (!client || !partner || !client.trade || !partner.trade || client.trade.id!==partner.trade.id) return;
  const id=client.trade.id,aOffer=client.trade.offer,bOffer=partner.trade.offer;
  client.trade=null; partner.trade=null;
  sendJson(client,{t:'trade-complete',tradeId:id,receive:bOffer});
  sendJson(partner,{t:'trade-complete',tradeId:id,receive:aOffer});
}

function relayGameMessage(client, message, rawLength) {
  if (!client.room) {
    sendJson(client, { t:'server-error', code:'not-joined', message:'Join a room before sending game data.' });
    return;
  }
  if (rawLength > MAX_MESSAGE_BYTES) { closeClient(client,1009,'message too large'); return; }
  const room=client.room;
  ensureRoomState(room);
  const envelope=Object.assign({},message,{_serverFrom:client.connectionId,_serverName:client.name});

  if (message.t==='state') {
    let x=Number(message.x), y=Number(message.y);
    if (Number.isFinite(x)&&Number.isFinite(y)) {
      if(room.mode==='pvp'&&room.battle&&(room.battle.phase==='fight'||room.battle.phase==='elimination')){
        x=Math.max(room.battle.left+.45,Math.min(room.battle.right-.45,x));
      } else x=Math.max(-20,Math.min(WORLD_WIDTH+20,x));
      client.position={x,y:Math.max(-30,Math.min(120,y))};
      
      
      
      broadcastRoom(room,{t:'peer-state',x:client.position.x,y:client.position.y,_serverFrom:client.connectionId,_serverName:client.name},client);
    }
    return;
  }

  if (message.t==='aim') {
    const x=Number(message.x), y=Number(message.y);
    if (!Number.isFinite(x)||!Number.isFinite(y)) return;
    client.aim={x,y};
    broadcastRoom(room,{t:'aim',x,y,_serverFrom:client.connectionId,_serverName:client.name},client);
    return;
  }

  if (message.t==='attack') {
    if (room.mode==='pvp') {
      const b=room.battle;
      if (!b || (b.phase!=='fight'&&b.phase!=='elimination') || !client.alive || client.eliminated) {
        sendJson(client,{t:'fire-blocked'});
        return;
      }
      client.shots=(client.shots|0)+1;
      broadcastRoom(room,envelope,client); 
      const attackType=Number(message.attackType)|0;
      if (!PROJECTILE_ATTACKS.has(attackType)) {
        const target=lineHitTarget(client,message);
        if (target) dealPvpDamage(client,target,1,'weapon');
      }
      return;
    }
    
    
    if (room.mode==='digtrade') {
      sendJson(client,{t:'freedig-fire-blocked'});
      return;
    }
    broadcastRoom(room,envelope,client);
    return;
  }

  if (message.t==='tool-attack') {
    if (room.mode!=='pvp' || !room.battle || (room.battle.phase!=='fight'&&room.battle.phase!=='elimination') || !client.alive || client.eliminated) return;
    const itemId=Number(message.itemId)|0;
    if(itemId!==239 && !(itemId>=379&&itemId<=394)) return;
    const fx=Number(message.fromX),fy=Number(message.fromY),tx=Number(message.toX),ty=Number(message.toY);
    if(![fx,fy,tx,ty].every(Number.isFinite))return;
    
    
    const dx=tx-fx,dy=ty-fy,len=Math.hypot(dx,dy)||1,maxReach=itemId===239?3.2:3.0;
    const clipped=Object.assign({},message,{fromX:fx,fromY:fy,toX:fx+dx*Math.min(1,maxReach/len),toY:fy+dy*Math.min(1,maxReach/len)});
    client.shots=(client.shots|0)+1;
    const target=lineHitTarget(client,clipped);
    if(target)dealPvpDamage(client,target,1,itemId===239?'excalibur':'lightsword');
    broadcastRoom(room,{t:'tool-attack',fromX:clipped.fromX,fromY:clipped.fromY,toX:clipped.toX,toY:clipped.toY,itemId,attackType:Number(message.attackType)|0,_serverFrom:client.connectionId,_serverName:client.name},client);
    return;
  }

  if (message.t==='impact') {
    if (room.mode!=='pvp' || !room.battle || (room.battle.phase!=='fight'&&room.battle.phase!=='elimination') || !client.alive || client.eliminated) return;
    const x=Number(message.x),y=Number(message.y),impactType=Number(message.impactType)|0;
    if (!Number.isFinite(x)||!Number.isFinite(y)) return;
    for (const target of room.clients) {
      if (target===client || !target.alive || target.eliminated || !target.position) continue;
      if (impactHits(impactType,x,y,target.position.x,target.position.y)) dealPvpDamage(client,target,1,'projectile');
    }
    return;
  }

  if (message.t==='death') {
    if (room.mode==='pvp') {
      if (client.alive) {
        let attacker=null, source=message.source||'hazard';
        if ((client.adminKilledUntil||0)>Date.now()) { source='admin'; client.adminKilledUntil=0; }
        else if (client.lastAttackerConnectionId && Date.now()-(client.lastDamagedAt||0)<6000) attacker=findRoomClient(room,client.lastAttackerConnectionId);
        eliminateOrRespawn(client,attacker,source);
      }
      return;
    }
    broadcastRoom(room,envelope,client); return;
  }

  if (message.t==='respawn') {
    if (room.mode==='pvp') {
      if (room.battle && room.battle.elimination) return;
      client.pvpHealth=3;client.alive=true;client.eliminated=false;
      const x=Number(message.x),y=Number(message.y);if(Number.isFinite(x)&&Number.isFinite(y))client.position={x,y};
      broadcastRoom(room,envelope,client);return;
    }
    broadcastRoom(room,envelope,client);return;
  }

  if (message.t==='coin-pickup') {
    const id=String(message.id||''),coin=room.coins.get(id);if(!coin||!client.position)return;
    if(!client.alive||client.eliminated)return;
    if(Math.hypot(client.position.x-coin.x,client.position.y-coin.y)>2.2)return;
    room.coins.delete(id);
    sendJson(client,{t:'coin-award',amount:Math.max(1,coin.value|0),reason:'kill-drop'});
    broadcastRoom(room,{t:'coin-remove',id});
    return;
  }

  if (ALLOWED_RELAY_TYPES.has(message.t)) { broadcastRoom(room,envelope,client); return; }

  if (message.t==='tile') {
    const tile={x:Number(message.x)|0,y:Number(message.y)|0,id:Number(message.id)|0,variant:Number(message.variant)|0,ownerConnectionId:client.connectionId};
    if(tile.x<0||tile.x>=128||tile.y<0||tile.y>=80)return;
    const key=`${tile.x},${tile.y}`, prior=room.tiles.get(key);
    if(room.mode==='digtrade'&&tile.id===122){
      if(room.speaker && (room.speaker.x!==tile.x||room.speaker.y!==tile.y)){
        sendJson(client,{t:'speaker-place-blocked',x:tile.x,y:tile.y,tile:prior?{id:prior.id|0,variant:prior.variant|0}:{id:0,variant:0}});return;
      }
      room.speaker={x:tile.x,y:tile.y,on:false,trackIndex:0,startedAt:0,ownerConnectionId:client.connectionId};
    }
    room.tiles.set(key,tile);
    if(tile.id===0){
      if(prior&&prior.id===122&&room.speaker&&room.speaker.x===tile.x&&room.speaker.y===tile.y)room.speaker=null;
      room.cottonMachines.delete(key);room.turretCooldowns.delete(key);
    }
    broadcastRoom(room,Object.assign({t:'tile'},tile,{_serverFrom:client.connectionId,_serverName:client.name}));
    if((prior&&prior.id===122)||tile.id===122)syncSpeaker(room);
    return;
  }

  if(message.t==='speaker-toggle'){
    if(room.mode!=='digtrade'||!room.speaker)return;
    const x=Number(message.x)|0,y=Number(message.y)|0;if(room.speaker.x!==x||room.speaker.y!==y)return;
    room.speaker.on=!room.speaker.on;
    if(room.speaker.on){room.speaker.trackIndex=(room.speaker.trackIndex|0)%4;room.speaker.startedAt=Date.now();}
    else room.speaker.startedAt=0;
    syncSpeaker(room);return;
  }

  if(message.t==='special-break'){
    const x=Number(message.x)|0,y=Number(message.y)|0,key=`${x},${y}`,tile=room.tiles.get(key);if(!tile)return;
    const id=tile.id|0;if(id!==211&&id!==127&&id!==212)return;
    room.tiles.set(key,{x,y,id:0,variant:0,ownerConnectionId:client.connectionId});
    broadcastRoom(room,{t:'tile',x,y,id:0,variant:0,_serverFrom:client.connectionId,_serverName:client.name});
    if(id===211){broadcastWorldSound(room,'balloon_pop',x,y);cottonCandyReward(room,client,x,y);}
    else if(id===127){spawnWorldCoin(room,x,y-.25,10,'trading-chip');}
    else if(id===212){room.cottonMachines.delete(key);}
    return;
  }

  if (message.t==='drop-spawn') {
    const d=message.drop||{},key=guidKey(d.guid),item=sanitizeItem(d);if(!key||!item)return;
    const drop=Object.assign(item,{guid:d.guid.slice(0,4).map(v=>Number(v)|0),x:Number(d.x)||0,y:Number(d.y)||0,tier:String(d.tier||'').slice(0,16)});
    room.drops.set(key,drop);
    broadcastRoom(room,{t:'drop-spawn',drop,_serverFrom:client.connectionId,_serverName:client.name},client);return;
  }

  if (message.t==='drop-pickup') {
    const key=guidKey(message.guid),drop=room.drops.get(key);if(!drop)return;
    room.drops.delete(key);sendJson(client,{t:'drop-award',drop});broadcastRoom(room,{t:'drop-remove',guid:drop.guid});return;
  }

  if (message.t==='damage') {
    
    if (room.mode==='pvp') return;
    const target=findRoomClient(room,String(message.targetConnectionId||''));if(!target||target===client)return;sendJson(target,envelope);return;
  }

  if (message.t==='admin-message') {
    if(!verifyAdminSession(message)){sendJson(client,{t:'server-error',code:'admin-auth',message:'Admin session required. Log in as staff email.'});return;}
    const text=String(message.message||'').replace(/[\x00-\x1F\x7F]/g,' ').trim().slice(0,180);
    if(!text)return;
    const payload={t:'admin-message',message:text,scope:message.scope==='global'?'global':'server',_serverFrom:client.connectionId,_serverName:client.name};
    if(payload.scope==='global'){
      for(const targetRoom of rooms.values())broadcastRoom(targetRoom,payload,targetRoom===room?client:null);
    }else broadcastRoom(room,payload,client);
    log(`Admin ${client.name} sent ${payload.scope} message: ${text}`);
    return;
  }

  if (message.t==='admin-item'||message.t==='admin-coins'||message.t==='admin-kill') {
    if(!verifyAdminSession(message)){sendJson(client,{t:'server-error',code:'admin-auth',message:'Admin session required. Log in as staff email.'});return;}
    const target=findRoomClient(room,String(message.targetConnectionId||''));if(!target||target===client)return;
    if(message.t==='admin-kill'){
      target.lastAttackerConnectionId=''; target.lastDamagedAt=0; target.adminKilledUntil=Date.now()+4000;
    }
    sendJson(target,envelope);return;
  }

  if (message.t==='trade-request') {
    if (room.mode!=='digtrade') return;
    const target=findRoomClient(room,String(message.targetConnectionId||''));if(!target||target===client)return;beginTrade(client,target);return;
  }
  if (message.t==='trade-offer') {
    if(!client.trade||client.trade.id!==message.tradeId)return;
    const partner=tradePartner(client);
    if(!partner){cancelTrade(client,'Player disconnected.');return;}
    resetTradeReview(client,partner,'Trade changed.');
    client.trade.offer=sanitizeOffer(message.offer);
    client.trade.revision=(client.trade.revision|0)+1;
    sendJson(partner,{t:'trade-offer',tradeId:client.trade.id,offer:client.trade.offer,_serverFrom:client.connectionId,_serverName:client.name});
    return;
  }
  if (message.t==='trade-accept') {
    if(!client.trade||client.trade.id!==message.tradeId)return;
    const partner=tradePartner(client);
    if(!partner){cancelTrade(client,'Player disconnected.');return;}
    client.trade.accepted=true; client.trade.confirmed=false;
    sendJson(partner,{t:'trade-partner-accepted',tradeId:client.trade.id});
    if(partner.trade.accepted) openTradeReview(client,partner);
    return;
  }
  if (message.t==='trade-confirm') {
    if(!client.trade||client.trade.id!==message.tradeId)return;
    const partner=tradePartner(client);
    if(!partner){cancelTrade(client,'Player disconnected.');return;}
    const token=String(message.reviewToken||'');
    if(!client.trade.accepted||!partner.trade.accepted||!token||token!==client.trade.reviewToken||token!==partner.trade.reviewToken){
      resetTradeReview(client,partner,'Trade changed before confirmation.');
      return;
    }
    client.trade.confirmed=true;
    if(partner.trade.confirmed) completeTrade(client,partner);
    return;
  }
  if (message.t==='trade-review-back') {
    if(!client.trade||client.trade.id!==message.tradeId)return;
    const partner=tradePartner(client);
    resetTradeReview(client,partner,'Editing resumed.');
    return;
  }
  if(message.t==='trade-cancel'){if(client.trade&&client.trade.id===message.tradeId)cancelTrade(client,'Cancelled.');return;}
}

function onTextMessage(client, text) {
  const now = Date.now();
  if (now - client.rateWindow >= 1000) {
    client.rateWindow = now;
    client.rateCount = 0;
  }
  client.rateCount++;
  if (client.rateCount > MAX_MESSAGES_PER_SECOND) {
    closeClient(client, 1008, 'rate limit');
    return;
  }

  let message;
  try {
    message = JSON.parse(text);
  } catch {
    sendJson(client, { t: 'server-error', code: 'bad-json', message: 'Invalid JSON message.' });
    return;
  }
  if (!message || typeof message !== 'object') return;

  if (message.t === 'matchmake') {
    matchmake(client, message);
    return;
  }

  if (message.t === 'join') {
    joinRoom(client, message);
    return;
  }

  if (message.t === 'ping') {
    sendJson(client, { t: 'pong', at: Date.now() });
    return;
  }

  relayGameMessage(client, message, Buffer.byteLength(text, 'utf8'));
}

function leaveRoom(client) {
  const room = client.room;
  if (!room) return;

  if (client.trade) cancelTrade(client, 'Player disconnected.');
  room.clients.delete(client);
  client.room = null;

  broadcastRoom(room, {
    t: 'peer-left',
    connectionId: client.connectionId,
    name: client.name,
    count: room.clients.size
  });

  broadcastRoom(room, {
    t: 'player-count',
    room: room.code,
    count: room.clients.size,
    max: MAX_ROOM_PLAYERS
  });

  log(`${client.connectionId} left ${room.code}. ${room.clients.size}/${MAX_ROOM_PLAYERS}`);

  if (room.mode === 'pvp' && room.battle && room.battle.elimination) { broadcastRemaining(room); finishBattleIfNeeded(room); }

  if (room.clients.size === 0) {
    rooms.delete(room.code);
    log(`Room ${room.code} removed.`);
  }
}

function closeClient(client, code = 1000, reason = '') {
  if (!client || client.closed) return;
  client.closed = true;
  leaveRoom(client);
  try {
    if (client.socket.writable) client.socket.write(encodeCloseFrame(code, reason));
  } catch {}
  try { client.socket.end(); } catch {}
  try { client.socket.destroy(); } catch {}
}

function encodeFrame(payload, opcode = 0x1) {
  const length = payload.length;
  let header;
  if (length < 126) {
    header = Buffer.allocUnsafe(2);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = length;
  } else if (length <= 0xffff) {
    header = Buffer.allocUnsafe(4);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.allocUnsafe(10);
    header[0] = 0x80 | (opcode & 0x0f);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  return Buffer.concat([header, payload]);
}

function encodeCloseFrame(code, reason) {
  const reasonBuffer = Buffer.from(String(reason || '').slice(0, 100), 'utf8');
  const payload = Buffer.allocUnsafe(2 + reasonBuffer.length);
  payload.writeUInt16BE(code, 0);
  reasonBuffer.copy(payload, 2);
  return encodeFrame(payload, 0x8);
}

function parseFrames(client, chunk) {
  client.buffer = Buffer.concat([client.buffer, chunk]);

  while (client.buffer.length >= 2) {
    const b0 = client.buffer[0];
    const b1 = client.buffer[1];
    const fin = (b0 & 0x80) !== 0;
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let length = b1 & 0x7f;
    let offset = 2;

    if (!fin) {
      closeClient(client, 1003, 'fragmented frames unsupported');
      return;
    }

    if (length === 126) {
      if (client.buffer.length < 4) return;
      length = client.buffer.readUInt16BE(2);
      offset = 4;
    } else if (length === 127) {
      if (client.buffer.length < 10) return;
      const bigLength = client.buffer.readBigUInt64BE(2);
      if (bigLength > BigInt(MAX_MESSAGE_BYTES)) {
        closeClient(client, 1009, 'frame too large');
        return;
      }
      length = Number(bigLength);
      offset = 10;
    }

    if (length > MAX_MESSAGE_BYTES) {
      closeClient(client, 1009, 'frame too large');
      return;
    }

    if (!masked) {
      closeClient(client, 1002, 'client frames must be masked');
      return;
    }

    if (client.buffer.length < offset + 4 + length) return;

    const mask = client.buffer.subarray(offset, offset + 4);
    offset += 4;
    const payload = Buffer.from(client.buffer.subarray(offset, offset + length));
    client.buffer = client.buffer.subarray(offset + length);

    for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];

    if (opcode === 0x8) {
      closeClient(client, 1000, 'client closed');
      return;
    }
    if (opcode === 0x9) {
      try { client.socket.write(encodeFrame(payload, 0xA)); } catch {}
      continue;
    }
    if (opcode === 0xA) {
      client.lastPong = Date.now();
      continue;
    }
    if (opcode === 0x2) {
      if (!client.room) { sendJson(client, { t: 'server-error', code: 'not-joined', message: 'Join matchmaking before sending Diggerz packets.' }); continue; }
      relayBinary(client, payload);
      continue;
    }
    if (opcode !== 0x1) continue;

    onTextMessage(client, payload.toString('utf8'));
  }
}

const server = http.createServer((req, res) => {
  const urlPath = String(req.url || '/').split('?')[0];

  function sendJsonHttp(status, obj) {
    const body = Buffer.from(JSON.stringify(obj));
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    });
    res.end(body);
  }
  function readJsonBody(cb) {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 32 * 1024) { req.destroy(); cb(new Error('too large')); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { cb(null, JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { cb(e); }
    });
    req.on('error', cb);
  }
  if (req.method === 'OPTIONS' && urlPath.startsWith('/api/')) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    });
    res.end();
    return;
  }
  if (urlPath === '/api/auth/exists' && req.method === 'POST') {
    readJsonBody((err, data) => {
      if (err) return sendJsonHttp(400, { ok: false, error: 'bad-json' });
      const email = normEmail(data && data.email);
      if (!email || !email.includes('@')) return sendJsonHttp(400, { ok: false, error: 'bad-email' });
      const accounts = loadAccounts();
      sendJsonHttp(200, { ok: true, exists: !!accounts[email] });
    });
    return;
  }
  if (urlPath === '/api/auth/register' && req.method === 'POST') {
    readJsonBody((err, data) => {
      if (err) return sendJsonHttp(400, { ok: false, error: 'bad-json' });
      const email = normEmail(data && data.email);
      const password = String((data && data.password) || '');
      if (!email || !email.includes('@')) return sendJsonHttp(400, { ok: false, error: 'bad-email' });
      if (password.length < 6) return sendJsonHttp(400, { ok: false, error: 'short-password' });
      const accounts = loadAccounts();
      if (accounts[email]) return sendJsonHttp(409, { ok: false, error: 'exists' });
      const { salt, hash } = hashPassword(password);
      accounts[email] = { salt, hash, createdAt: Date.now() };
      saveAccounts(accounts);
      const session = createSession(email);
      sendJsonHttp(200, { ok: true, token: session.token, role: session.role, expiresAt: session.expiresAt, email });
    });
    return;
  }
  if (urlPath === '/api/auth/login' && req.method === 'POST') {
    readJsonBody((err, data) => {
      if (err) return sendJsonHttp(400, { ok: false, error: 'bad-json' });
      const email = normEmail(data && data.email);
      const password = String((data && data.password) || '');
      if (!email || !password) return sendJsonHttp(400, { ok: false, error: 'missing-fields' });
      const accounts = loadAccounts();
      const acct = accounts[email];
      if (!acct) return sendJsonHttp(401, { ok: false, error: 'not-found' });
      if (!verifyPassword(password, acct.salt, acct.hash)) return sendJsonHttp(401, { ok: false, error: 'bad-password' });
      const session = createSession(email);
      sendJsonHttp(200, { ok: true, token: session.token, role: session.role, expiresAt: session.expiresAt, email });
    });
    return;
  }
  if (urlPath === '/api/admin/session' && req.method === 'POST') {
    readJsonBody((err, data) => {
      if (err) return sendJsonHttp(400, { ok: false, error: 'bad-json' });
      const email = normEmail(data && data.email);
      const token = String((data && data.token) || '');
      const s = getSession(token);
      if (!s || s.email !== email) return sendJsonHttp(401, { ok: false, error: 'invalid-session' });
      if (!isStaffEmail(email)) return sendJsonHttp(403, { ok: false, error: 'not-staff' });
      const refreshed = createSession(email);
      sendJsonHttp(200, { ok: true, token: refreshed.token, role: refreshed.role, expiresAt: refreshed.expiresAt, email });
    });
    return;
  }

  if (urlPath === '/') {
    if (!gameHtml) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end('Diggerz game file is missing on the server.\n');
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': gameHtml.length,
      'Cache-Control': 'no-store'
    });
    res.end(gameHtml);
    return;
  }
  if (urlPath === '/map-editor' || urlPath === '/map-editor.html') { serveBuffer(res,mapEditorHtml,'text/html; charset=utf-8'); return; }
  if (urlPath === '/tiles.png') { serveBuffer(res,tilesPng,'image/png'); return; }
  if (urlPath === '/bknd.png') { serveBuffer(res,bkndPng,'image/png'); return; }
  if (urlPath === '/levelup.ogg') { serveBuffer(res,levelupOgg,'audio/ogg'); return; }
  if (urlPath === '/music_theme.ogg') { serveBuffer(res,musicOgg[0],'audio/ogg'); return; }
  if (urlPath === '/music_theme2.ogg') { serveBuffer(res,musicOgg[1],'audio/ogg'); return; }
  if (urlPath === '/music_theme3.ogg') { serveBuffer(res,musicOgg[2],'audio/ogg'); return; }
  if (urlPath === '/music_theme4.ogg') { serveBuffer(res,musicOgg[3],'audio/ogg'); return; }
  if (urlPath === '/balloon_pop.ogg') { serveBuffer(res,balloonPopOgg,'audio/ogg'); return; }
  if (urlPath === '/swap.ogg') { serveBuffer(res,swapOgg,'audio/ogg'); return; }
  if (urlPath === '/health') {
    const body = JSON.stringify({
      ok: true,
      service: 'diggerz-build23.2-server',
      build: BUILD,
      rooms: rooms.size,
      players: [...rooms.values()].reduce((sum, room) => sum + room.clients.size, 0),
      maxPlayersPerRoom: MAX_ROOM_PLAYERS,
      battleMaps: ['Default Map',...customBattleMaps.map(m=>m.name)],
      time: nowIso()
    }, null, 2);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(body);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Diggerz server: not found\n');
});

server.on('upgrade', (req, socket) => {
  const upgrade = String(req.headers.upgrade || '').toLowerCase();
  const key = req.headers['sec-websocket-key'];
  const version = req.headers['sec-websocket-version'];

  if (upgrade !== 'websocket' || !key || version !== '13') {
    socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }

  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '\r\n'
  ].join('\r\n'));

  const client = {
    socket,
    connectionId: `C${String(nextConnectionNumber++).padStart(4, '0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
    buffer: Buffer.alloc(0),
    room: null,
    roomCode: null,
    mode: null,
    name: 'Player',
    closed: false,
    lastPong: Date.now(),
    rateWindow: Date.now(),
    rateCount: 0,
    trade: null,
    pvpHealth: 3, alive: true, eliminated: false, kills: 0, shots: 0, hits: 0,
    position: {x:12,y:2}, aim: {x:12,y:16}, lastAttackerConnectionId: '', lastDamagedAt: 0
  };

  socket.setNoDelay(true);
  socket.setKeepAlive(true, 30000);
  socket.on('data', chunk => parseFrames(client, chunk));
  socket.on('close', () => closeClient(client, 1000, 'socket closed'));
  socket.on('end', () => closeClient(client, 1000, 'socket ended'));
  socket.on('error', error => {
    log(`${client.connectionId} socket error:`, error.message);
    closeClient(client, 1011, 'socket error');
  });

  sendJson(client, {
    t: 'server-hello',
    server: 'Diggerz Build 23.2 Release Multiplayer + Battle Royale Server',
    protocol: 1,
    maxPlayersPerRoom: MAX_ROOM_PLAYERS
  });
  log(`${client.connectionId} WebSocket connected from ${socket.remoteAddress || 'unknown'}.`);
});

const battleClock = setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) { battleTick(room, now); specialWorldTick(room, now); }
}, 200);
battleClock.unref();

const heartbeat = setInterval(() => {
  const cutoff = Date.now() - 90000;
  for (const room of rooms.values()) {
    for (const client of room.clients) {
      if (client.lastPong < cutoff) {
        closeClient(client, 1001, 'heartbeat timeout');
        continue;
      }
      try { client.socket.write(encodeFrame(Buffer.from(String(Date.now())), 0x9)); } catch {}
    }
  }
}, 30000);
heartbeat.unref();

server.listen(PORT, HOST, () => {
  log(`Diggerz multiplayer server listening on ${HOST}:${PORT}`);
  log(`Local client URL: ws://127.0.0.1:${PORT}`);

  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const info of entries || []) {
      if (info.family === 'IPv4' && !info.internal) {
        log(`LAN client URL:   ws://${info.address}:${PORT}`);
      }
    }
  }
  log(`Health check: http://127.0.0.1:${PORT}/health`);
  log(`Battle map pool (random per new room): Default Map${customBattleMaps.length ? ' + ' + customBattleMaps.map(m=>m.name).join(' + ') : ''}`);
});

function shutdown(signal) {
  log(`${signal}: shutting down.`);
  for (const room of rooms.values()) {
    for (const client of room.clients) closeClient(client, 1001, 'server shutdown');
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

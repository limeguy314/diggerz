# diggerz-server (+ client)

One package: **HTML game client** + **WebSocket server**.

- Open the site in a browser → play
- Same process serves the page and the game protocol
- Ready for **GitHub + Render**

## Folder layout

```text
diggerz-server/
  package.json
  render.yaml
  README.md
  public/
    index.html      ← full diggerz client (build 21.17, patched)
  src/
    index.js        ← HTTP static + WebSocket
    packet.js
    world.js
    player.js
    room.js
```

## Run locally

```bash
cd diggerz-server
npm install
npm start
```

Open **http://localhost:10000/**

The page auto-targets `localhost` as the game server.  
Append **`?local=1`** to use the old in-browser Dig+Trade service instead of the Node server.

## Deploy on Render

### A. Push to GitHub

```bash
cd diggerz-server
git init
git add .
git commit -m "diggerz client + server"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### B. Create Web Service

1. [render.com](https://render.com) → **New → Web Service**
2. Connect that repo
3. Settings:

| Field | Value |
|--------|--------|
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Plan | Free (or paid) |

4. **Create Web Service** and wait until **Live**

### C. Play

Open:

```text
https://YOUR-SERVICE.onrender.com/
```

That’s it — the client uses the same host for `wss://…` automatically.

Free tier may sleep after idle; first load can take ~30–60 seconds.

## Optional query params

| URL | Behavior |
|-----|----------|
| `/` | Hosted mode → Node WebSocket server |
| `/?local=1` | In-browser local Dig+Trade only |
| `/?server=other.host.com` | Force another WebSocket host |

## Protocol (short)

Server handles login, world, spawn, inventory, mining, **weapon echo (opcode 287)**, basic chat.  
See `src/room.js` to extend multiplayer.

## Health

`GET /health` → `{"ok":true,"service":"diggerz-server",...}`

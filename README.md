# Diggerz Multiplayer Restoration

This build uses the uploaded original `diggerz-fixed-build15(2).html` as the game client. The original rendering, physics, inventory, mining, drops, placement, and UI remain in the HTML; the Node server only supplies multiplayer synchronization.

## Multiplayer behavior

- Players in the same room see one another and their names move with them.
- Everyone in a room shares one live copy of the original Free Dig map.
- Mining and block placement are synchronized to everyone in the room.
- Mined blocks are added to the miner's original inventory UI.
- Chat is broadcast to everyone in the room.
- There is no map-selection UI or map URL parameter.
- When the last player leaves a room, the room is destroyed; the next player gets a fresh original map.

## Render

- Runtime: Node
- Build command: `npm install`
- Start command: `npm start`
- Plan: Free for beta testing

The server binds to `0.0.0.0` and `$PORT` automatically.

## Local test

```bash
npm install
npm start
```

Open `http://localhost:3000/` in two browser windows. Use the same default URL so both clients enter the public room.

`/health` should return `diggerz multiplayer server ok`.

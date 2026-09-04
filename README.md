# Diggerz multiplayer restoration test build

This package turns the recovered **Free Dig** mode into a small multiplayer test
server/client pair.

## What is synchronized

- Other connected players are visible to everyone in the same room.
- Player movement is broadcast.
- Every room starts from the normal/default map. Players never select the map.
- Everyone joining the same room automatically receives that same map state.
- Blocks broken by one player disappear for everyone.
- Blocks placed by one player appear for everyone.
- Mining progress is shared.
- Block inventory changes are sent back to the player who mined/placed.
- Chat is broadcast to every player in the room.
- When the last player leaves a room, the room is deleted and its map resets.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000/
```

Open that URL in two browser windows to test multiplayer.

### Rooms

The URL may optionally specify a room name:

```text
http://localhost:3000/?room=test
```

Players using the same room share the same normal/original map and all block/player/chat changes.
Players cannot select a map. There is no `?map=` option.

If no room is supplied, everyone joins the `public` room. When the final player leaves,
that room is destroyed. The next player gets a fresh copy of the normal/original map.

## Deploying to Render

Upload the whole project to GitHub, then create a Render **Web Service** from the repository.
Use:

- Runtime: `Node`
- Build command: `npm install`
- Start command: `npm start`
- Plan: `Free`

Render provides the public HTTPS URL and the game uses the same-origin WebSocket endpoint.

Use the host's Node service with:

```text
npm install
npm start
```

The server listens on the platform-provided `PORT` environment variable.

The game uses the same-origin WebSocket endpoint:

```text
/ws
```

If the host serves the site over HTTPS, the browser automatically uses `wss://`.
For HTTP it uses `ws://`.

## Important test-server behavior

This is deliberately an in-memory restoration server. It does **not** write the
shared map to disk/database. That is what makes the requested reset behavior
simple: once the room has zero players, its state is discarded.

The recovered client still contains the old local-service code for reference,
but Free Dig now uses the WebSocket connection instead.

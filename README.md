# Diggerz.io Build 23.2 — Public Release Candidate

## Release branding and credits
- The in-game Changelog page now documents the Reblasted/Resurrection Build 23 release history instead of the obsolete original 2020 changelog.
- Menu branding: `Made by HeuFancy and Lime, Rebuilt by a clanker...` and `Reblasted` use the recovered rare-item popup bitmap font around the Diggerz.io logo.
- The Information page identifies Diggerz.io Reblasted as rebuilt by HeuFancy and Lime with assistance from ChatGPT 5.5.
- MeanDean is credited as the original creator of Diggerz.io and Coaster Town, with a thank-you for creating both games.

Build 23.2 is the targeted release patch on top of Build 23.1. One Render Web Service hosts the game, map editor, audio, and WebSocket multiplayer server.

## Build 23.2 fixes
- Bluetooth Speaker / rapid-building recovery: queued placements no longer permanently fail just because the original inventory slot was emptied or moved by a preceding placement. The build handler searches for the matching live block stack and preserves the selected block variant.
- The multiplayer server now sends the authoritative tile result back to the player who placed it as well as every peer, so local and remote terrain repair to the same server state.
- Switching away from the browser tab no longer lets the dead legacy Diggerz connection check eject a player from an active Resurrection multiplayer room. The current Render WebSocket heartbeat remains active.
- Added a canonical JSON position fallback in addition to original native movement packets. Native movement remains primary; the fallback corrects badly stale remote positions after missed/throttled packets.
- Persistent wins now use the recovered yellow number in the player nameplate spawn packet. The leaderboard number is restored to current-round PvP kills and resets at the next match.
- Battle Royale shrinking now drives the recovered original flashing white Diggerz border walls through the original native world-shrink packet path; the reconstructed red DOM overlay/fill was removed.
- Existing random PvP map rotation remains enabled.

## Map editor 23.2
Open `/map-editor` or Admin → Open Map Editor.

The editor now has two actual tile layers:
- **Foreground** for normal playable/collidable blocks.
- **Backdrop Layer** for Castle Bknd, wallpaper, backdrop-type blocks, etc. Foreground blocks may occupy the same cell and render over them.

The exported JSON stays backward-compatible with Build 23 maps. Build 23.2 adds an optional `backgroundTiles` array, so older 23.0/23.1 maps import normally.

The recovered left-facing slope variants are also exposed. Original Diggerz variants 4/5/6 are the horizontal mirrors of slope variants 1/2/3 for blocks that support the recovered slope system. The editor now also has **Upright / Upside Down** orientation controls for the full block catalog. For easier use, **double-click a block in the palette** to open a confirmation prompt that toggles that selected placement between upside down and upright. Ceiling-slope placements are exported using recovered native Diggerz variants where possible; other upside-down placements carry a backward-compatible orientation flag in the map JSON and are applied when the custom map loads.

### PvP maps
1. Export from `/map-editor`.
2. Put each map `.json` in `/maps`.
3. Commit/redeploy the same Render service.
4. Each new Battle Royale room randomly chooses from Default Map + all valid PvP JSON files, avoiding an immediate repeat when possible.

### Dig+Trade map
If Lime finishes the replacement Dig+Trade map, export it from the same editor and name the file exactly:

`digtrade.json`

Put it in `/maps`. Build 23.2 reserves that filename for the single Dig+Trade base map and does **not** include it in the PvP rotation. If that file is absent, the normal reconstructed Dig+Trade map is used.

**Keep your existing `/maps/*.json` files in GitHub when applying future builds.** The release ZIP cannot include maps that were created separately on your computers and were not uploaded here.

## Preserved Build 23.1 systems
- 10-player automatic rooms; player 11 starts the next room.
- 30-slot inventory.
- Consumable weapons, with the default black Mortar retaining infinite uses.
- Mining/tool gear remains reusable.
- Dig+Trade blocks PvP weapon fire while Excalibur/Lightswords remain usable as tools there and deal player damage only in Battle Royale.
- All 16 Lightsword variants remain in the super-rare mining pool and out of the normal weapon pool.
- Two-stage server-authoritative anti-scam trading.
- Recovered original flashing white Battle Royale border walls with native solid physics, shrink warnings/countdown, continued shrinking after elimination, and win audio.
- Kill coins, kill feed, round stats, and current-round kill leaderboard.
- Bluetooth Speaker one-per-Dig+Trade-server rule, synchronized rainbow state, positional four-track music.
- Cotton Candy Machine/Candy and Trading Chip mechanics and positional sounds.
- All three Swivel Turret variants.
- Admin typed player targeting, teleport/kill, lava kill presentation, this-server/global announcements, and map editor launcher.
- Shop catalog/pricing/limited items from Build 23.1.
- Resurrection browser-local account binding. This still cannot recover historical Diggerz.io accounts unless the original account backend/database becomes available.

## Audio files
- `levelup.ogg`
- `music_theme.ogg`
- `music_theme2.ogg`
- `music_theme3.ogg`
- `music_theme4.ogg`
- `balloon_pop.ogg`
- `swap.ogg`

## Reconstructed Battle Royale timing
The original post-FIGHT shrink timing was not recovered. Defaults remain configurable through Render environment variables:
- `DIGGERZ_BUILD_MS=40000`
- `DIGGERZ_FIRST_SHRINK_MS=90000`
- `DIGGERZ_SHRINK_INTERVAL_MS=60000`
- `DIGGERZ_SHRINK_WARNING_MS=3000`
- `DIGGERZ_SHRINK_STEP=8`

The second shrink starts elimination, and shrinking continues until one player remains.

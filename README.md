# Diggerz.io Reblasted — Build 24.0

## Build 24.0 — patches, PvP polish, and RGB Weekend
- Item drops now fall through cleared space instead of remaining suspended in mid-air.
- Mining bonus drops now use fresh random rolls instead of being tied to a map coordinate.
- Player-placed blocks cannot be recycled to repeatedly generate bonus loot, closing the infinite Super Rare farming exploit.
- Mining a terrain block no longer gives that same block back to the player's inventory; breaking terrain is now destructive and only the randomized mining reward table can produce loot.
- Mining no longer returns a free copy of the exact terrain block that was broken; only randomized mining rewards enter inventory.
- Battle Royale music now ducks to a lower volume during active combat instead of stopping, then returns to full volume when a winner is declared.
- Leaving PvP before a match starts now cleans up the PvP music instead of allowing it to continue outside the mode.
- Restored the older Battle Royale countdown/message placement and presentation while retaining the newer font.
- Added **RGB Weekend** every Saturday and Sunday. The normal “Today’s Super Rares” display becomes **RGB WEEKEND!** and features three rotating RGB variants as the only featured Super Rares for the weekend.
- Added animated normal RGB variants for Ball Cap, Wings, Trance Eyes, Jetpack, Military Hat, Mohawk, Spiky Hair, Cute Bob, Short Hair, the K-Pop set (shirt, pants, shoes, and Stetson), Sparkle Shoes, Sparkle Gloves, Retriever, Dual Lightsword, Lightsword, Shirt, WC Shirt, and Pants.
- Added matching **True RGB** variants with a darker rainbow cycle.
- Outside RGB Weekend, regular True RGB finds now use a **1/100,000** event roll. **True RGB Military Hat** is the troll-tier **1/1,000,000** find, while each True RGB K-Pop piece (shirt, pants, shoes, and Stetson) has its own **1/101,337** roll.
- True RGB pickup celebrations now fire for multiplayer shared-drop awards as well as normal pickups and are broadcast across every active multiplayer room. The global message reports the actual item's odds.
- Equipped RGB and True RGB cosmetics now keep their animated rainbow treatment instead of only appearing RGB in inventory icons.
- RGB and True RGB Wings inherit the recovered Golden Wings movement/gravity behavior and add animated rainbow sparkles.
- RGB and True RGB K-Pop Shoes inherit the recovered K-Pop dance animation, play **JAMS VIP** as proximity audio that fades in near a wearer and fades out with distance, and leave an RGB sparkle trail while walking.
- RGB and True RGB Stetsons now animate the **entire hat** through the RGB cycle instead of only the hat band.
- RGB/True RGB Lightswords retain the recovered Lightsword mining/tool and Battle Royale melee behavior.
- RGB Weekend is synchronized to **America/New_York** weekend dates so all players see the same event window and featured trio.

# Diggerz.io Reblasted — Build 23.9

## Build 23.9 — economy protection, Beta Gun, support, and UPDATE hat
- Patched the long-standing multiplayer **trade/reload duplication race**. Offered items are persisted out of the local inventory before the offer can complete, trade cancellation persists restored items, and duplicate completion messages are ignored.
- Fixed the recovered **Beta Gun** firing path so its legacy beam endpoint no longer freezes the client.
- Added **Beta Gun** to the **common mining weapon pool**. It remains a normal category-2 item and is tradable through the existing two-stage trade system.
- Added the new **UPDATE Hat** as item **395**. Its placement is handled only for that hat so existing hat offsets are not changed.
- Replaced the removed Login menu slot with **Donate**.
- Added **Support Diggerz** with a **$1–$1000** amount slider and Cash App redirect to **$Houstonswallet**.
- Added a public **verified supporter leaderboard**. Clicking Donate does not create leaderboard credit; verified entries are added through the authenticated admin tools.
- Added admin controls for adding/removing verified donation entries.
- Donation records use `DIGGERZ_DONATIONS_FILE` when configured, otherwise `donations.json` beside the server. On Railway, point this at persistent storage if the leaderboard must survive redeploys.
- Added `build239-client.js` to both Railway-hosted play and the downloadable itch.io client package.
- Updated active multiplayer build identifiers and the itch package to **23.9**.

## Build 23.8 — Railway / itch migration and fixes
- Reduced the recovered lightsword swing sound to **30%** of the normal effects level.
- Added a **120 ms** per-client lightsword SFX cooldown so rapid swings cannot stack overlapping audio.
- Fixed server-authorized **Give Item**, **Give Coins**, and **Kill** actions when an admin targets themselves.
- Removed the player **Log In / Log Out** feature and retired the passwordless account client. Player progress remains browser-local guest progress.
- Prepared the browser client to connect to the permanent Railway multiplayer/admin backend when the static client is hosted on itch.io.
- Added CORS/preflight handling for protected admin API calls from itch.io's `*.itch.zone` game frames.
- Updated the active multiplayer build identifiers to **23.8**.

The Railway service hosts the multiplayer server, moderation API, map editor, and the current web build. The client can also be packaged separately for itch.io while continuing to use Railway as its backend.

## Build 23.7 — stability, bans, and admin security
- Movement/native relay traffic is rate-limited and encoded once per broadcast instead of once per recipient.
- Slow-client backpressure drops disposable movement/aim updates before they pile up and lag the room.
- Browser WebSocket send buffering is also capped for transient movement packets.
- Admin codes are now verified by the server; the browser receives a temporary 8-hour admin session token.
- The browser no longer contains the admin password verifier hashes.
- Set `DIGGERZ_ADMIN_OWNER_CODE` and `DIGGERZ_ADMIN_LIME_CODE` as private Render environment variables to rotate both admin codes without editing the game files. When either variable is set, that role’s old built-in code is disabled.
- Five failed admin-code attempts in a 10-minute window temporarily blocks further attempts for 15 minutes from that address.
- Admin now supports Kick, timed Ban, Permanent Ban, reason fields, active-ban listing, and Unban.
- Banned players are redirected to `/banned`, which uses the requested black background, red text, live multi-unit timer, reason text, and automatic redirect when a timed ban expires.
- Ban records are written to `DIGGERZ_BANS_FILE` when configured, otherwise `bans.json` beside the server. On Render, point `DIGGERZ_BANS_FILE` at a persistent disk path if bans must survive deploys/restarts.
- Disabling Inspect Element is intentionally not used as a security measure; protected actions require server authorization instead.



## Build 23.4 — Left/Right map orientation
- Map Editor now gives every block four explicit placement orientations: **Upright, Right, Left, Upside Down**.
- **Right** rotates 90° clockwise; **Left** rotates 90° counter-clockwise.
- Left uses a new flag bit (`8`), so legacy mirror-X (`1`), upside-down (`2`), and right-rotation (`4`) data remain compatible.
- The Render map sanitizer now preserves flag values through `15` instead of stripping the new Left flag.
- Build 23.3 music behavior is intentionally unchanged in this update; this build only addresses the requested map-editor orientation addition.

Build 23.3 is a major Build 23 update on top of the 23.2 Reblasted/Lime-barrier release. One Render Web Service hosts the game, map editor, audio, and WebSocket multiplayer server.

### 23.3 stability patch
- Keeps the room cap at **10 players**; automatic matchmaking sends player 11 to a new room.
- Removes duplicate `room-ready` spawn bursts and high-frequency hidden debug logging that became expensive with several players.
- Adds periodic authoritative room rosters plus faster dead-socket cleanup to remove ghost players.
- Throttles JSON position fallback while keeping native movement primary.
- Mouse-follow aim synchronization now applies to **weapons only**, not mining tools.
- Music code is intentionally unchanged in this patch.

## Build 23.3

### Music
- **Dig+Trade music player:** a compact player appears below the in-game Exit button while connected to Dig+Trade.
- Choose **Track 1–4** (`music_theme.ogg` through `music_theme4.ogg`).
- Controls: **Play, Pause, Restart, and -2 sec**.
- **Battle Royale pre-match music:** the server randomly chooses one of the same four tracks for each match.
- The chosen song plays during the build phase, begins fading when the final **3, 2, 1** countdown starts, and stops at **FIGHT**.
- The server sends the selected track and start time so players joining the build phase can synchronize to the current song.

### Map editor
Open `/map-editor` or Admin → Open Map Editor.

Build 23.3 keeps the existing Foreground/Backdrop layers, recovered mirrored slopes, and upside-down support, and adds an easy **90-degree Sideways (Horizontal)** orientation.

The simplest workflow is:
1. Double-click a block in the palette.
2. Choose **Upright**, **Sideways (Horizontal)**, or **Upside Down**.
3. Place the block normally.

The same three choices also appear as shortcut buttons beneath Blocks / Backgrounds. Build 23.3 extends the optional map orientation flags while remaining backward-compatible with existing Build 23 JSON maps.

### Mining rarity / drop overhaul
Build 23.3 applies the rarity information supplied by KaiRotten. The quantities below are **stack sizes when the reward drops**; the established overall mining tier chance bands remain 0.12% Super Rare, 0.30% Rare, and 12% Common bonus rewards.

**Common**
- Wood Panels / Wood ×50
- Lava ×50
- Blue launcher ×1
- Yellow launcher ×1
- other supported launcher weapons ×3; default black Mortar remains infinite-use and is excluded from drops
- Blade / recovered Saw-weapon equivalent ×1
- Shotgun ×3
- Bomb / recovered TNT-equivalent block ×2

**Rare**
- Blue Ray Gun ×2
- Red Ray Gun ×2
- Black, Red, Blue Ball Caps ×1
- Water ×25
- Color Ladder ×50
- Desert / Sand ×25
- Ice Tiles ×50
- Red, Yellow, Blue One-Ways ×25
- additional One-Way colors ×25, allowed as neutral additions
- Musket ×3

**Super Rare**
- The Super Rare board continues to rotate three items every day.
- WC Shirts
- all 16 Lightswords
- non-basic colored Ball Caps
- Army Helmet
- Dalmatian
- Light Gun
- eligible currently-active Shop items
- Beta Gun is now included in the common mining weapon group as of Build 23.9.
- Decoration blocks and Cart Pusher are excluded from normal player reward pools; staff can still access decorative content through Admin tools.

### Inventory
- Player inventory is expanded from **30 to 50 slots**.
- Existing browser saves are preserved and padded to 50 slots rather than reset.

## Preserved Reblasted systems
- Lime's Build 23.2 Battle Royale barrier/shrink fix is preserved unchanged.
- 10-player automatic multiplayer rooms; player 11 starts the next room.
- Random PvP map rotation from Default Map + valid `/maps/*.json` files.
- `maps/digtrade.json` remains the optional dedicated Dig+Trade base map and is excluded from PvP rotation.
- Foreground + Backdrop map layers and old Build 23 map import compatibility.
- Consumable weapons; default black Mortar retains infinite uses; mining/tool gear remains reusable.
- Dig+Trade blocks normal PvP weapon damage while Excalibur/Lightswords remain usable as tools.
- Two-stage server-authoritative anti-scam trading.
- Kill coins, kill feed, round stats, persistent wins, and current-round kill leaderboard.
- Bluetooth Speaker, Cotton Candy Machine/Candy, Trading Chip, and Swivel Turret systems remain present.
- Admin typed targeting, teleport/kill, this-server/global announcements, PvP override, and map-editor launcher.
- Resurrection browser-local account binding. Historical Diggerz.io accounts still cannot be recovered without the original account backend/database.

## Maps
Keep your existing `/maps/*.json` files in GitHub when applying this build. The package only includes the maps README because maps created separately by HeuFancy/Lime cannot be reconstructed from the release ZIP.

## Audio files
- `levelup.ogg`
- `music_theme.ogg`
- `music_theme2.ogg`
- `music_theme3.ogg`
- `music_theme4.ogg`
- `balloon_pop.ogg`
- `swap.ogg`

## Battle Royale timing
The original post-FIGHT shrink timing was not recovered. Defaults remain configurable through Render environment variables:
- `DIGGERZ_BUILD_MS=40000`
- `DIGGERZ_FIRST_SHRINK_MS=90000`
- `DIGGERZ_SHRINK_INTERVAL_MS=60000`
- `DIGGERZ_SHRINK_WARNING_MS=3000`
- `DIGGERZ_SHRINK_STEP=8`

The second shrink starts elimination, and shrinking continues until one player remains.

## Credits
Diggerz.io and Coaster Town were originally created by **MeanDean**. Diggerz.io Reblasted was rebuilt by **HeuFancy and Lime** with assistance from **ChatGPT 5.5**. Thank you, MeanDean, for creating both games.


## Build 23.7 moderation update

- Admins can ban a username even when that player is not in the admin's current room or is offline.
- The server searches all active rooms, including private rooms, for the exact username and ejects matching live connections immediately.
- The server keeps a bounded recent-player identity ledger containing only username plus hashed installation/IP identifiers. Offline bans can reuse those hashes for stronger enforcement.
- Exact normalized usernames are now also checked when a player connects, so prospective bans take effect on the next join.
- `DIGGERZ_PLAYERS_FILE` can point the recent-player ledger at persistent storage, just like `DIGGERZ_BANS_FILE`.


## Fanmade classic Roblox collab
- Added **Noob Mask**, **Noob Shirt**, **Noob Pants**, and **Noob Gloves** as shop-only collab cosmetics. The four-piece set totals **300 coins** and is scheduled to leave the shop after **December 1, 2026**.
- Wearing the complete Noob set enables a special death effect that bursts the character into its body-part pieces and plays the classic death/oof sound.
- Full-set wearers play the supplied Roblox-style **ouch** sound when damaged by lava.
- Added the **Roblox Rocket Launcher** as a **300-coin Bazooka skin**. It keeps Bazooka gameplay behavior, uses the supplied launch and impact sounds, and replaces the visible missile with a classic stud brick.
- Added **M.U.L.E. (Bitblaster Mix)** as the fifth PvP music selection and as **Track 5** in the music player.
- The new maps are intentionally not part of this patch yet; map-rotation changes will be handled separately when the finished maps are supplied.


## Build 24.0 — Epic Sea rotation update
- Added **The Epic Sea**, built by **HeuFancy**, to the Battle Royale map rotation.
- Removed both Neatfinity Battle Royale maps from the rotation.
- **Canyons** and **The Epic Sea** now announce their map credit in chat when a player enters the room.
- **The Epic Sea** uses its own fixed round music instead of a randomly selected PvP track.
- Roblox Rocket Launcher shop purchases now grant **1,337** launchers per 300-coin purchase.
- Fixed the recovered intro/Super Rare screen so Battle Royale rooms identify themselves as **Battle Royale** instead of **Dig + Trade**.

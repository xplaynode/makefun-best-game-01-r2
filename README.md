[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/xplaynode/makefun-best-game-01-r2/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/xplaynode/makefun-best-game-01-r2/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# The Last Lamplighter

You carry the village's only flame, and on foot you keep its lamps lit through the night while a living darkness called the Gloom creeps in wherever the light fails.

One village on one screen — cobbled streets, houses with warm windows, lamp posts, and a well on the central square — seen at night in deep indigo, with warm amber lamplight as the single bright colour. The Gloom is a smoky tide that seeps in from the edges and along unlit streets: it retreats where lamps burn and swallows a house whose street stays dark too long. Lose every house and the run ends in defeat; survive until dawn and the night is won.

Ten nights win the game. Each dawn offers a choice of one of three upgrades — swifter feet, a brighter lantern, thicker oil, a larger flask, or wind-shield glass — and each night is harder: lamps burn faster, the Gloom moves quicker, wind gusts arrive with a visible warning and snuff lit lamps, and fog thickens on the late nights. The score is houses saved across the run plus lamps lit, and the best score is kept in localStorage.

## How to play

- **Move:** WASD or the arrow keys. Hold **Shift** to run.
- **Light a lamp:** walk into its glow circle — there is no separate button to learn (**E** also works at a little more range).
- **Oil:** the lantern burns oil as you carry it, faster while you run. Stand at the well on the square to refill. If the oil runs dry the lantern dies and you must reach the well in the dark to rekindle — slow and dangerous, never a dead end.
- **Lamps** burn down on their own timers and flicker as they fade; relight them to keep the streets safe.
- **P** or **Esc** pauses, **M** mutes, **R** restarts the run from the end screens. On the dawn screen, press **1**, **2** or **3** (or click) to choose an upgrade.

Sound is made in code with WebAudio — a slow music-box night loop, a chime when a lamp lights, a swell as the Gloom takes a house, a gust whoosh, and birdsong at dawn. There are no audio files, no build step and no network requests: the game is static files under `game/`, drawn entirely in code on a 2D canvas.

Run it locally with `node serve.ts` and open http://localhost:8080. Hand it in with `node main.ts`, which copies `game/` and `screenshots/` to the output directory and writes `dossier.json` there.

Bounty: https://make.fun/bounty/best-game-01

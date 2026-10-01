# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

An Arkanoid/Breakout game in plain HTML, CSS and JavaScript with **zero dependencies** (per README, written in Spanish). The game itself is not implemented yet: the repo currently holds only assets and the sprite helper. There is no build system, package manager, test suite or linter, and no git repo. Once an `index.html` exists, run it by opening it in a browser (or any static file server).

## Architecture

- `assets/spritesheet.js` is a plain global-scope script (no modules), so it must be loaded with a `<script>` tag before game code. It exposes:
  - `loadSpritesheet(cb)`: loads `assets/spritesheet-breakout.png` (path is relative to the HTML page), copies it to an offscreen canvas, then runs queued callbacks. Safe to call multiple times. Draw calls are no-ops until loading finishes.
  - `drawSprite(ctx, name, x, y, w, h)`: `name` is `'paddle'`, `'ball'`, or `'block_<color>'` (e.g. `'block_red'`). Source rects come from the `SPRITES` table.
  - `drawFrame(ctx, frame, x, y, w, h)`: draws a raw `{sx, sy, sw, sh}` frame.
  - `EXPLOSION_FRAMES[color]`: 4-frame break animations per block color, and `EXPLOSION_DURATION` (150, presumably ms). Colors: red, cyan, green, magenta, yellow, hotpink, gray. The `gray` explosion frames reuse the red row; the spritesheet has no gray explosion row.
- Block sprites are 32x16, the paddle is 162x14, and the ball is 16x16 in the spritesheet. Callers scale them via `w`/`h`.
- `assets/sounds/`: `ball-bounce.mp3` and `break-sound.mp3`.

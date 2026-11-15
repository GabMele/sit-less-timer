# Sit-less Timer

A minimalist analog timer for Windows that keeps you from sitting too long. One-hour dial with concentric rings: if you don't stop it, it keeps counting and adds a ring for every extra hour, while gentle sounds repeat until you get up.

**Free, no account, no ads, no data collection.** Everything stays on your device.

## Features

- **Analog dial with rings.** One ring per hour; the planned duration is marked, the overtime turns warm-colored.
- **Elapsed or remaining time.** Click the number to switch between count-up and countdown.
- **Repeating alerts.** Choose the sound (32 synthesized sounds, including public-domain classical melodies, no audio files, plus one optional sound of your own: first 30 s with fade-out, stored locally), volume, number of repeats and interval.
- **Activity summary.** Active time and breaks for today and the last 7 days. Breaks over 3 hours count as absence, not as a break.
- **Taskbar progress** and window flashing when time is up.
- **Compact window**, resizable, optional always-on-top, remembers its position.
- **Light / dark / system theme**, 6 accent colors, UI in English, Italian, French and Spanish.

## Install

Download the installer from the [Releases](../../releases) page, or get it from the Microsoft Store (link coming).

> The installer is not code-signed, so Windows SmartScreen may warn you: choose *More info → Run anyway*.

Requires Windows 10/11 with the WebView2 runtime (already included in Windows 11 and up-to-date Windows 10).

## How it's built

| Piece | Choice | Why |
|---|---|---|
| Shell | [Tauri 2](https://tauri.app) (Rust) | ~1 MB installer instead of ~120 MB with Electron |
| UI | Vanilla HTML/CSS/JS, SVG dial | No framework needed for one screen; the whole app is a few hundred lines |
| Sounds | Web Audio synthesis | No assets to ship, tiny size |
| Data | `localStorage` | Settings and activity log stay local; nothing is sent anywhere |
| Native bridge | `web/native-tauri.js` | Exposes one small `window.native` API (always-on-top, taskbar progress, attention, external links), so the UI code doesn't depend on the shell |

The first version was built with Electron (tag [`electron-v1.0.0`](../../releases)); it was then ported to Tauri. Installer size went from 121 MB to 1.2 MB. Idle memory did not improve (WebView2 spawns several processes), which is an honest trade-off.

Design notes:
- Time is computed from `Date.now()` rather than counting ticks, so it stays correct after sleep or throttling. After a long sleep only one alert is played, not all the missed ones.
- The window is frameless with a custom title bar; the destructive "close" button is small and separated from the frequent controls.
- Security: strict CSP, no remote content, external links limited to one allow-listed domain, minimal Tauri capabilities.

## Develop

Prerequisites: Node.js, Rust, and the Visual Studio C++ Build Tools.

```bash
npm install
npm run dev      # run in development
npm run build    # release build + NSIS installer in src-tauri/target/release/bundle
```

## About this project

Conceived, designed and directed by Gabriele Melendugno; developed with [Claude Code](https://claude.com/claude-code) (AI-assisted). The product decisions, testing and release are mine; most of the code was written by the assistant under my direction.

Made by [nextquo.com](https://nextquo.com), which builds custom websites and apps.

Timer is free and has no ads. If you like it, you can [buy me a coffee](https://ko-fi.com/gabrielem) (completely optional).

## License

[MIT](LICENSE) for the code. The name "Sit-less Timer", the logo and the nextquo.com branding are not covered by the license.

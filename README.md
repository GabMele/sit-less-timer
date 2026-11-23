# Sit-less Timer

A minimalist analog timer for Windows that tracks your sitting time automatically and reminds you to get up. It notices when you step away, counts that time as a break and restarts when you're back.

**Free, no account, no ads, no data collection.** Everything stays on your device.

## Features

**Automatic tracking**
- **Notices when you step away.** If you stop touching the keyboard and mouse for a few minutes (5 by default), an *Are you still there?* card appears on every monitor, small at first and then bigger, with a countdown. Move the mouse and it goes away; otherwise the timer pauses and the minutes you were away count as a break, not as sitting. When you come back, the first input restarts the timer by itself (optional for manual pauses too). It only reads *how long it has been* since the last input, never what you type.
- **Breaks reset the cycle.** While paused, a break arc grows next to the dial and the dial shows how long the break has lasted, with a Resume button; resuming after 10 s or more restarts the dial from zero (shorter pauses are ignored).

**Analog dial**
- **Readable at a glance.** The analog dial shows how long you've been sitting without having to read digits.
- **Rings.** One ring per hour; the goal is marked with a triangle and a tick, overtime turns warm-colored.
- **Elapsed or remaining time.** Click the number to switch between count-up and countdown. Quick durations (25′, 55′ or your own).

**Reminders**
- **Repeating alerts.** 32 synthesized sounds (including public-domain classical melodies, no audio files) plus one optional sound of your own (first 30 s with fade-out, stored locally); volume, number of repeats and interval are adjustable.

**Always-visible stats**
- **Daily bar and summary.** A bar under the dial shows the whole day (activity and breaks, between the day start and end you set). The summary covers today and the last 7 days, history is kept up to 6 months, and you can export it as CSV.

**Customization**
- Colors for work, break and overtime; light / dark / system theme and 6 accent colors; *Are you still there?* card position, two-color gradient and optional soft sound (with a test button); UI in English, Italian, French and Spanish.

**Window**
- Compact and resizable, optional always-on-top and launch at Windows startup, remembers its position, taskbar progress and window flashing when time is up.

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
- Security: strict CSP, no remote content, external links limited to an allow-list (nextquo.com, ko-fi.com), minimal Tauri capabilities.

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

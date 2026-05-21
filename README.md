# Citation Rush

A 45-second endless-runner booth game for **ALA 2026**, built for Clarivate's Nexus Extend demo. Companion to [Citation Challenge](https://github.com/) (the diagnostic-puzzle game). This one's the arcade-reflex counterpart.

Player runs down a 3-lane track, collects **trusted citations** (Web of Science, peer-reviewed, library-accessible), and dodges four kinds of bad citations:

- ⚠️ **Unreviewed preprints**
- 🔒 **Paywalled sources**
- 💀 **Predatory journals**
- 👻 **Hallucinated references**

Three hits ends the run. End-of-run transitions into the same Nexus Extend demo screen as Citation Challenge with the framing line: *"See how Nexus dodges bad citations for you."*

See [`SPEC.md`](./SPEC.md) for the full design spec.

## Stack

- **React + Vite + TypeScript**
- **Tailwind CSS** (v4)
- **Three.js** for the 3-lane 3D gameplay
- **Storage:** behind the `StorageBackend` interface in `src/storage.ts`. The shipped backend is `localStorage` (key: `citation-rush:runs`) on both Vercel and the kiosk. A SQLite backend was planned but deferred — see [Storage](#storage) below.

## Local development

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run preview    # serve the production build locally
```

## Deployment

- **Vercel** auto-deploys from `main` for shareable previews. Default Vite preset — no extra config needed.
- **Booth kiosk** runs the production build in Chrome `--kiosk` mode against `npm run preview` on `http://127.0.0.1:4173`. Offline-first; no network required at runtime. **Setup, launch scripts, and the day-of test checklist are in [`kiosk/README.md`](./kiosk/README.md).**

## Storage

The leaderboard, run history, and email opt-ins all live in **`localStorage`** under the key `citation-rush:runs`. On the kiosk, the launch script runs Chrome with `--user-data-dir=%LOCALAPPDATA%\citation-rush-kiosk-profile`, which scopes that `localStorage` to a dedicated Chrome profile folder. The data persists across reboots and across `start-kiosk.cmd` re-launches.

**Important for booth staff during the show:** do not "Clear browsing data" inside the kiosk's Chrome session, and do not delete the `%LOCALAPPDATA%\citation-rush-kiosk-profile` folder. Either will wipe the leaderboard. Recommended daily reset path: open the admin panel (5 taps on the Welcome screen logo), download both CSV exports, then click **Reset leaderboard** — that's the safe, audited way to start a fresh day.

A `better-sqlite3` backend writing to `./data/citation-rush.db` was specified in earlier drafts of [`SPEC.md`](./SPEC.md) §8 but **was not implemented**. `better-sqlite3` is a Node-native module and can't run in a browser bundle — it needs an Electron host (or a co-located Node server). We chose to ship Chrome `--kiosk` + `localStorage` for ALA 2026 since it satisfies the data-retention requirement when paired with the dedicated Chrome profile. The `StorageBackend` interface in [`src/storage/types.ts`](./src/storage/types.ts) is shaped to make swapping in SQLite a one-file change later, if a future build adds Electron.

## Admin panel

Hidden admin panel: **5 taps within 3 seconds on the top-left "Nexus Extend · by Clarivate" wordmark on the Welcome screen** opens it directly. No password. From there: leaderboard, aggregate stats (total / today / avg score / completion rate), audio toggle, CSV exports (all runs + email opt-ins), and leaderboard reset.

## Build phases

Following the phasing in [`SPEC.md`](./SPEC.md) section 10:

| Phase | Scope | Status |
|---|---|---|
| 1 | Core gameplay loop (3-lane scene, controls, spawning, collision, HUD) | ✅ shipped |
| 2 | Flow + polish (welcome, intake, tutorial, countdown, results, feedback, SFX) | ✅ shipped |
| 3 | Persistence + admin panel (localStorage, leaderboard, CSV exports) | ✅ shipped |
| 4 | Nexus Extend demo integration (ported from Citation Challenge) + idle reset | ✅ shipped |
| 5 | Kiosk hardening (pause-on-hidden, Chrome `--kiosk` scripts, docs) | ✅ shipped |

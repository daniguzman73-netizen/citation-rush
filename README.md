# Citation Rush

A 60-second endless-runner booth game for **ALA 2026**, built for Clarivate's Nexus Extend demo. Companion to [Citation Challenge](https://github.com/) (the diagnostic-puzzle game). This one's the arcade-reflex counterpart.

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
- **Storage:** dual-mode behind `src/storage.ts` — `localStorage` on Vercel deployments, `better-sqlite3` (`./data/citation-rush.db`) on the local kiosk build

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
- **Booth kiosk** runs the production build in Chrome `--kiosk` mode (Electron wrapper TBD). Offline-first; no network required at runtime. **Setup, launch scripts, and the day-of test checklist are in [`kiosk/README.md`](./kiosk/README.md).**

## Admin panel

Hidden admin panel: **5 taps within 3 seconds on the "Clarivate · Nexus Extend" lockup in the bottom-right of the Welcome screen** opens a password prompt. From there: leaderboard, aggregate stats (total / today / avg score / completion rate), audio toggle, CSV exports (all runs + email opt-ins), and leaderboard reset.

Set the password via the `VITE_ADMIN_PASSWORD` env var at build time (e.g. in the Vercel project settings, or in `.env.local` for kiosk builds). Default if unset: `admin`. **Change this before booth deploy.**

## Build phases

Following the phasing in [`SPEC.md`](./SPEC.md) section 10:

| Phase | Scope | Status |
|---|---|---|
| 1 | Core gameplay loop (3-lane scene, controls, spawning, collision, HUD) | in progress |
| 2 | Flow + polish (welcome, intake, tutorial, countdown, results, feedback) | pending |
| 3 | Persistence + admin panel | pending |
| 4 | Nexus Extend demo integration | pending |
| 5 | Kiosk hardening | pending |

Each phase is gated on playtest sign-off before moving on.

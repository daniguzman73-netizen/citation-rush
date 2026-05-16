# Booth kiosk setup — Citation Rush

This folder has the Windows launch scripts and setup checklist for running
Citation Rush on the ALA 2026 booth kiosk hardware.

The current shipping configuration is **Chrome `--kiosk` against a local Vite
preview server**. Data persists in browser `localStorage` (resets only if
the kiosk-profile folder is wiped — see [Day-of operation](#day-of-operation)
below). An Electron wrapper with `better-sqlite3` is a future option; until
that lands, the local-disk database called out in SPEC §8 is *not yet active*
on the kiosk. The storage abstraction is shaped to make that swap a one-file
change later (see [`src/storage.ts`](../src/storage.ts)).

---

## Prerequisites (one-time, on the kiosk PC)

1. **Node.js 20+** — install from <https://nodejs.org/> (LTS). Confirm with
   `node --version`.
2. **Google Chrome** — system install, latest stable.
3. **Project source** — clone the repo to a stable path (e.g.
   `C:\citation-rush`).
4. **Dependencies** — from the project root: `npm install`.
5. **Set the admin password** *(important — change from the default before
   deploying to the booth)*. Create `.env.local` in the project root:

   ```
   VITE_ADMIN_PASSWORD=<pick something>
   ```

   This bakes into the build. Re-build (`npm run build`) any time you change it.

---

## Launching the kiosk

From a `cmd` or Explorer:

```cmd
kiosk\start-kiosk.cmd
```

Or PowerShell:

```powershell
.\kiosk\start-kiosk.ps1
```

What the script does:

1. Builds `dist/` if it doesn't exist (skips on subsequent launches).
2. Starts `npm run preview` on `http://127.0.0.1:4173` in a background window.
3. Launches Chrome in `--kiosk` mode (fullscreen, no chrome UI) against that URL,
   using a dedicated profile at `%LOCALAPPDATA%\citation-rush-kiosk-profile` —
   isolated from any normal Chrome profile on the same machine.

Chrome flags set:

- `--kiosk` — fullscreen, no address bar, no tabs
- `--kiosk-printing` — suppress the print dialog
- `--noerrdialogs --disable-session-crashed-bubble --disable-infobars` — no
  pop-ups when something hiccups
- `--disable-features=TranslateUI` — no translate prompts
- `--overscroll-history-navigation=0` — touchscreen back-swipe disabled
- `--disable-pinch` — no zoom on touch
- `--user-data-dir=…` — isolated kiosk profile

---

## Autostart on boot

To have the kiosk launch on Windows login:

1. Press <kbd>Win</kbd>+<kbd>R</kbd>, run `shell:startup`.
2. Drop a shortcut to `kiosk\start-kiosk.cmd` into that folder.
3. On next boot it launches automatically.

Recommend also setting up **auto-login** for a dedicated `booth` user account
so the kiosk goes from power-on to running game with no manual sign-in.

---

## Emergency exit

- **Alt+F4** — closes Chrome immediately. Returns to the desktop.
- **Ctrl+Shift+Q** — same (Chrome's "quit" shortcut).
- **Alt+Tab** — switch to another window (useful for booth staff to peek at
  the preview server console without quitting the game).

The Citation Rush app itself blocks the right-click context menu, text
selection, and `--kiosk` blocks the dev-tools / address bar — visitors have
no way out.

---

## Admin panel

While at the **Welcome** screen, **tap the "Clarivate · Nexus Extend" lockup
in the bottom-right 5 times within 3 seconds**. A password prompt opens.
Password comes from `VITE_ADMIN_PASSWORD` (default `admin` — change before
deploy, see prerequisites).

From the panel you can:

- See aggregate stats (total runs / today / avg score / completion rate)
- Toggle audio on/off
- Download all runs as CSV
- Download just the email opt-ins as CSV (marketing handoff)
- Reset the leaderboard (with confirmation)

---

## Day-of operation

- **Where data lives:** browser `localStorage` inside the kiosk profile at
  `%LOCALAPPDATA%\citation-rush-kiosk-profile`. **Don't delete that folder
  during the show** — the leaderboard lives there.
- **Daily reset:** spec recommends resetting the leaderboard each conference
  morning (admin panel → Danger zone → Reset). Export the CSVs first if you
  want to preserve the prior day.
- **Audio:** mute toggle is in the bottom-left of every non-gameplay screen
  AND in the admin panel.

---

## End-to-end test checklist (run before ALA opens)

- [ ] Welcome → Press start → Intake fills with stub data → Tutorial → 3-2-1 countdown → 60 s run plays at 60 fps
- [ ] Spaces and apostrophes type cleanly in the institution input ("The New School", "St. John's")
- [ ] Skip → run plays but does not appear in the leaderboard
- [ ] 3 hits ends the run mid-timer with a freeze-frame
- [ ] Score / hearts / time HUD update during play
- [ ] Particles, screen shake, hit flash all fire
- [ ] Coin / hit / jump / countdown SFX audible (or silent when muted)
- [ ] Switch tabs mid-run → "Paused" overlay appears, game freezes; switch back → game resumes
- [ ] After Results: Watch it work → Nexus Reveal mock → Continue → Leaderboard → Play again skips intake
- [ ] 30 s idle on non-gameplay screen returns to Welcome
- [ ] 5 taps on the corner logo opens the admin panel; correct password unlocks; wrong password rejects
- [ ] Admin: Download all runs CSV opens with proper columns; download opt-ins CSV; reset wipes the table
- [ ] Alt+F4 closes Chrome cleanly

---

## Known gaps until a future phase

- **No SQLite yet.** Per SPEC §8, the kiosk should use `better-sqlite3` at
  `./data/citation-rush.db` for persistence that survives a profile wipe.
  The browser `localStorage` backend currently in use is functionally equivalent
  for booth operation but loses data if the Chrome profile dir is deleted.
  Swapping in SQLite requires the kiosk to run under an Electron wrapper (or a
  small co-located Node server) since `better-sqlite3` is a Node-only native
  module. Storage code in [`src/storage.ts`](../src/storage.ts) is structured
  so this is a one-file swap when that wrapper lands.
- **No music loop yet.** SFX are synthesized via WebAudio; the propulsive
  background track called out in SPEC §7 will need a licensed asset before the
  booth wants it on.

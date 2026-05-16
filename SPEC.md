# Citation Rush — Booth Game Spec

**Project:** Citation Rush — second Nexus Extend booth game for ALA 2026
**Context:** Companion to Citation Challenge (the diagnostic puzzle game already built). This is the arcade-reflex counterpart.
**Last updated:** May 2026

---

## 1. Concept in one paragraph

Citation Rush is a 60-second endless-runner game in the style of Subway Surfers. The player controls a character running down a 3-lane track, **collecting trusted citations** (Web of Science, peer-reviewed, library-accessible) and **dodging four types of bad citations** (predatory journals, unreviewed preprints, paywalled sources, hallucinated references). Three hits = game over. At the end of the run, the screen transitions to the Nexus Extend demo (same screen as Citation Challenge's reveal) with the framing: **"See how Nexus dodges bad citations for you."**

---

## 2. Strategic goals

Identical to Citation Challenge — this game is a second funnel into the same demo, not a different message.

1. **Attract booth traffic** — the arcade visuals pull a different visitor profile than the puzzle game. Subway Surfers-style movement is recognizable from across the floor.
2. **Teach the citation-trust taxonomy** — predatory, preprint, paywalled, hallucinated — but at glanceable speed.
3. **Set up the Nexus reveal** — the player's struggle to dodge bad citations *is* the demo's value proposition. Nexus does this automatically.
4. **Capture leads** — name, institution, email opt-in.

### What this game does *differently* from Citation Challenge

| | Citation Challenge | Citation Rush |
|---|---|---|
| **Mode** | Diagnostic puzzle | Arcade reflex |
| **What's taught** | How to evaluate a citation | The shape of the threat |
| **Player profile attracted** | The serious librarian | The curious passerby |
| **Reveal payoff** | "Nexus does this faster than you" | "Nexus catches what you can't" |
| **Intake** | Discipline + name + institution | Name + institution only (no discipline) |

Both games funnel to the same Nexus Extend demo screen.

---

## 3. Audience and tone

Same as Citation Challenge — academic librarians at ALA 2026.

**Tone:** Playful arcade aesthetic on the outside, accurate vocabulary on the inside. The game can call them "bad citations" in the welcome screen (the hook), but the post-game breakdown uses precise language:
- "Predatory journals" — not "fake journals"
- "Unreviewed preprints" — not "unfinished papers"
- "Paywalled sources" — not "inaccessible papers"
- "Hallucinated citations" — not "fake citations"

The "preprints aren't *bad*, they're worth verifying" rule from Citation Challenge applies here too.

---

## 4. Game flow (screen by screen)

### Screen 1 — Attract / Welcome
- Big title: **CITATION RUSH**
- Subhead: *"Grab the good. Dodge the bad. See if you can outrun AI's worst citations."*
- Background: subtle animated demo of the gameplay (character running, citations floating past) — pulls the eye from across the booth
- Primary CTA button: **"Press start →"**
- Secondary text link below: **"Just show me the demo →"** — smaller, lower visual weight. Routes directly to Screen 7 (Nexus Extend demo), bypassing intake and gameplay. For visitors who want the product, not the game.
- Bottom corner: small Nexus Extend / Clarivate logo lockup

### Screen 2 — Player intake
- Name (required)
- Institution (autocomplete from predefined list — same list as Citation Challenge)
- Email (optional)
- Opt-in checkbox: *"Send me Nexus updates"* — **unticked by default**
- Button: **"Let's run →"**

### Screen 3 — How to play (3-second tutorial)
A single screen with three icons in a row:
- **⬅️ ➡️** Switch lanes
- **⬆️** Jump
- 🎯 *"Collect green. Dodge red. 3 hits = game over."*

Auto-advances after 3 seconds OR on tap. **Do not over-explain the four bad types here** — the player will learn them by getting hit. The end-of-run breakdown teaches the taxonomy properly.

### Screen 4 — Countdown
"3 ... 2 ... 1 ... GO" — full-screen, dramatic.

### Screen 5 — The run (60 seconds OR 3 hits)

**Layout:**
- 3-lane track receding into perspective (Subway Surfers style)
- Character in center lane at start
- HUD top-left: **Time remaining** (60 → 0)
- HUD top-right: **Score** (counts up live)
- HUD top-center: **Hits** (♥ ♥ ♥ — turns gray as hits accumulate)

**Controls:**
- Left/Right arrow keys (or touch swipe / on-screen arrows) — switch lanes
- Up arrow / spacebar — jump (~600ms hang time)
- *Down/duck is intentionally omitted to keep controls minimal*

**Spawn pacing:**
- **0–20s (easy):** ~1 object per second, mostly trusted, 1-2 bad types in rotation (predatory + paywalled)
- **20–40s (medium):** ~1.5 objects per second, all 4 bad types in rotation, occasional 2-lane spawns
- **40–60s (fast):** ~2 objects per second, including airborne objects requiring jumps, multi-lane spawns

**Game ends when:**
- Timer reaches 0, OR
- Player has hit 3 bad citations

When a run ends early, freeze-frame the character mid-collision for ~800ms before transitioning to results. The pause is the emotional beat.

### Screen 6 — Results
Two-column layout (same pattern as Citation Challenge's results screen — keep CTA above the fold):

**Left column (~60%):**
- "YOUR SCORE: [number]"
- "Survived: 47 seconds" *(or "60 seconds — full run!")*
- "Trusted citations collected: 18"
- "Bad citations dodged: 12"
- "Bad citations hit: 3"
- **Citation breakdown card:** four small panels, one per bad type, showing how many of each the player encountered and what they are
  - 💀 **Predatory journals** — *"Pay-to-publish outlets with little or no peer review"*
  - ⚠️ **Unreviewed preprints** — *"Early drafts shared before peer review — worth verifying"*
  - 🔒 **Paywalled sources** — *"Behind a paywall and not in your library's collection"*
  - 👻 **Hallucinated citations** — *"AI invented these — they don't exist"*

**Right column (~40%) — full-height purple panel:**
- Headline: **"Now see how Nexus catches them all"**
- Body: *"Nexus dodges every one of these — automatically, in seconds, every time."*
- Button: **"Watch it work →"**

### Screen 7 — Nexus Extend demo
**Same screen as Citation Challenge's Nexus reveal/demo.** Reuse the existing component. Framing line at top: **"See how Nexus dodges bad citations for you."**

The demo plays through the same guided steps as Citation Challenge (chat + sidebar reveal, full-text access, alternatives, library services). No new assets needed.

### Screen 8 — Leaderboard
- Top 10 scores from Citation Rush (separate leaderboard from Citation Challenge)
- Highlight the player's row if they made it
- "Score: [N] · [Institution]"
- Button: **"Play again"** — back to Screen 2 (skip intake if same session within 5 minutes)
- Button: **"Done"** — back to Screen 1 (attract mode)

### Screen 9 — Idle / reset
After 30 seconds of inactivity at any non-gameplay screen, return to Screen 1.

---

## 5. The six object types

### Visual design principles
- Each object is a **citation card** (~120×80px on screen) styled as a small academic citation pill
- One **dominant color** per type — recognizable from 6 feet away
- One **icon** per type — recognizable from 3 feet away
- One **short label** (1-2 words) — recognizable on close inspection
- The card text shows a fake citation (author + year + journal) but the **color/icon is what the player reads at speed**

### Object catalog

| Type | Color | Icon | Label | Score (collect) | Score (dodge) | Score (hit) | Sample text |
|---|---|---|---|---|---|---|---|
| ✅ **Trusted** | Green/gold | WoS checkmark | "VERIFIED" | **+100** | — | — | "Chen et al., 2024 — *Nature*" |
| ⚠️ **Preprint** | Yellow | Document w/ clock | "PREPRINT" | — | +10 | −50 | "Smith, 2025 — *arXiv*" |
| 🔒 **Paywalled** | Orange | Lock | "PAYWALL" | — | +15 | −50 | "Tanaka, 2023 — *Elsevier*" |
| 💀 **Predatory** | Dark red | Warning triangle | "PREDATORY" | — | +25 | −100 | "Kumar, 2024 — *Int'l J. Adv. Studies*" |
| 👻 **Hallucinated** | Purple/glitchy | Ghost / pixelated | "NOT FOUND" | — | +25 | −100 | "Garcia, 2031 — *Journal of [glitch]*" |
| 🚫 **Retracted** | Dark slate + red strike | Circle-with-slash | "RETRACTED" | — | +20 | −75 | "Anderson, 2019 — *withdrawn, J. Cell Biology*" |

**Why the differentiated scoring matters:** A librarian watching someone play sees "+25 predatory dodge vs +10 preprint dodge" and intuits the risk hierarchy without anyone explaining it. That's the educational payload of differentiated scoring — it works through the audience around the player, not just the player.

### Spawn ratio
Roughly: 50% trusted (collect), 50% bad (dodge). Within the bad pool (weights, normalized at runtime):
- 30% preprint
- 30% paywalled
- 20% predatory
- 20% hallucinated
- 15% retracted (rarest — added in a post-launch polish pass)

Tune this in playtesting.

---

## 6. Scoring formula

```
Final score =
    (trusted_collected × 100)
  + (preprints_dodged × 10)
  + (paywalled_dodged × 15)
  + (predatory_dodged × 25)
  + (hallucinated_dodged × 25)
  + (retracted_dodged × 20)
  − (preprint_hits × 50)
  − (paywalled_hits × 50)
  − (predatory_hits × 100)
  − (hallucinated_hits × 100)
  − (retracted_hits × 75)
  + (full_60s_bonus × 200)
```

Full 60s bonus only applies if the player survives without 3-hit failure. That keeps the leaderboard top spots dominated by full runs, not lucky early failures.

---

## 7. Visual and audio design

### Visual
- **Track style:** Stylized academic-themed — think a library hallway or a paper-strewn corridor, not subway tracks. Floors could resemble open book pages or scholarly grid paper. Subtle, not kitsch.
- **Character:** A generic student avatar (running animation) — gender-neutral, simple, fast to animate. **No real-person likenesses.** Could be a stylized "researcher" with a backpack.
- **Citations float in 3D space** at the player's eye level — collectibles glow gently, bad ones have a subtle red/yellow pulse.
- **Hit feedback:** Brief red flash on the screen edge + screen shake (~150ms) + a "♥" goes gray in the HUD.
- **Collect feedback:** Brief gold particle burst + score number popup ("+100") that floats up and fades.

### Audio
- **Music:** Light, propulsive, looping background track — royalty-free arcade-style.
- **SFX:** Coin chime on collect, dull thud on hit, whoosh on jump, drum hit on each hit countdown (3→2→1).
- **Important:** All audio must be **mutable** via an admin setting. The booth may need to run silent depending on neighbor exhibitors.

### Branding
- Restrained Clarivate / Nexus Extend brand presence — same as Citation Challenge.
- Bottom-right corner small logo on the gameplay screen.
- Larger logo on welcome / results screens.

---

## 8. Technical architecture

### Stack
Match Citation Challenge:
- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Game engine:** **Three.js** for the 3D lane perspective + collision detection. Alternative: pure CSS/Canvas if Three.js feels heavy — but the 3D depth effect is core to the Subway Surfers feel, so Three.js is recommended.
- **Storage:** Behind a single `src/storage.ts` interface. The shipped backend is `localStorage` (key: `citation-rush:runs`) on both Vercel and the kiosk. On the booth this runs inside an isolated Chrome `--user-data-dir` profile at `%LOCALAPPDATA%\citation-rush-kiosk-profile`, so the leaderboard survives reboots as long as that profile folder is left alone. Booth staff must not clear Chrome browsing data during the show. A `better-sqlite3` backend at `./data/citation-rush.db` was specified in earlier drafts but deferred: `better-sqlite3` is a Node-native module and needs an Electron host (or co-located Node server) to run, which we chose not to add before ALA 2026. The `StorageBackend` interface in `src/storage/types.ts` is shaped to make that swap a one-file change later.
- **Deployment:** Chrome `--kiosk` mode pointing at `http://127.0.0.1:4173` (the built `dist/` served by `npm run preview`) for the booth kiosk. Vercel for shareable previews. Launch scripts and the day-of test checklist live in `kiosk/`.
- **No network required at kiosk runtime**

### Performance targets
- Steady 60fps on the booth kiosk hardware
- Object pooling for citation cards (don't allocate/destroy each spawn)
- Pre-load all assets at app start; no runtime fetches

### Data model
```
Run {
  id, name, institution, email, opted_in,
  started_at, ended_at,
  score, survived_seconds, ended_by ("time" | "hits"),
  trusted_collected, preprint_dodged, preprint_hit,
  paywalled_dodged, paywalled_hit,
  predatory_dodged, predatory_hit,
  hallucinated_dodged, hallucinated_hit
}
```

### Admin panel (kiosk-only, password-gated)
- View leaderboard
- Export all runs as CSV
- Export email opt-ins as CSV (separate, for marketing handoff)
- Reset leaderboard (with confirmation)
- Toggle audio on/off
- View counts: total runs today, average score, completion rate

---

## 9. Throughput targets

Citation Challenge target was ~90 seconds end-to-end per visitor. Citation Rush should target **~75 seconds**:

- 10s intake
- 3s tutorial
- 3s countdown
- 30-60s gameplay (early fails are common)
- 15s results + Nexus reveal CTA
- *Demo viewing time varies — visitor can leave whenever*

The early-fail design actually *helps* booth throughput compared to Citation Challenge.

---

## 10. Build phases

**Phase 1 — Core gameplay (3-4 days)**
1. Three.js 3-lane scene with character and basic controls
2. Object spawning + collision detection
3. Score and HUD
4. Timer and 3-hit fail
5. Five object types with placeholder visuals

**Stop and playtest after Phase 1. Do not proceed to Phase 2 without confirmation.**

**Phase 2 — Flow + polish (2 days)**
6. Welcome / intake / tutorial / countdown screens
7. Results screen with breakdown
8. Object visual design (real cards, not placeholders)
9. Hit/collect feedback (particles, screen shake, audio)
10. Difficulty pacing tuning

**Phase 3 — Persistence + admin (1 day)**
11. Storage module (dual-mode SQLite / localStorage)
12. Leaderboard persistence
13. Admin panel
14. CSV export

**Phase 4 — Demo integration (0.5 day)**
15. Import Citation Challenge's Nexus Extend demo component
16. Wire results → demo transition with new framing line
17. Idle reset

**Phase 5 — Hardening (1 day)**
18. Kiosk mode setup
19. Audio mute toggle
20. End-to-end testing on actual kiosk hardware
21. Edge cases: tab away, idle mid-game, rapid restart

**Total: ~7-8 working days.**

---

## 11. Open questions for the build

1. **Character design** — stock asset, simple SVG sprite, or a small custom illustration? Stock is fastest; custom signals more polish. Recommend stock with light recolor.
2. **Music licensing** — confirm whatever track is used is cleared for commercial booth use, not just personal projects.
3. **Touch vs keyboard** — kiosk is touchscreen presumably? If so, swipe gestures + on-screen jump button are the primary input; arrow keys are fallback for a USB keyboard hidden under the table.
4. **Leaderboard reset** — does the leaderboard reset each conference day, or run for the full ALA show? Recommendation: reset daily, with previous day's top 5 archived for analysis.
5. **Cross-game leaderboard** — confirmed *no* combined leaderboard with Citation Challenge, but worth keeping the same name+institution intake field shapes so a CSV merge is possible later.

---

## 12. What this spec does *not* cover (defer to build)

- Final object card visual design (designer or Claude Code's judgment in build)
- Exact character animation frames
- Specific music track selection
- Welcome screen background animation specifics
- Color palette specifics — inherit from Citation Challenge / Nexus brand

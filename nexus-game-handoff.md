# Nexus Booth Game — Project Learnings & Handoff

This document captures everything learned from building the first Nexus Extend booth demo ("Spot the Issues" / Citation Challenge) for ALA 2026. Use it as context when designing a second/alternative game concept.

---

## 1. The strategic context

### What Nexus Extend is

Nexus Extend is Clarivate's browser extension that brings library content and services into AI tools. Core capabilities:

- **Source verification** — checks AI-generated citations against trusted academic indexes (Web of Science, Primo/Summon Central Discovery Index, ProQuest)
- **Full-text access** — provides one-click access to library-licensed and open-access papers
- **Recommendations** — suggests verified scholarly alternatives when AI cites unreliable sources
- **Library visibility** — surfaces library services (research guides, hours, librarian chat) inside AI tools
- **Library-branded** — each library configures Nexus to reflect their identity

The product is "always-on" in real life — it scans pages automatically, not on user demand.

### The audience: ALA 2026 attendees

Primarily academic librarians. They are:

- Professionally trained skeptics of source quality
- Concerned about AI's impact on student research integrity
- Skeptical of marketing fluff; respond to credible, nuanced messaging
- Time-pressed at conferences (won't read long copy)
- Networking and walking in groups (so things that draw multiple people work well)

### The strategic message Nexus needs to land

In one line: **"AI is becoming the starting point for academic work, and Nexus is what makes that work trustworthy."**

The demo should make a librarian leave thinking:
1. AI citations are unreliable in ways even experts can miss
2. Nexus solves this in seconds, automatically
3. Nexus makes the library visible inside AI tools (not just a separate destination)

### Booth goals (from the original brief)

1. Attract people to the booth
2. Get them to experience Nexus hands-on, not theoretically
3. Leave with the impression that Nexus is simple to use and a strategic answer to the AI problem

---

## 2. Design preferences and decisions

### Tone and voice

- **Professional but playful.** Not a carnival game, not a workshop. Aim for "intellectual challenge."
- **Accurate over punchy.** Avoid oversimplifications that librarians will spot. "Bad citations" is fine for the entry hook, but inside the experience use "questionable" or "suspicious" — preprints aren't *bad*, they're worth verifying.
- **Restrained branding.** Clarivate brand presence should feel premium. Avoid heavy logo placement on every screen.
- **Librarians are smart.** Don't talk down. Don't over-explain.

### Visual language

- **Color palette:** Clarivate red (#C8102E-ish) for brand/primary CTAs in Nexus context. Purple (#7C3AED-ish) for game/booth-specific CTAs to differentiate from product UI. Dark charcoal/near-black for headlines. Light gray backgrounds with subtle gradients.
- **Typography:** Clean sans-serif throughout. Large bold headlines. Generous line-height on body copy.
- **Layout:** Plenty of whitespace. Avoid information density. One main thing per screen.
- **Animations:** Subtle, kiosk-grade. Smooth transitions, no flashy effects. The reveal moment can be more theatrical (status icons animating onto pills).
- **No emojis in chrome/UI labels** — only in info rows where they aid scanning (⏱ 60 seconds / 📄 5 citations / 🏆 leaderboard). Status icons on Nexus citations are real iconography, not emojis.

### Copy principles learned the hard way

- **Headlines must fit on one line.** Always. Use `clamp()` for responsive font sizing.
- **Question marks matter** in CTA buttons. They turn statements into invitations.
- **Em dashes** (—) not hyphens (-) in subheads and body copy.
- **Quotation marks around statements** ("AI can make mistakes.") let the headline imply a premise being tested rather than a Clarivate assertion.
- **Logical flow** from headline → subhead → CTA. Each does one job:
  - Headline: states the problem
  - Subhead: states the solution (Nexus does X)
  - CTA: invites the visitor's role

### Specific copy decisions that worked

- Welcome headline: **"AI can make mistakes."** (with quotes and period inside)
- Welcome subhead: **"Nexus Extend verifies every citation against trusted academic sources."**
- Welcome CTA: **"Can you spot the bad citations? →"**
- Use **"AI Chatbot"** (not "AI Research Assistant" — clashes with Clarivate's product line) when representing generic consumer AI in the demo.
- **Nuance vocabulary inside the experience:** "questionable," "suspicious," "needs verification" — not "bad" or "fake."

### Specific copy decisions that *didn't* work and why

- "Spot the issues" / "Beat the AI" — too generic, didn't name what Nexus does
- "Your challenge" with redundant question repetition on Screen 4 — too much text, slowed visitor down
- Listing sample research questions on the discipline tiles — visual noise during selection
- Calling preprints "bad" — librarians know preprints are legitimate signals; oversimplification damages credibility

---

## 3. Game design lessons

### What worked

**60-second timer with a real challenge.** Creates urgency, throughput, and a measurable benchmark Nexus beats.

**Multi-tier issue types** (predatory, preprint, paywalled, hallucinated, plus verified). Genuinely hard. Teaches the taxonomy. Lets Nexus shine across all five.

**Discipline selection.** Lets visitor pick a familiar field. Makes the game feel personal. Six disciplines covered: Life Sciences, Psychology, Humanities, Business/Economics, Law/Policy, Environmental Science.

**Single-flag mechanic.** Tap to flag suspicious. Don't make visitors categorize during play — too slow.

**Explicit category labels on the results screen.** The taxonomy (Verified / Predatory / Preprint / Inaccessible / Unverified) is taught *between* the player's attempt and Nexus's reveal. Same labels reappear on Nexus side, making the connection concrete.

**Scoring formula:** `(correct_flags × 100) − (false_flags × 50) − max(0, seconds_elapsed − 20)`. Penalizing false flags prevents flag-everything gaming and reinforces the "be discerning, not just suspicious" message.

**Leaderboard with name + institution + email opt-in.** Captures leads, drives competition. Email field optional; opt-in checkbox unticked by default.

**"Nexus reveal" as the emotional payoff.** Player sees their score, then watches Nexus do the same thing in 2 seconds. The asymmetry is the whole point of the demo.

### What we considered and rejected

- **Showing Nexus + raw chat side-by-side** (split screen). Lower friction but less memorable than the game.
- **"Save the student" narrative framing.** More emotional, but harder to produce.
- **Categorizing flags during play.** Too slow for a 60-sec game. Reserve categorization for the results screen as education, not gameplay.
- **Reading visitor's own research question** (typing into the demo). Too unpredictable for a booth.
- **Multi-station leaderboards.** Single station is simpler and our actual booth setup.

### Throughput math

- Target: 2.5 minutes per visitor → ~24 visitors/hour at one station
- 4-day conference, ~6 active hours/day → ~570 plays max
- Plan reset cadences accordingly: leaderboard runs full conference; data resets nightly via admin

### Booth context constraints

- **One station** at the Clarivate booth (not multi-station)
- **Offline-first.** Conference Wi-Fi is unreliable. App must run completely standalone.
- **Touchscreen kiosk**, 1920×1080 target, also tested at 1366×768
- **Auto-launch in fullscreen kiosk mode** on boot
- **No exit shortcuts available to visitors.** Emergency exit only via Ctrl+Shift+Q
- **Hidden admin panel** (5-tap on logo) for data reset, CSV export, stats overview

---

## 4. Technical architecture

### Stack that worked

- **React + Vite** for the frontend (fast, simple)
- **Tailwind CSS** for styling
- **SQLite via better-sqlite3** for local persistence (sessions, leaderboard, email opt-ins)
- **Electron** to package as a standalone Windows desktop app for the kiosk
- **GitHub** for version control
- **Vercel** for development previews (NOT the production deployment — that's the Electron app)
- **Claude Code** (desktop app) for development, with the user as a non-developer

### Workflow that worked for non-developer building this

- All work happens via Claude Code prompts
- Code lives on local laptop, pushed to GitHub
- Vercel auto-deploys from GitHub for stakeholder previews
- Final deployment is a Windows installer, NOT the Vercel URL
- Tight, scoped prompts work better than broad ones ("Build Phase 1 only, stop after, show me what you have")

### Phasing that worked

- **Phase 1:** Welcome, Institution Select, Discipline Select (no persistence, no scenarios)
- **Phase 2:** Scenario Intro, Challenge, Results — with one fully-wired scenario (Psychology) and others stubbed
- **Phase 3:** Persistence (SQLite), admin panel, CSV export
- **Phase 4:** Kiosk hardening (Electron, auto-launch, exit prevention)
- Each phase pushed and reviewed before moving on. Critical for non-developer workflow.

### Key files for handoff to new project

- `SPEC.md` — the full build spec (all design and visual decisions documented)
- `/docs/psychology-scenario.md` — worked example for scenario data structure
- `/references/*.png` — Nexus product UI reference screens (extracted from Figma)
- `scenarios.json` — data structure for the 6 disciplines

---

## 5. Content lessons

### The single biggest open item: SME-vetted citation content

The scenario citations (5 per discipline × 6 disciplines = 30 citations total) are the most important content in the demo. They must be:

- **Realistic.** Plausible-looking author names, journal titles, formatting that matches typical AI output.
- **Discoverable as fakes/questionables on careful inspection** — but not so obviously wrong that anyone catches them in 5 seconds.
- **Real where claimed real.** The "verified" citations should be genuine, peer-reviewed, accessible papers. Don't fabricate these.
- **Real where claimed predatory.** Use actual examples from credible watchlists (Cabells, etc.). Avoid borderline cases that risk defamation.
- **Real where claimed preprint.** Pull from PsyArXiv, arXiv, SSRN — verify the paper exists and hasn't been published in a peer-reviewed venue.
- **Genuinely fabricated where claimed hallucinated.** Search Web of Science before finalizing to ensure no accidental match with a real paper.

This requires a content/SME pass. It's the single biggest gap in the prototype.

### Scenario structure that worked

Each scenario includes:
1. A research question the AI is "answering"
2. A ~150-word AI response with 5 inline citations
3. The 5 citations with one of each: verified, predatory, preprint, inaccessible, unverified/hallucinated
4. 2-3 verified alternatives Nexus surfaces for the flagged ones
5. Library services callout (subject specialist, research guide, hours)

---

## 6. Open questions / things to revisit

### Things still unresolved at end of project

- **Real Nexus product UI may evolve.** The Figma references can become stale. Always check whether the latest production behavior matches the spec.
- **"Always-on Nexus" vs. "scan-and-reveal."** The real product is always-on; the booth uses scan-and-reveal for theatrical effect. This is a deliberate divergence and should be flagged in any new game concept.
- **The "Find Verified Alternative" button** was in earlier mockups but removed in the new design. The booth currently auto-transitions to the alternatives panel after the unverified popup closes. New game might revisit this UX.
- **Predatory journal naming.** Always a defamation risk. Consider using fictional-but-clearly-fictional journal names with admin notes if real examples are problematic.
- **Branding alignment.** Clarivate brand team may have specific font/color tokens that should be applied in a final pass.

---

## 7. Strategic recommendations for a second/alternative game

### What a second game should preserve

1. The fundamental "human attempts vs. Nexus does it instantly" asymmetry. This is the strongest demonstration of value.
2. The taxonomy of citation issues (verified / predatory / preprint / inaccessible / unverified). This educates while entertaining.
3. The leaderboard + email capture. This is the lead-gen mechanism.
4. The library-branded experience. White-labeling with the visitor's institution is unique-to-Nexus and worth showing.
5. The mock chat interface as the canvas. Librarians need to *see* Nexus in the AI environment, not in a sidebar by itself.

### What a second game might do differently

- **Different game mechanic.** The current game is "spot suspicious citations." Alternatives: rebuild a research question from sources, reconstruct a flawed AI summary, identify which paper would actually answer a question, race against Nexus to find a verified alternative, etc.
- **Different format.** Currently single-player at a kiosk. Could be: head-to-head against another librarian, team play, mobile pre-conference engagement, etc.
- **Different reveal.** Currently "Nexus does it in 2 seconds." Could lean harder into the entitlement-aware feature (which competitors can't replicate) or library-branded experience.
- **Different emotional arc.** Currently challenge → reveal. Could be: collaboration → discovery, exploration → realization, etc.

### What a second game should NOT do

- Be condescending to librarians (e.g., "see how dumb AI is")
- Oversimplify the issue (e.g., "all preprints are bad")
- Require typing (slow, varies by visitor literacy)
- Take more than 3 minutes per visitor (throughput dies)
- Depend on Wi-Fi (offline-first or it doesn't work)
- Require multiple stations (booth has one)
- Use "AI Research Assistant" terminology (clashes with Clarivate product line)

---

## 8. Prompts and patterns that worked with Claude Code

### General principles

- Always reference SPEC.md by section
- State explicit acceptance criteria
- Specify what NOT to build, not just what to build
- Ask for one phase at a time, then stop
- Ask Claude Code to "commit and push when done" so changes flow to Vercel automatically

### Useful prompt structure

```
Update [specific element on specific screen]:

1. [Change A] — [exact new wording or behavior]
2. [Change B] — [exact new wording or behavior]
3. [Change C] — [exact new wording or behavior]

Keep [these things] unchanged.

[Constraints — e.g., "must work at 1920×1080 and 1366×768"]

Commit and push when done.
```

### Things to avoid

- Open-ended prompts ("make it look better")
- Multiple unrelated changes in one prompt without numbering
- Asking for visual changes without acceptance criteria
- Forgetting to say "commit and push" — changes don't reach Vercel without it

---

## 9. Final thoughts

The first booth game ("Spot the Issues") is a credible, working demo. It's not perfect — the citation content needs SME validation, and small UX details still need polish. But the structure works.

A second game should treat this one as a baseline to differentiate against, not improve on. They serve different purposes:

- The first game leads with **skepticism of AI** as the hook ("AI can make mistakes")
- A second game might lead with **opportunity** ("Make the library central to AI research") or **professional pride** ("Help your students cite right") or **competitive hook** ("Beat the AI at its own game")

Different hooks attract different visitors. Both can coexist; both can teach the same Nexus value prop. The point is to give the booth a second mode of engagement so visitors with different mental models can find their way in.

Good luck with round two.

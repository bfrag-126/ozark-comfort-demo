# Ozark Comfort — Operations Dashboard

Milestone 2 of [[Second Shift Project 1]] — a real web page reading live from Supabase, not a script or a terminal.

## What's in here

- **`index.html`** — the whole app: fonts, CSS, the CDN script tags (React 18, Babel Standalone, Supabase JS), and the React app itself, all inlined into one file. No build step, no npm install, no local server — double-click it and it just runs.
- **`app-entry.jsx`** — kept as a readable reference copy of the same app code (easier to read/edit than digging through the inlined version in `index.html`). Not loaded by the page directly.

**Fix note (Aug 31, 2026):** originally `index.html` loaded `app-entry.jsx` via `<script src="./app-entry.jsx">`, which requires the browser to fetch a second local file — Chrome blocks that fetch when a page is opened directly from disk (`file://`), so the page loaded blank. Fixed by inlining the app code directly into `index.html`. If `app-entry.jsx` is edited going forward, re-inline it into `index.html` (or reintroduce a local dev server) rather than pointing `index.html` back at the external file.

## What it shows

- **Schedule by Technician** — every `scheduled` job, grouped by date then by technician (Marcus Whedbee, Jared Combs, Tyler Rourke).
- **Open Quotes — Needs Follow-Up** — every `quoted` job with how long it's been sitting unanswered, oldest first. This is the direct answer to Ozark Comfort's real pain point: quotes that go out and just die with no follow-up.
- A small stat bar: active customers, scheduled jobs, open quotes.

## Status

Live data, real page — Milestone 2. No write/agent layer yet (Milestone 3) and not deployed anywhere with a real URL yet (Milestone 4). Opening `index.html` directly in a browser is enough to see it working today.

## Note on staleness

The seed data's dates were set relative to Aug 27, 2026 (when Milestone 1 was built). If this is opened much later without re-seeding, "Schedule by Technician" may show fewer or no entries near "Today" since the originally-scheduled dates will have passed — the page itself doesn't go stale, but the demo data will need a quick re-seed (see the Milestone 1 SQL in the Aug 27 daily note) before showing it to a prospect.

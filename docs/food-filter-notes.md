# Food & Health Fit — page notes

`public/food.html` — a standalone filter page for matching destinations by food
culture and allergen risk.

## What it does

Two filter sets, combined:

- **Food culture** (9 tags): Mediterranean, Farm-to-Table, Seafood-Forward,
  Plant-Forward, Strict Allergen Labeling, Low Processed-Food, Dairy-Heavy,
  Nut-Heavy Cuisine, High Processed-Food
- **Allergens to flag** (6): shellfish, tree nuts, peanuts, dairy, gluten, eggs

Destinations are **matched, not ranked on a single score**. That's deliberate:
a seafood-forward country is a strong heart-health fit and a poor shellfish-allergy
fit at the same time, and one blended number would hide that tension instead of
surfacing it.

Flagging an allergen does not remove destinations. It marks the ones where that
allergen is common in everyday cooking, and breaks ranking ties toward the safer
option. Accommodations exist everywhere; the flag is a research prompt, not a veto.

## Technical notes

- Plain HTML/CSS/JS, no build step, no framework dependency. Does **not** use the
  DC Logic framework the other pages use — written standalone so it can't break from
  a framework-API mismatch. Convert it later if consistency matters more than isolation.
- Filter selections persist to `localStorage` under `kolmari:foodfilter`, following
  the same pattern as `kolmari:quiz` and `kolmari:access`.
- Microsoft Clarity snippet included (project `xwsd371zfp`), matching the other pages.
- Country data is a `COUNTRIES` array inline in the page script. Add a destination by
  appending an object with the same shape — no other file needs touching.
- Not linked in the sidebar. Nav wiring lives in `app.html`.

## Review cadence — the important part

Everything on this page carries a `last reviewed` date for a reason.

**Labeling laws change.** Japan expanded its mandatory allergen list in April 2026
(cashew added, bringing it to 9 items — while soy and sesame remain *recommended
only*, which is a real gap given soy sauce and miso are staples). Any country's
regime can shift the same way. Re-verify against the official source before trusting
a summary that's more than a few months old.

**Confidence is uneven across countries.** The EU entries (Portugal, Spain, Greece,
Estonia, Croatia) and Japan rest on well-documented, verifiable regimes. Costa Rica,
Colombia, Ghana, Mauritius, and the UAE are lower-confidence — the labeling text there
describes the general regulatory picture rather than a verified statute-level citation.
Treat those as starting points for research, not as settled facts.

**The tags are editorial.** Food-culture archetypes, allergen prevalence, and the
heart-health notes are Kolmari's own assessment of everyday dietary patterns. They are
not certified medical or regulatory data, and the page says so on every card and in the
footer. Keep that disclosure in place if the content is ever reworked — it's the same
trust discipline already applied to the cost baselines and visa data.

## Deploy

Push via GitHub only. Do not use Cloudflare's "New deployment" button — it pins a
manual version that overrides git-based deploys. Verify in the Deployments tab after
pushing.

# Food & Health Fit Filter — editorial notes

`public/food.html` — a filter page that matches destinations by food culture and allergen
risk. Linked from the Command Center sidebar.

## What it does
Two filter sets, combined:
- **Food culture** (9 archetype tags): `mediterranean`, `farm-to-table`, `seafood-forward`,
  `plant-forward`, `strict-allergen-labeling`, `low-processed-food`, `dairy-heavy`,
  `nut-heavy`, `high-processed-food`.
- **Allergens to flag** (6): `shellfish`, `treeNuts`, `peanuts`, `dairy`, `gluten`, `eggs`,
  each with everyday-cuisine prevalence `common` / `occasional` / `rare`.

Destinations are **matched, not reduced to a single score.** That's deliberate: a
seafood-forward country is a strong heart-health fit and a poor shellfish-allergy fit at the
same time, and one blended number would hide that tension instead of surfacing it.

Flagging an allergen **does not remove** destinations. It marks the ones where that allergen
is common in everyday cooking and breaks ranking ties toward the safer option. Accommodations
exist everywhere; the flag is a research prompt, not a veto.

**Sort:** archetype match count (desc) → fewer flagged-allergen hits, weighting
`common` (2) > `occasional` (1) > `rare` (0) → alphabetical.

## Technical notes
- **DC Logic** page (`sc-if` / `sc-for`, `class Component extends DCLogic`), matching the
  other pages and `command-center.html`. (The original handoff draft was standalone vanilla
  JS, chosen only because the DC framework internals weren't visible then; that constraint is
  gone, so this is built in DC Logic for consistency.)
- Filter selections persist to `localStorage` under `kolmari:foodfilter`
  (`{archetypes:[], allergens:[]}`), following the `kolmari:quiz` / `kolmari:access` pattern.
- Microsoft Clarity snippet included (project `xwsd371zfp`), matching the other pages.
- Country data is a `COUNTRIES` array inline in the page script. Add a destination by
  appending an object with the same shape — no other file needs touching.
- Linked from the Command Center sidebar. Wiring it into `app.html`'s own sidebar needs a safe
  seam into that generated bundle (a follow-on).

## Per-country fields
`archetypes[]`, `allergenPrevalence{}`, `labelingLaw{text, sourceUrl?}`, `cardioNote`,
`assessmentType: "kolmari-editorial"`, `lastReviewed`, `confidence` (`high|moderate|low`).

## Review cadence — the important part
Everything on this page carries a `lastReviewed` date for a reason.

**Labeling laws change.** Japan expanded its mandatory allergen list in April 2026 (cashew
added, bringing it to 9 items — while soy and sesame remain *recommended only*, a real gap
given soy sauce and miso are staples). Any country's regime can shift the same way. Re-verify
against the official source before trusting a summary more than a few months old. Re-check at
least yearly, and update `lastReviewed` on any card whose content changes.

**Confidence is uneven across countries** (shown as a badge on every card):
- **High** — EU entries (Portugal, Spain, Greece, Estonia, Croatia, Netherlands) rest on
  EU Reg 1169/2011 (14 declarable allergens); Japan on the April 2026 update.
- **Moderate** — South Korea (MFDS), Mexico (NOM-051), Malaysia, Thailand, UAE (Gulf/GSO):
  general regulatory picture, not statute-level verified.
- **Low** — Costa Rica, Colombia, Ghana, Mauritius: general picture only. Treat as starting
  points for research, not settled facts. **Verify before any relocation decision that hinges
  on a severe allergy** (e.g. the kids' allergies).

**The tags are editorial.** Food-culture archetypes, allergen prevalence, and heart-health
notes are Kolmari's own assessment of everyday dietary patterns — not certified medical or
regulatory data, and the page says so on every card. Keep that disclosure in place if the
content is reworked — the same trust discipline already applied to cost baselines and visa
data.

## Countries covered (16)
Portugal, Spain, Greece, Estonia, Croatia, Japan, Netherlands, South Korea, Mexico,
Costa Rica, Colombia, Malaysia, Thailand, Ghana, Mauritius, UAE.

## Deploy
Push via GitHub only. Do **not** use Cloudflare's "New deployment" button — it pins a manual
version that overrides git-based deploys. Verify in the Deployments tab after pushing.

## Not yet built (follow-ons)
- Prefill filters from the onboarding quiz answers.
- Surface a tracked destination's food/health tags inside the Command Center (match
  destination name → `COUNTRIES`); optional 6th "health" checklist category.
- Discoverability from `app.html`'s own sidebar.

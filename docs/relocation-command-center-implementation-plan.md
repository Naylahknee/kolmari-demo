# Relocation Command Center — Implementation Plan

_Plan derived from a review of the **actual current build** (repo `Naylahknee/kolmari-demo`,
Worker `steep-limit-80e2`, D1 `kolmari-data`) against the feature spec._

---

## 0. TL;DR / Recommendation

Build the Command Center as a **new, same-origin, D1-backed dc-runtime page**
(`public/command-center.html`) that becomes the **post-login landing dashboard**, served
by **upgrading `steep-limit-80e2` from a static-assets-only Worker to a Worker + Assets
deployment** with a `fetch` handler for `/api/cc/*` and a D1 binding to `kolmari-data`.

- **Do not** hand-edit `public/app.html` to host the module. It is a 2.4 MB generated
  bundle with all logic minified onto a single line, and its pre-build source is not in
  this repo — editing it by hand is high-risk and unmaintainable.
- **Reuse the proven backend pattern** already running in the account: the
  `kolmari-collect` Worker (D1 `env.DB`, prepared statements, JSON API). We mirror it,
  same-origin, on the site Worker itself.
- **The Command Center partially exists today** as static demo prose (household context,
  Portugal/Mexico/Ghana comparisons, a single-plan "protocol checklist"). This feature
  turns that static, per-device, localStorage-only prototype into a **persistent,
  user-editable, multi-destination board**.

---

## 1. Current build reality (correcting the spec's assumptions)

The spec's header contains stale assumptions. Verified facts:

| Spec says | Reality (verified) |
|---|---|
| D1 `kolmari-data` "provisioned, empty" | DB `5369f592-7da8-47a2-95b9-668e18c8ed2a` already holds a live **`records`** analytics table + 3 indexes with **2,605 rows** (written by the `kolmari-collect` Worker). It is **not** empty — new tables slot in alongside; **do not** reset/drop it. |
| Target `steep-limit-80e2` is where the feature lands | Correct — but that Worker is **static-assets-only**. `wrangler.jsonc` declares only `assets.directory`; there is **no `main`, no `fetch` handler, no D1/KV binding**. Persistence must be added. |
| (implied) blank-slate build | The concept **partially exists** in `app.html`: household context, multi-destination content (Portugal/Mexico/Ghana), and a single-plan "protocol checklist" with `journey / checklist / timeline / documents` views — all static demo data in `localStorage`. |

**Framework:** The site uses a custom in-house **`dc-runtime`** (TypeScript → bun-built to
`public/support.js`), a React-based component framework. Pages are authored as `<x-dc>`
templates with `{{ }}` bindings, `<sc-if>`, and a `class Component extends DCLogic` script
block. React/ReactDOM load from `unpkg` CDN (hard outbound dependency). The lightweight
pages (`index`, `quiz`, `explore`, `sign-in`, `access`) `<script src="./support.js">` in
**readable** form — this is the pattern our new page follows.

**`app.html`:** A self-contained React SPA that **inlines** dc-runtime (does not load
support.js). Nav is React `page` state (no URL routing): `dashboard, world, plan, cost,
documents, pathways, greenbook, community, country, profile, settings`. All logic is on one
minified line; ~0.7 MB of the 2.4 MB is inline base64 images. **Its source is not in the
repo** — only the built bundle is. This is why we do not inject into it.

**Auth / identity — none exists:**
- `access.html` is the **real gate**: access code `KOLMARI2026` → `localStorage['kolmari:access']='1'` → redirect to `app.html`.
- `sign-in.html` (email/password `demo@kolmari.com` / `kolmari2026`) is **orphaned** — nothing links to it — and only does a client-side redirect.
- `app.html` **does not even check** `kolmari:access`; the gate is cosmetic.
- There is **no durable user identity** — no token, no session cookie, no stored user id. `kolmari:sid` is an ephemeral per-session telemetry id. **A persistent feature has no user key to hang data on** until we add one.

**Persistence today:** `localStorage` only (per-browser), keys prefixed `kolmari:`
(`matched-countries`, `quiz`, `events`, `feedback`, `waitlist`, UI state). The only server
contact is fire-and-forget telemetry `POST` to the external `kolmari-collect...workers.dev`.
No `/api` routes, no read-back of user data. **CSP `connect-src` is `'self'`** — so
same-origin `/api/cc/*` fetches need **no CSP change**.

**Existing backend blueprint — `kolmari-collect` Worker** (separate deploy, same account,
bound to the same `kolmari-data` DB): `env.DB` D1 binding, a `json()` helper, CORS,
batched prepared-statement inserts, `EXPORT_KEY`-gated read endpoints, Kit integration. We
copy this shape for the Command Center API.

---

## 2. Gap analysis (spec §5 requirements vs build)

| Requirement | Exists? | Work needed |
|---|---|---|
| Land on dashboard, see Command Center | Partial (static) | New `command-center.html` as post-login landing |
| Destinations as switchable views | Content only, static | Editable destinations + tab switcher, persisted |
| Per-category checklist + notes | Single-plan static checklist | Generalize to per-destination × 5 categories |
| Progress = checked ÷ total, per-category + household roll-up | No | Compute from persisted items |
| Household member panel, per-destination needs | Household is prose only | New member data model + per-destination member notes |
| **Data persists across sessions, tied to user** | **No — localStorage only, no identity** | **Add Worker + D1 + an owner key** |
| Empty states | No | First-run prompts |

The three structural blockers, all new: **(1) a server + persistence layer, (2) a durable
owner/user key, (3) a client read path.**

---

## 3. Recommended architecture

**Same-origin Worker + Assets on `steep-limit-80e2`.** Add a `fetch` handler that serves
`/api/cc/*` from D1 and falls through to static assets for everything else. Chosen over a
separate API Worker because it needs **no CORS**, **no CSP change** (`connect-src 'self'`),
and a single deployment.

```
Browser
  ├─ GET /command-center.html        → static asset (dc-runtime page, readable source)
  ├─ GET /support.js, /assets/*      → static assets
  └─ /api/cc/*  (fetch, same-origin) → Worker fetch handler → D1 (kolmari-data)
```

**Post-login flow (reorg):** `access.html` → **`command-center.html`** (the new dashboard /
Command Center). The Command Center deep-links **into** the existing `app.html` research
pages (Greenbook, country detail) for per-country depth. This makes the Command Center the
"home" the spec describes **without touching the un-editable `app.html` bundle**.

> **Alternative (only if the `app.html` source project becomes available):** add a
> `page:'command'` module to the SPA's `DCLogic` root and rebuild the bundle there. Cleaner
> long-term, but blocked today because the source isn't in this repo. Documented as future
> work, not the demo path.

### `wrangler.jsonc` change

```jsonc
{
  "name": "steep-limit-80e2",
  "compatibility_date": "2026-08-01",
  "main": "src/index.js",
  "assets": { "directory": "./public", "binding": "ASSETS" },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "kolmari-data",
      "database_id": "5369f592-7da8-47a2-95b9-668e18c8ed2a"
    }
  ]
}
```

With Worker + Assets, matched static files are served directly; unmatched paths (`/api/cc/*`)
invoke the Worker. The existing static site keeps working unchanged.

---

## 4. Data model / D1 schema

New tables **namespaced `cc_`** to keep them clearly separate from the analytics `records`
table in the shared DB. The 5 categories and the default checklist items are **code
constants** for v1 (spec §6: fixed categories, static defaults).

```sql
-- Categories are a code constant: ['work','visa','schools','safety','community']

CREATE TABLE IF NOT EXISTS cc_household (
  id          TEXT PRIMARY KEY,
  owner_key   TEXT NOT NULL,          -- identity key (see §7)
  name        TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_household_owner ON cc_household(owner_key);

CREATE TABLE IF NOT EXISTS cc_member (
  id            TEXT PRIMARY KEY,
  household_id  TEXT NOT NULL REFERENCES cc_household(id),
  name          TEXT NOT NULL,
  age           INTEGER,
  needs         TEXT,                 -- free-text (structured tags = later, spec Q12)
  position      INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_member_hh ON cc_member(household_id);

CREATE TABLE IF NOT EXISTS cc_destination (
  id            TEXT PRIMARY KEY,
  household_id  TEXT NOT NULL REFERENCES cc_household(id),
  name          TEXT NOT NULL,
  position      INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_dest_hh ON cc_destination(household_id);

CREATE TABLE IF NOT EXISTS cc_checklist_item (
  id             TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES cc_destination(id),
  category       TEXT NOT NULL,       -- one of the 5 category keys
  text           TEXT NOT NULL,
  checked        INTEGER NOT NULL DEFAULT 0,
  is_default     INTEGER NOT NULL DEFAULT 0,
  position       INTEGER DEFAULT 0,
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cc_item_dest ON cc_checklist_item(destination_id, category);

CREATE TABLE IF NOT EXISTS cc_note (              -- one per (destination, category)
  id             TEXT PRIMARY KEY,
  destination_id TEXT NOT NULL REFERENCES cc_destination(id),
  category       TEXT NOT NULL,
  body           TEXT,
  updated_at     TEXT NOT NULL,
  UNIQUE(destination_id, category)
);

CREATE TABLE IF NOT EXISTS cc_member_note (       -- how a destination addresses a member's need
  id             TEXT PRIMARY KEY,
  member_id      TEXT NOT NULL REFERENCES cc_member(id),
  destination_id TEXT NOT NULL REFERENCES cc_destination(id),
  body           TEXT,
  updated_at     TEXT NOT NULL,
  UNIQUE(member_id, destination_id)
);
```

On **destination create**, the Worker seeds one default `cc_checklist_item` per default
template row (code constant) with `is_default = 1`. Progress is `checked ÷ total` per
category, rolled up per destination and across the household — computed from this data.

---

## 5. Backend API (Worker `src/index.js`)

Same-origin JSON API under `/api/cc/*`, mirroring `kolmari-collect`'s helpers (prepared
statements, `json()` responder). No CORS needed (same origin).

| Method + path | Purpose |
|---|---|
| `GET /api/cc/state` | Full board for the owner: household + members + destinations + items + notes + member-notes (one round trip to hydrate the UI) |
| `POST /api/cc/destination` | Add destination (seeds default checklist items) |
| `PATCH /api/cc/destination/:id` | Rename / reorder |
| `DELETE /api/cc/destination/:id` | Remove destination (cascade its items/notes) |
| `POST /api/cc/item` | Add checklist item (user-added, `is_default=0`) |
| `PATCH /api/cc/item/:id` | Toggle `checked` / edit `text` |
| `DELETE /api/cc/item/:id` | Remove item |
| `PUT /api/cc/note` | Upsert `(destination, category)` note |
| `POST /api/cc/member` / `PATCH /api/cc/member/:id` / `DELETE /api/cc/member/:id` | Manage members |
| `PUT /api/cc/member-note` | Upsert `(member, destination)` note |

Every handler resolves the **owner key** first (see §7) and scopes all queries to that
household. Writes use `env.DB.prepare(...).bind(...)`; multi-row seeds use `env.DB.batch(...)`.

---

## 6. Frontend (`public/command-center.html`, dc-runtime)

Authored in the **same readable dc-runtime style** as `quiz.html` / `explore.html`
(`<script src="./support.js">`, `<x-dc>` template, `class Component extends DCLogic`), reusing
the site's sidebar shell markup and Kolmari styling (Poppins/Geist, `#0d1b39` / `#f3c516`).

Layout (spec §5):
- **Destination switcher** — segmented tabs; one destination shown at a time (readable at any count).
- **5 category cards** per destination — each with its checklist (toggle, add, delete items) and a notes textarea.
- **Household member panel** — always visible regardless of selected destination; per-member, per-destination "how this destination addresses this need" field.
- **Progress** — per-category bar + destination roll-up + household-wide percentage.
- **Empty state** — first-run prompt to "Add your first destination" instead of a blank board.

Behavior: on mount, `GET /api/cc/state` hydrates; edits are **optimistic** with debounced
`PATCH`/`PUT` writes. All fetches are same-origin (CSP-safe).

**Maintainability note / reorg:** because `app.html` is an un-editable generated bundle, the
one edit it may still want is a nav affordance pointing to the Command Center. Rather than
patching the minified bundle, add the entry point at the **login redirect** (`access.html` →
`command-center.html`) and let the Command Center link **into** `app.html`. This keeps all
hand-authored code in readable files.

---

## 7. Auth / identity decision

There is no real identity today, and login is a single shared demo credential. For the demo:

- **Mint an `owner_key` cookie at the login gate** (`access.html`, on correct code): a random
  id in an `httpOnly`, `SameSite=Lax`, long-lived cookie. The Worker reads it on every
  `/api/cc/*` request and maps it to a `cc_household` row (create-on-first-use).
- This satisfies **"persists across sessions"** (cookie survives sessions) and gives each
  demo browser its own board. For a single shared-family demo, all traffic can instead be
  pinned to one fixed `owner_key='demo'` household — a one-line switch.
- **Future real auth:** issue a signed session cookie at a real sign-in backed by a `users`
  table; `owner_key` becomes the user id. The schema above needs no change — only how
  `owner_key` is derived. (Answers spec Q5; migration path for Q2.)

---

## 8. Recommendations for the spec's open questions (§7)

Grounded in the build, so schema work isn't blocked:

1. **Internal vs multi-user demo** → Single shared demo account today; `owner_key` cookie already allows per-browser separation at no extra cost. **Recommend: per-browser boards, defaulting to one demo household.**
2. **Portable to Neon later** → Keep the API a thin data layer over ANSI-ish SQL and `cc_*` tables; treat demo data as disposable. **Recommend: rebuild in Neon, not migrate.**
3. **One board or multiple scenarios** → **One household = one board for v1.** "Plan A/B" is destinations within one board; multi-board is a later `cc_board` layer.
4. **Pull member data from existing profile/onboarding fields** → Those live only in `localStorage['kolmari:quiz']`, not a server schema. **Recommend: collect independently in v1**, optionally prefill from `kolmari:quiz` client-side.
5. **Real auth vs no-login** → **No real auth for the demo**; `owner_key` cookie is enough (see §7).
6. **Add destination: free text vs from country data** → **Free-text for v1** (fastest, no coupling); autocomplete from Kolmari country data is a later enhancement.
7. **Cap on destinations** → No hard cap; the tab switcher stays readable. **Soft cap ~8** with a gentle nudge if desired.
8. **Per-destination checklist variance** → **One generic default template for all destinations in v1** (spec §6). Users add destination-specific items manually.
9. **Categories fixed or configurable** → **Fixed 5, identical for everyone** (code constant); configurability is post-v1.
10. **Who maintains default checklist text** → **Static content in code for v1.** A `cc_default_item` content table an admin edits is a clean later upgrade (the app has no `/admin` today, so not now).
11. **Extra member fields** → v1: name, age, free-text needs. Add current school/grade, flagged concerns later.
12. **Needs free-text vs structured tags** → **Free-text v1**; add optional tags later to power matching (schema can gain a `cc_member_tag` table without disruption).
13. **Progress scope** → **Per-destination progress + one household-wide roll-up** (both cheap from the same data).
14. **Demo data disposable vs real** → **Treat as disposable** for the demo (fine to wipe/reset); the `records` analytics table is unrelated and must be preserved.
15. **Plan-tier gating** → Out of scope for the demo; **gate at ship time** on the main site (no plan/tier system exists here yet).

---

## 9. Phased build plan

- **Phase 0 — Decisions.** Confirm §8.1–§8.5 (scope/identity). Defaults above unblock everything else.
- **Phase 1 — Backend.** Update `wrangler.jsonc` (main + assets binding + D1 binding). Add `src/index.js` with `/api/cc/*`. Create `cc_*` tables + apply the migration (via `wrangler d1` or the D1 query tool). Seed default-item constant.
- **Phase 2 — Client data layer.** Small `public/cc-api.js` fetch wrapper for the endpoints; optimistic-update helpers.
- **Phase 3 — UI.** `public/command-center.html` dc-runtime page: destination switcher, 5 category cards (checklist + notes), member panel, progress, empty states.
- **Phase 4 — Identity + entry point.** Set `owner_key` cookie at `access.html`; point the post-login redirect to `command-center.html`; deep-link into `app.html` research pages.
- **Phase 5 — Seed + verify.** Seed a demo household end-to-end on `steep-limit-80e2`; confirm persistence across sessions and that the analytics `records` table is untouched.

---

## 10. Risks & reorg notes

- **`app.html` is a generated, minified, source-less bundle.** Do not hand-edit it. The plan
  deliberately routes around it; full SPA-inline integration needs the upstream source project.
- **Shared D1.** `kolmari-data` holds live analytics (`records`, 2,605 rows). Only add `cc_*`
  tables; never reset the DB. (The `num_tables:0` in the account list is stale.)
- **CDN dependency.** `app.html` needs `unpkg` for React at runtime. `command-center.html`
  uses the same dc-runtime via `support.js` (same dependency) — acceptable, and consistent.
- **Static→Worker switch.** Adding `main` changes the deploy type; verify the existing static
  site still serves and only `/api/cc/*` hits the Worker before shipping.
- **Identity is the real product gap.** The cookie approach is a demo expedient; a genuine
  per-user feature needs real auth, which the current build has never had.

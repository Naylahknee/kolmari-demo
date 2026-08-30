# Kolmari Demo Quiz — Page + Layout Map

## Status

**Authoritative layout specification for the Kolmari demo quiz.**

This document defines the screen-by-screen experience for `public/quiz.html` and how each screen hands data into the canonical Move Profile defined in `docs/quiz-move-profile-mapping.md`.

The goal is not to create twelve identical questionnaire pages. The quiz should feel like a guided planning experience with changing interaction patterns, useful feedback, and a clear visual rhythm.

---

# Global Quiz Shell

Every quiz screen uses the same outer shell:

```text
┌─────────────────────────────────────────────────────┐
│ Preview strip                                       │
├─────────────────────────────────────────────────────┤
│ Kolmari logo                              Save/Exit? │
│                                                     │
│ progress indicator                                  │
│                                                     │
│ main question                                       │
│ supporting line                                     │
│                                                     │
│ interaction area                                    │
│                                                     │
│ optional Auntie reaction / micro-insight            │
│                                                     │
│ Back                                      Continue  │
└─────────────────────────────────────────────────────┘
```

### Desktop

- centered content column
- max content width: approximately 760–860px for visual-card screens
- narrower 560–640px column for simple choice screens
- generous vertical breathing room
- no app sidebar during quiz

### Mobile

- single-column
- edge padding approximately 16px
- cards may become 2-up or 1-up depending on content
- primary action becomes full-width when useful
- horizontal image cards may become a swipeable row only when the choices remain fully understandable

### Progress

Do not show `Step 1 of 12` as the dominant visual on every page.

Use a restrained progress bar or dots. The user should understand that the quiz has momentum without feeling trapped in a government form.

Recommended labels by phase:

```text
YOUR MOVE
YOUR OPTIONS
YOUR REALITY
YOUR LIFE
YOUR STARTING POINT
```

These are internal experience phases, not Shaunda question-type labels.

---

# Page 0 — Welcome / Demo Context

## Purpose

Set expectations and begin with confidence, not a legal wall of text.

## Layout type

**Hero + one primary action**

```text
[small demo notice]

       butterfly

Where could your life actually work?

Kolmari helps you figure out what is realistic for
YOUR household, YOUR money, and the life you want.

[ Start my move ]

About 4–6 minutes
```

The existing demo disclaimer should remain available, but the legal/demo explanation should be visually secondary rather than the headline experience.

---

# Page 1 — Household

## Question

**Who's coming with you?**

## Layout type

**Large illustrated/person cards + inline household builder**

### First state

Use four cards in a 2×2 desktop grid / stacked or 2×2 mobile grid:

```text
┌──────────────┐ ┌──────────────┐
│    👤        │ │    👩🏽‍🤝‍👨🏾     │
│ Just me      │ │ Me + partner │
└──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│   👨‍👩‍👧       │ │    💭        │
│ My family    │ │ Exploring    │
└──────────────┘ └──────────────┘
```

### Family/partner selected state

The selection does **not** advance immediately. The card area compresses and reveals:

```text
Okay, we're moving a crew. 😂

Adults       [ – ] 2 [ + ]
Kids         [ – ] 2 [ + ]
Pets         [ – ] 0 [ + ]

[ Continue ]
```

A tiny household visualization may update as counts change.

## Maps to

- `household.status`
- `household.adults`
- `household.dependents`
- `household.pets`

---

# Page 2 — Journey Stage

## Question

**Where are you in this thing?**

## Layout type

**Four illustrated journey scenes**

Use a horizontal visual progression on desktop and stacked cards on mobile.

```text
💭 Dreaming  →  🔎 Researching  →  🗺️ Narrowing  →  📋 Preparing
```

Each card includes:

- simple illustration
- short title
- one-line descriptor

Example:

**I'm dreaming**
`I know I want something different, but that's about it.`

The selected card expands slightly and shows one short Auntie response before Continue.

## Maps to

- `planningStage`

---

# Page 3 — Priorities

## Question

**What would make moving abroad worth it?**

## Layout type

**Icon tile board — multi-select**

Use 3 columns desktop, 2 columns tablet/mobile.

Cards:

- Lower cost of living
- Safety
- Black community / belonging
- Healthcare
- Education
- Work opportunity
- Climate / lifestyle
- Path to residency
- Walkability / daily life

Do not use stock photos here. Icons make scanning faster.

### Interaction

User may select up to 4.

A compact counter appears:

`3 selected`

Continue only after at least one selection.

## Maps to

- `priorities[]`

---

# Page 4 — Non-negotiables

## Question

**Okay. Which TWO can’t we play about?**

## Layout type

**Selected-priority cards only**

Do not show all nine choices again.

Only the choices selected on Page 3 appear as larger cards.

```text
Your picks

[ Affordability ]   [ Belonging ]
[ Healthcare ]      [ Walkability ]

Choose up to 2 that are truly non-negotiable.
```

This is intentionally a second interaction because the user is not repeating a classification; they are converting preferences into constraints.

## Maps to

- `mustHaves[]`

---

# Insight Interstitial A — First Reflection

## Purpose

Break the questionnaire rhythm and demonstrate that Kolmari is already using the answers.

## Layout type

**Auntie insight card**

Example:

```text
👀 Auntie noticed something.

You're not just looking for somewhere cheaper.
You're trying to make a move that works for a family
AND gives you stronger community.

That changes what makes a destination worth considering.

[ Keep going ]
```

No new data is collected here.

---

# Page 5 — Region Curiosity

## Question

**Where are you curious about?**

## Layout type

**Map-region cards**

Prefer simple stylized map crops or region illustrations over destination photography.

Desktop:

```text
[ EUROPE ] [ LATIN AMERICA + CARIBBEAN ]
[ AFRICA ] [ ASIA + PACIFIC ]
[        SURPRISE ME        ]
```

Allow multi-select.

Below the cards, provide a small optional toggle:

`Only show me places in the regions I picked`

Default OFF.

## Maps to

- `preferredRegions[]`
- `regionRequirement`

---

# Page 6 — Funding / Pathway Signals

## Question

**What might fund your life abroad?**

## Layout type

**Multi-select pathway cards**

Cards use clear illustrations/icons rather than immigration terminology:

- Keep my remote job
- Find a job there
- Run/start a business
- Study
- Savings/investments
- Pension/retirement
- I'm figuring that out

The interface must communicate that multiple answers are normal.

Small copy:

`Pick everything that could realistically be part of the picture.`

## Maps to

- `fundingSources[]`
- `remoteWorkIntent`
- `pathwayInterests[]`

---

# Page 7 — Connections Abroad

## Question

**Any of these belong to your story?**

## Layout type

**Simple icon list with multi-select**

This screen should be intentionally calmer after two visual-heavy pages.

Rows:

```text
🌍 Another citizenship/passport
🌳 Parent or grandparent ancestry abroad
❤️ Partner/spouse has another citizenship
👨‍👩‍👧 Close family abroad
🔎 Maybe — I need to investigate
🚫 None that I know of
```

If `None` is selected, clear conflicting selections.

Do not ask country details on this page.

## Maps to

- `connectionSignals[]`
- `connectionStatus`

---

# Page 8 — Housing Reality

## Question

**What monthly housing cost feels realistic?**

## Layout type

**Large number cards / range ladder**

Use an ordered vertical range rather than generic radio buttons.

```text
UNDER $1,000

$1,000–$2,000

$2,000–$3,500

$3,500+

I DON'T KNOW YET
```

Selected range receives a strong visual fill.

Supporting copy:

`This is about what feels comfortable — not what immigration rules require.`

## Maps to

- `housingBudgetBand`

---

# Page 9 — Move-Fund Reality

## Question

**How are we looking on move money?**

## Layout type

**Savings meter / stacked choice bands**

Use a visual ladder from “haven't started” to “$30k+,” with `I have no idea what I'll need` visually separated.

Avoid a literal progress bar that implies higher savings = better person or guaranteed feasibility.

Auntie microcopy may appear after selection:

- `No shame. We just need the real number to build the plan.`
- `Okay — now we can start estimating the gap instead of guessing.`

## Maps to

- `relocationSavingsBand`

---

# Page 10 — Timeline

## Question

**When would you ideally like to move?**

## Layout type

**Horizontal timeline**

Desktop:

```text
NOW-ish        THIS YEAR        LATER        SOMEDAY
0–6 mo   →     6–12 mo   →      1–2 yrs  →  2+ yrs / no date
```

Mobile becomes stacked timeline cards.

Do not use a date picker here.

## Maps to

- `timeline`

---

# Insight Interstitial B — Reality Check

## Purpose

Show that money + household + timeline are interacting.

## Layout type

**Personalized summary card**

Example structure:

```text
Here's the picture so far.

2 adults · 2 kids
1–2 year timeline
$1,000–$2,000 housing comfort
$5k–$15k move fund today

Kolmari will use this to separate:
✓ places worth researching
! places that may need more runway

[ Keep going ]
```

Do not invent a move-fund target yet unless the demo has real cost data to support it.

---

# Page 11 — Hair-Care Ecosystem

## Question

**Who's touching your hair? 😂**

Supporting copy:

`Pick the place that looks most like what you normally need.`

## Layout type

**Image-first storefront/service cards**

This should be the most visually distinctive screen in the quiz.

Recommended four primary image cards:

```text
┌────────────────────┐ ┌────────────────────┐
│ photo: quick chain │ │ photo: specialist  │
│ Quick/basic        │ │ Specialist         │
└────────────────────┘ └────────────────────┘

┌────────────────────┐ ┌────────────────────┐
│ photo: braiding /  │ │ photo: full salon  │
│ beauty ecosystem   │ │ Full service       │
│ Braids/wigs/weaves │ │                    │
└────────────────────┘ └────────────────────┘
```

Below image grid:

`I handle my own hair` · `Not important to me`

### Image treatment

- storefront/interior/service environment, not just headshots
- diverse but authentic clientele
- no race labels
- image should communicate the type of service ecosystem before the user reads the caption
- consistent crop ratio across all cards

## Maps to

- `lifestyleNeeds.haircare`

---

# Page 12 — Biggest Obstacle

## Question

**What's making this feel hardest right now?**

## Layout type

**Large statement cards**

This should feel emotionally easy to answer.

Cards:

- I don't know where to go
- Visas confuse me
- I don't know what this costs
- Work / income
- Paperwork
- I don't know where to start

No images needed.

The selected response determines the first meaningful action shown after the quiz.

## Maps to

- `primaryObstacle`

---

# Page 13 — Places Already in Mind

## Question

**Already have somewhere in mind?**

## Layout type

**Destination search/add chips**

```text
[ Type a city or country...              ] [ Add ]

Your list
[ Portugal × ] [ Belize × ] [ Spain × ]

[ I don't have anywhere yet ]
```

Do not force a destination.

If none are supplied, Kolmari may suggest places later based on the Move Profile.

## Maps to

- `destinationsAlreadyConsidering[]`

---

# Results / Handoff Page

## Headline

Do not use a generic personality-style quiz result.

Recommended framing:

**Okay. Now we have something to work with.**

## Layout type

**Move Profile summary + first three actions**

```text
┌──────────────────────────────────────────────┐
│ YOUR MOVE                                    │
│ 2 adults · 2 kids                            │
│ Researching · 1–2 years                      │
│ Europe + open elsewhere                      │
├──────────────────────────────────────────────┤
│ YOUR NON-NEGOTIABLES                         │
│ Affordability · Belonging                    │
├──────────────────────────────────────────────┤
│ HOW LIFE MAY BE FUNDED                       │
│ Remote work · Business                       │
├──────────────────────────────────────────────┤
│ THE THING TO SOLVE FIRST                     │
│ Visas                                        │
└──────────────────────────────────────────────┘
```

Then:

```text
Auntie's starting with:

1. Find pathway categories worth investigating
2. Compare what your household needs
3. Build the money picture
```

If user supplied destinations:

`We'll set up Portugal, Belize, and Spain in your Command Center.`

If not:

`We'll start by showing you places worth investigating — without pretending they're guaranteed matches.`

Primary CTA:

**Open my Command Center**

---

# Command Center Landing Layout After Quiz

The existing Command Center should no longer open with a generic `0 of 0` state when a Move Profile exists.

## Above-the-fold order

```text
1. Greeting / planning-stage context
2. Move Profile summary strip
3. “Auntie is starting here” action cards
4. Destination area
5. Progress/checklist area
```

### Proposed desktop structure

```text
┌──────────── sidebar ───────────┬──────────────────────────────────────┐
│ Command Center                │ Good morning. Here's the move.      │
│ Your World                    │                                      │
│ My Move Profile               │ [ household ] [ timeline ] [ money ] │
│                               │ [ priorities ] [ biggest obstacle ]   │
│                               │                                      │
│                               │ AUNTIE IS STARTING HERE               │
│                               │ [ Pathway ] [ Money ] [ Compare ]     │
│                               │                                      │
│                               │ YOUR DESTINATIONS                     │
│                               │ [Portugal] [Spain] [+ Add]            │
│                               │                                      │
│                               │ selected destination planning board   │
└───────────────────────────────┴──────────────────────────────────────┘
```

### Mobile structure

No permanent sidebar.

```text
Header
Move summary
Auntie starting cards
Destination selector
Planning categories stacked
Household section
```

---

# Command Center Empty-State Rules

There are now three legitimate initial states.

## State A — User supplied destinations

Seed them directly.

Example:

`You gave Auntie 3 places to work with.`

Show those destination tabs immediately.

## State B — No destinations, enough profile data for suggestions

Do not show a dead empty screen.

Show:

**Places worth investigating**

These are recommendations/research candidates, visibly distinct from saved destinations.

CTA on each:

`Add to my Command Center`

No fabricated Match Score.

## State C — Not enough data for meaningful suggestions

Use a purposeful empty state:

`We know what matters to you, but we need one more thing before recommending places.`

Then ask the missing high-value question in context.

---

# Layout Rhythm Summary

The quiz deliberately alternates interaction patterns:

| Page | Interaction pattern |
|---|---|
| Welcome | Hero |
| Household | Visual cards + counters |
| Journey | Illustrated progression |
| Priorities | Icon tile multi-select |
| Non-negotiables | Reduced card set |
| Insight A | Reflection card |
| Region | Map cards |
| Funding | Multi-select cards |
| Connections | Calm icon list |
| Housing | Numeric range ladder |
| Move money | Savings ladder |
| Timeline | Visual timeline |
| Insight B | Personalized summary |
| Hair care | Image cards |
| Obstacle | Statement cards |
| Destinations | Search + chips |
| Result | Move summary + next actions |

This variation is intentional. Do not normalize every question into the same button-list component.

---

# Build Rule

Before implementing a screen, verify:

1. What Move Profile field does it write?
2. What downstream behavior changes because of that answer?
3. Which interaction pattern is specified here?
4. Does the screen require an image, icon, control, or plain text choice?
5. Does the next screen need a conditional branch?

Do not alter the question order, layout pattern, field mapping, or downstream effect without updating both this document and `quiz-move-profile-mapping.md` first.

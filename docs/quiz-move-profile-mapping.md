# Kolmari Demo Quiz → Move Profile → Command Center Mapping

## Status

**Authoritative specification for the Kolmari demo app only.**

This document defines how `public/quiz.html` should collect relocation-planning information, how those answers should be represented as one canonical **Move Profile**, and how the Move Profile should seed and personalize `public/command-center.html`.

Production Kolmari is a reference source for useful questions and existing planning logic. This document does **not** direct changes to the production app.

---

# Product Rule

The demo has **one intake flow**: the quiz.

The user should not take a quiz and then complete a second profile wizard.

The quiz progressively builds one Move Profile. When the quiz ends, that profile should already be useful to the Command Center.

Flow:

```text
public/quiz.html
  → temporary Move Profile
  → immediate quiz result / insight
  → access or signup flow
  → persist/restore Move Profile
  → public/command-center.html
```

The Command Center may ask additional questions later only when the information is needed for a concrete planning action.

---

# Question Admission Rule

A quiz question belongs only when it does at least one of these jobs:

1. Changes pathway research.
2. Changes destination fit or comparison.
3. Changes cost planning.
4. Changes lifestyle/community research.
5. Changes Command Center tasks, sequencing, or emphasis.
6. Adds useful personalization.
7. Is intentionally a Shaunda Head Fun Question.
8. Is intentionally a Shaunda Head Market Research Question.

Do not collect information simply because it might be useful someday.

---

# Allowed Downstream Effects

| Effect | Meaning |
|---|---|
| `PATHWAY_RESEARCH` | Changes which visa/residence pathway categories Kolmari should investigate. Never equals legal eligibility. |
| `DESTINATION_FIT` | Changes which destinations are prioritized, compared, or flagged for friction. |
| `COST_MODEL` | Changes household, housing, or move-fund planning. |
| `LIFESTYLE_FIT` | Changes day-to-day livability research such as community, hair care, climate, services, etc. |
| `ROADMAP` | Changes Command Center tasks, sequence, deadlines, and research prompts. |
| `PERSONALIZATION` | Changes what Kolmari remembers, emphasizes, or surfaces first. |
| `MARKET_RESEARCH` | Helps Kolmari understand user pain points; must not silently change fit or pathway conclusions. |

---

# Shaunda Head Question Mix

The demo quiz must include all four question types:

- **Journey Questions** — where the user is in the relocation journey.
- **Defining Questions** — information that changes Kolmari planning logic.
- **Fun Questions** — memorable, culturally aware questions that make the experience human.
- **Market Research Questions** — information that helps Kolmari understand what users need most.

Do not expose these labels to the user and do not split the quiz into four visible sections.

---

# Canonical Move Profile

The demo quiz should build one object with this shape:

```js
{
  household: {
    status: null,       // solo | partner | family | exploring
    adults: null,
    dependents: null,
    pets: null
  },

  planningStage: null, // dreaming | researching | shortlisting | preparing

  priorities: [],
  mustHaves: [],

  preferredRegions: [],
  regionRequirement: false,

  fundingSources: [],
  remoteWorkIntent: null,
  pathwayInterests: [],

  connectionSignals: [],
  connectionStatus: null,

  housingBudgetBand: null,
  relocationSavingsBand: null,
  timeline: null,

  lifestyleNeeds: {
    haircare: null
  },

  primaryObstacle: null,
  destinationsAlreadyConsidering: []
}
```

The exact storage mechanism may evolve, but the conceptual shape above is the source of truth for quiz behavior.

---

# Canonical Quiz Mapping

## Q1 — Who's coming with you?

**Shaunda type:** Defining with Fun presentation

Primary choices:

- Just me
- Me + partner
- Family
- I'm only exploring

If Family is selected, reveal a compact household builder on the same screen:

- Adults
- Kids/dependents
- Pets

Suggested response copy may include: **Okay, we're moving a crew.**

### Maps to

```text
household.status
household.adults
household.dependents
household.pets
```

### Affects

`PATHWAY_RESEARCH`, `COST_MODEL`, `ROADMAP`, `PERSONALIZATION`

### Command Center behavior

Household composition should influence:

- spouse/dependent research prompts
- schools when dependents exist
- housing assumptions
- family document tasks
- travel/move-fund assumptions
- pet relocation tasks when pets exist

Do not invent ages, diagnoses, school needs, or other household facts.

---

## Q2 — Where are you in this thing?

**Shaunda type:** Journey

Visual choices:

- I'm dreaming
- I'm seriously researching
- I'm narrowing down places
- I'm getting ready to move

### Maps to

```text
planningStage
```

### Affects

`ROADMAP`, `PERSONALIZATION`

### Command Center behavior

- `dreaming` → feasibility, broad destination discovery, high-level pathways and cost
- `researching` → comparison, pathways, community/lifestyle research
- `shortlisting` → friction, tradeoffs, costs, destination comparison
- `preparing` → documents, deadlines, applications, housing, schools, move logistics

Do not infer the entire planning stage only from timeline.

---

## Q3 — What would make moving abroad worth it?

**Shaunda type:** Defining

Visual multi-select cards:

- Lower cost of living
- Safety
- Black community / belonging
- Healthcare
- Education
- Work opportunity
- Climate / lifestyle
- Path to residency
- Walkability / daily life

After selection, ask the user to choose a maximum of **two non-negotiables** from the items already selected.

### Maps to

```text
priorities[]
mustHaves[]
```

### Affects

`DESTINATION_FIT`, `LIFESTYLE_FIT`, `ROADMAP`, `PERSONALIZATION`

### Rule

A non-negotiable is not merely bonus score points. When the demo has reliable information, it may generate a friction or dealbreaker warning. When reliable information is unavailable, show that the item still needs research rather than fabricating a fit conclusion.

---

## Q4 — Where are you curious about?

**Shaunda type:** Defining

Choices:

- Europe
- Latin America + Caribbean
- Africa
- Asia + Pacific
- Surprise me / open to anywhere

Allow multi-select.

### Maps to

```text
preferredRegions[]
regionRequirement
```

### Affects

`DESTINATION_FIT`, `PERSONALIZATION`

### Rule

Region curiosity is a preference unless the user explicitly says the selected region is required. Europe selected with `regionRequirement=false` means prioritize Europe, not exclude every better-fitting destination elsewhere.

---

## Q5 — What might fund your life abroad?

**Shaunda type:** Defining

Multi-select choices:

- Keep my remote job
- Find a job there
- Run or start a business
- Study
- Savings / investments
- Pension / retirement
- I'm figuring that out

### Maps to

```text
fundingSources[]
remoteWorkIntent
pathwayInterests[]
```

### Affects

`PATHWAY_RESEARCH`, `DESTINATION_FIT`, `ROADMAP`, `PERSONALIZATION`

### Rule

This tells Kolmari which pathway categories are worth investigating. It does **not** establish visa eligibility.

Approved framing:

> Based on what you told Kolmari, remote-work pathways are worth investigating.

Avoid:

> You qualify for a digital nomad visa.

without route-specific evidence.

---

## Q6 — Any of these belong to your story?

**Shaunda type:** Defining

Allow multi-select:

- I have another citizenship/passport
- Parent/grandparent ancestry abroad
- My partner/spouse has another citizenship
- Close family abroad
- Maybe — I need to investigate
- None that I know of

### Maps to

```text
connectionSignals[]
connectionStatus
```

Detailed country/relationship information can be collected later when it is actually needed.

### Affects

`PATHWAY_RESEARCH`, `ROADMAP`, `PERSONALIZATION`

### Rule

Citizenship, ancestry, partner citizenship, and family ties are separate concepts. Never collapse them into one legal conclusion.

---

## Q7 — What monthly housing cost feels realistic?

**Shaunda type:** Defining

Choices:

- Under $1,000
- $1,000–$2,000
- $2,000–$3,500
- More than $3,500
- I don't know yet

### Maps to

```text
housingBudgetBand
```

### Affects

`DESTINATION_FIT`, `COST_MODEL`, `PERSONALIZATION`

### Rule

Housing budget is a preference/comfort signal. It is not the same thing as immigration income requirements or total relocation affordability.

---

## Q8 — How are we looking on move money?

**Shaunda type:** Defining

Choices:

- Haven't started saving
- Under $5,000
- $5,000–$15,000
- $15,000–$30,000
- $30,000+
- I have no idea what I'll need

### Maps to

```text
relocationSavingsBand
```

### Affects

`COST_MODEL`, `ROADMAP`, `PERSONALIZATION`

### Rule

Do not silently convert a savings band into a fabricated exact savings balance.

---

## Q9 — When would you ideally like to move?

**Shaunda type:** Defining + Journey signal

Choices:

- 0–6 months
- 6–12 months
- 1–2 years
- 2+ years
- No date yet

### Maps to

```text
timeline
```

### Affects

`ROADMAP`, `PERSONALIZATION`

### Command Center behavior

Timeline changes urgency and sequencing. A near-term mover may need passport/document/application tasks immediately. A long-range mover should not be told to order time-sensitive records prematurely.

---

## Q10 — Who's touching your hair?

**Shaunda type:** Fun

This should use **images of hair-care places/environments**, not race labels and not simply hairstyle photos.

Suggested image cards:

- Quick/basic salon or chain
- Specialist salon/barber
- Braids / wigs / weaves ecosystem
- Full-service salon
- I handle my own hair
- Not important to me

### Maps to

```text
lifestyleNeeds.haircare
```

Suggested values:

```text
basic
specialist
braids_wigs_weaves
full_service
self_service
not_important
```

### Affects

`LIFESTYLE_FIT`, `PERSONALIZATION`

### Rule

Never infer race from the answer.

The answer may later cause Kolmari to surface salons, barbers, braiders, textured-hair specialists, beauty-supply options, or product availability.

It must not affect visa feasibility. It should have little or no general destination weight unless the user later explicitly marks this need as non-negotiable.

---

## Q11 — What's making this feel hardest right now?

**Shaunda type:** Market Research

Choices:

- I don't know where to go
- Visas confuse me
- I don't know what this costs
- Work / income
- Paperwork
- I don't know where to start

### Maps to

```text
primaryObstacle
```

### Affects

`ROADMAP`, `PERSONALIZATION`, `MARKET_RESEARCH`

### Command Center behavior

Use this answer to choose the user's first meaningful action.

Examples:

- country choice → build/compare shortlist
- visas → investigate pathway categories
- money → build move-fund estimate
- work → income/work pathway research
- paperwork → document plan
- don't know where to start → guided starting sequence

For product analytics, this answer may also identify which Kolmari problem users most urgently want solved.

---

## Q12 — Already have somewhere in mind?

**Shaunda type:** Defining

This preserves the strongest part of the current demo quiz: allow users to add destinations they are already considering.

### Maps to

```text
destinationsAlreadyConsidering[]
```

### Affects

`DESTINATION_FIT`, `ROADMAP`, `PERSONALIZATION`

### Command Center behavior

User-entered destinations should be added to the Command Center as real comparison targets.

If the user enters none, the Command Center may instead present researched destinations worth investigating based on the Move Profile. Do not fabricate a match score merely to avoid an empty state.

---

# Interaction Rhythm

The quiz must not feel like twelve consecutive radio-button screens.

Use a mix of:

- image cards
- icon cards
- multi-select
- counters
- conditional follow-ups
- forced tradeoffs only when they improve the data
- brief Auntie reactions
- occasional useful micro-insights

Recommended rhythm:

```text
Question
→ Question
→ brief insight
→ visual question
→ Question
→ useful reflection
→ Question
```

Auntie voice is guidance, not a chatbot requirement.

---

# Image Rules

Use images where the image itself helps the user make the choice.

Best candidates:

- Journey stage illustrations
- lifestyle/environment preferences
- hair-care ecosystem
- selected tradeoff questions

Do not add stock photography to factual questions such as timeline, savings, ancestry, or household counts merely for decoration.

The hair-care question is specifically about **service infrastructure**, not identity classification.

---

# Command Center Seed Contract

When `public/command-center.html` loads after the quiz, it should read the Move Profile and avoid a context-free zero state whenever useful profile data exists.

Instead of only:

```text
0 destinations
Add a destination
```

it should be able to summarize known planning context, for example:

```text
Moving: 2 adults · 2 kids
Timing: 1–2 years
Non-negotiables: affordability · belonging
Funding: remote work + business
Region curiosity: Europe
Biggest question: visas
```

Then give the user a small number of starting actions tied to those answers.

Possible starting actions:

1. Investigate plausible pathway categories.
2. Compare household requirements across destinations.
3. Build the move-fund target.

If the user supplied destinations, seed those destinations.

If they did not, allow Kolmari to surface destinations worth investigating, clearly distinguishing recommendations from user-saved destinations.

---

# Question → Behavior Summary

| Question | Primary stored data | Primary effect |
|---|---|---|
| Who's coming? | household | cost, dependent research, roadmap |
| Journey stage | planningStage | Command Center emphasis |
| What makes it worth it? | priorities, mustHaves | fit, friction, research priority |
| Region curiosity | preferredRegions | destination prioritization |
| Funding life abroad | fundingSources | pathway research |
| Citizenship/ancestry/family | connectionSignals | pathway research |
| Housing budget | housingBudgetBand | cost/destination comparison |
| Move money | relocationSavingsBand | move-fund planning |
| Timeline | timeline | task sequencing |
| Hair-care ecosystem | lifestyleNeeds.haircare | lifestyle research/personalization |
| Biggest obstacle | primaryObstacle | first action + market research |
| Places in mind | destinationsAlreadyConsidering | Command Center destinations |

---

# Do Not Do

The demo must not:

- collect the same answer twice in different intake flows
- create a second profile wizard after the quiz
- infer race from cultural/lifestyle questions
- treat a user preference as immigration eligibility
- fabricate exact income, savings, or cost numbers from bands
- fabricate Match Scores to fill an empty screen
- use every quiz answer as arbitrary score points
- ask questions that do not affect a user outcome or intentional market research
- show every user the same Command Center regardless of what they answered

---

# Persistence Contract

The current demo already uses local browser state to seed the Command Center. The revised implementation should move toward one stable key for the canonical Move Profile rather than separate quiz-shaped values.

Recommended key:

```text
kolmari:move-profile
```

During migration, continue reading the existing quiz storage key where necessary and translate it into the canonical Move Profile.

Do not silently discard existing demo answers during the migration.

---

# Implementation Order

## Phase 1 — Data contract

Create the canonical Move Profile object and translation from the existing `kolmari:quiz` payload.

Do not redesign the entire quiz first.

## Phase 2 — Quiz behavior

Update `public/quiz.html` to write the canonical Move Profile and implement the approved question set and conditional interactions.

## Phase 3 — Command Center consumption

Update `public/command-center.html` so the Move Profile changes:

- initial summary
- starting actions
- household-aware prompts
- destination seeding
- roadmap emphasis

## Phase 4 — Progressive profiling

Ask for detailed information only when the user reaches a task that requires it.

Examples:

- exact ancestry country when researching ancestry pathways
- child ages when researching schools
- exact savings/income when building a real budget
- pet species when researching import requirements

## Phase 5 — Remove duplicate demo intake logic

Any old demo intake logic that duplicates the canonical quiz should be removed or converted into editing the Move Profile.

---

# Success Test

After completing the quiz, the user should be able to open the Command Center and recognize that Kolmari remembers:

- who is moving
- where they are in the journey
- what matters
- what regions interest them
- how they may fund the move
- whether citizenship/ancestry/family connections need investigation
- their rough housing and move-money reality
- their timeline
- relevant lifestyle needs
- what is confusing them most
- any destinations they already have in mind

If those answers disappear after the quiz, the implementation is incomplete.

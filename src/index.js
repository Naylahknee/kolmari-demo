// Kolmari — Relocation Command Center API
//
// This Worker adds a small JSON API under /api/cc/* backed by the shared
// `kolmari-data` D1 database (binding: DB). Every other request falls through
// to the static site (binding: ASSETS), so the existing pages are unchanged.
//
// Identity for the demo is a per-browser `cc_owner` cookie, minted server-side
// on first contact. All data is scoped to the household that owns that cookie.

const CATEGORIES = [
  { key: "work", label: "Work & Income" },
  { key: "visa", label: "Visa & Immigration" },
  { key: "schools", label: "Schools" },
  { key: "safety", label: "Neighborhood & Safety" },
  { key: "community", label: "Community" },
];
const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

// Default (system-provided) checklist items seeded onto each new destination.
// Static content in code for v1 — see the implementation plan, spec Q10.
const DEFAULT_ITEMS = {
  work: [
    "Confirm remote-work eligibility or local job leads",
    "Check the income you need to qualify for a visa",
    "Understand local income-tax obligations",
  ],
  visa: [
    "Identify the visa route that fits your situation",
    "List required documents, apostilles and translations",
    "Note the application timeline and fees",
  ],
  schools: [
    "Shortlist schools and check enrollment windows",
    "Confirm curriculum and language of instruction",
    "Gather the records needed to transfer",
  ],
  safety: [
    "Research neighborhoods and typical rent",
    "Review local safety and healthcare access",
    "Check commute and transit options",
  ],
  community: [
    "Find expat and local community groups",
    "Identify language or cultural onboarding steps",
    "Pick one in-person meetup to attend",
  ],
};

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function readCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

// Resolve (and, if needed, mint) the owner key. Returns the key plus a
// Set-Cookie header to attach when a fresh key was created.
function resolveOwner(request) {
  const existing = readCookie(request, "cc_owner");
  if (existing) return { owner: existing, setCookie: null };
  const owner = uuid();
  const cookie =
    "cc_owner=" +
    owner +
    "; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax";
  return { owner, setCookie: cookie };
}

async function ensureHousehold(env, owner) {
  const found = await env.DB.prepare(
    "SELECT id, name FROM cc_household WHERE owner_key = ? LIMIT 1"
  )
    .bind(owner)
    .first();
  if (found) return found;
  const id = uuid();
  await env.DB.prepare(
    "INSERT INTO cc_household (id, owner_key, name, created_at) VALUES (?, ?, ?, ?)"
  )
    .bind(id, owner, "My household", now())
    .run();
  return { id, name: "My household" };
}

async function loadState(env, household) {
  const [members, destinations, items, notes, memberNotes] = await Promise.all([
    env.DB.prepare(
      "SELECT id, name, age, needs, position FROM cc_member WHERE household_id = ? ORDER BY position, created_at"
    )
      .bind(household.id)
      .all(),
    env.DB.prepare(
      "SELECT id, name, position FROM cc_destination WHERE household_id = ? ORDER BY position, created_at"
    )
      .bind(household.id)
      .all(),
    env.DB.prepare(
      `SELECT i.id, i.destination_id, i.category, i.text, i.checked, i.is_default, i.position
         FROM cc_checklist_item i
         JOIN cc_destination d ON d.id = i.destination_id
        WHERE d.household_id = ?
        ORDER BY i.position, i.created_at`
    )
      .bind(household.id)
      .all(),
    env.DB.prepare(
      `SELECT n.id, n.destination_id, n.category, n.body
         FROM cc_note n
         JOIN cc_destination d ON d.id = n.destination_id
        WHERE d.household_id = ?`
    )
      .bind(household.id)
      .all(),
    env.DB.prepare(
      `SELECT mn.id, mn.member_id, mn.destination_id, mn.body
         FROM cc_member_note mn
         JOIN cc_member m ON m.id = mn.member_id
        WHERE m.household_id = ?`
    )
      .bind(household.id)
      .all(),
  ]);

  return {
    household: { id: household.id, name: household.name },
    categories: CATEGORIES,
    members: (members.results || []).map((m) => ({
      id: m.id,
      name: m.name,
      age: m.age,
      needs: m.needs || "",
      position: m.position,
    })),
    destinations: destinations.results || [],
    items: (items.results || []).map((i) => ({
      id: i.id,
      destination_id: i.destination_id,
      category: i.category,
      text: i.text,
      checked: !!i.checked,
      is_default: !!i.is_default,
      position: i.position,
    })),
    notes: notes.results || [],
    memberNotes: memberNotes.results || [],
  };
}

async function destinationInHousehold(env, householdId, destId) {
  const row = await env.DB.prepare(
    "SELECT id FROM cc_destination WHERE id = ? AND household_id = ? LIMIT 1"
  )
    .bind(destId, householdId)
    .first();
  return !!row;
}

async function memberInHousehold(env, householdId, memberId) {
  const row = await env.DB.prepare(
    "SELECT id FROM cc_member WHERE id = ? AND household_id = ? LIMIT 1"
  )
    .bind(memberId, householdId)
    .first();
  return !!row;
}

function parseAge(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

async function handleApi(request, env, url) {
  const { owner, setCookie } = resolveOwner(request);
  const household = await ensureHousehold(env, owner);
  const extra = setCookie ? { "Set-Cookie": setCookie } : {};

  // Path after the /api/cc prefix, e.g. "/destination/<id>".
  const rest = url.pathname.replace(/^\/api\/cc/, "");
  const seg = rest.split("/").filter(Boolean); // ["destination", "<id>"]
  const resource = seg[0] || "";
  const id = seg[1] || null;
  const method = request.method;

  let body = {};
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid json" }, 400, extra);
    }
  }

  // GET /state — the full board for this owner.
  if (resource === "state" && method === "GET") {
    return json(await loadState(env, household), 200, extra);
  }

  // ---- Destinations ----
  if (resource === "destination") {
    if (method === "POST") {
      const name = String(body.name || "").trim();
      if (!name) return json({ error: "name required" }, 400, extra);
      const destId = uuid();
      const posRow = await env.DB.prepare(
        "SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM cc_destination WHERE household_id = ?"
      )
        .bind(household.id)
        .first();
      const ts = now();
      await env.DB.prepare(
        "INSERT INTO cc_destination (id, household_id, name, position, created_at) VALUES (?, ?, ?, ?, ?)"
      )
        .bind(destId, household.id, name, posRow.pos, ts)
        .run();

      // Seed default checklist items for all categories.
      const seeds = [];
      const stmt = env.DB.prepare(
        "INSERT INTO cc_checklist_item (id, destination_id, category, text, checked, is_default, position, created_at) VALUES (?, ?, ?, ?, 0, 1, ?, ?)"
      );
      for (const cat of CATEGORY_KEYS) {
        (DEFAULT_ITEMS[cat] || []).forEach((text, pos) => {
          seeds.push(stmt.bind(uuid(), destId, cat, text, pos, ts));
        });
      }
      if (seeds.length) await env.DB.batch(seeds);

      return json({ ok: true, id: destId, name, position: posRow.pos }, 200, extra);
    }
    if (method === "PATCH" && id) {
      if (!(await destinationInHousehold(env, household.id, id)))
        return json({ error: "not found" }, 404, extra);
      const name = String(body.name || "").trim();
      if (!name) return json({ error: "name required" }, 400, extra);
      await env.DB.prepare("UPDATE cc_destination SET name = ? WHERE id = ?")
        .bind(name, id)
        .run();
      return json({ ok: true }, 200, extra);
    }
    if (method === "DELETE" && id) {
      if (!(await destinationInHousehold(env, household.id, id)))
        return json({ error: "not found" }, 404, extra);
      await env.DB.batch([
        env.DB.prepare("DELETE FROM cc_checklist_item WHERE destination_id = ?").bind(id),
        env.DB.prepare("DELETE FROM cc_note WHERE destination_id = ?").bind(id),
        env.DB.prepare("DELETE FROM cc_member_note WHERE destination_id = ?").bind(id),
        env.DB.prepare("DELETE FROM cc_destination WHERE id = ?").bind(id),
      ]);
      return json({ ok: true }, 200, extra);
    }
  }

  // ---- Checklist items ----
  if (resource === "item") {
    if (method === "POST") {
      const destId = String(body.destination_id || "");
      const category = String(body.category || "");
      const text = String(body.text || "").trim();
      if (!text) return json({ error: "text required" }, 400, extra);
      if (!CATEGORY_KEYS.includes(category))
        return json({ error: "bad category" }, 400, extra);
      if (!(await destinationInHousehold(env, household.id, destId)))
        return json({ error: "not found" }, 404, extra);
      const itemId = uuid();
      const posRow = await env.DB.prepare(
        "SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM cc_checklist_item WHERE destination_id = ? AND category = ?"
      )
        .bind(destId, category)
        .first();
      await env.DB.prepare(
        "INSERT INTO cc_checklist_item (id, destination_id, category, text, checked, is_default, position, created_at) VALUES (?, ?, ?, ?, 0, 0, ?, ?)"
      )
        .bind(itemId, destId, category, text, posRow.pos, now())
        .run();
      return json(
        { ok: true, id: itemId, destination_id: destId, category, text, checked: false, is_default: false },
        200,
        extra
      );
    }
    if (method === "PATCH" && id) {
      // Verify the item belongs to this household.
      const owned = await env.DB.prepare(
        `SELECT i.id FROM cc_checklist_item i JOIN cc_destination d ON d.id = i.destination_id
          WHERE i.id = ? AND d.household_id = ? LIMIT 1`
      )
        .bind(id, household.id)
        .first();
      if (!owned) return json({ error: "not found" }, 404, extra);
      const sets = [];
      const vals = [];
      if (typeof body.checked === "boolean") {
        sets.push("checked = ?");
        vals.push(body.checked ? 1 : 0);
      }
      if (typeof body.text === "string" && body.text.trim()) {
        sets.push("text = ?");
        vals.push(body.text.trim());
      }
      if (!sets.length) return json({ error: "nothing to update" }, 400, extra);
      vals.push(id);
      await env.DB.prepare(`UPDATE cc_checklist_item SET ${sets.join(", ")} WHERE id = ?`)
        .bind(...vals)
        .run();
      return json({ ok: true }, 200, extra);
    }
    if (method === "DELETE" && id) {
      const owned = await env.DB.prepare(
        `SELECT i.id FROM cc_checklist_item i JOIN cc_destination d ON d.id = i.destination_id
          WHERE i.id = ? AND d.household_id = ? LIMIT 1`
      )
        .bind(id, household.id)
        .first();
      if (!owned) return json({ error: "not found" }, 404, extra);
      await env.DB.prepare("DELETE FROM cc_checklist_item WHERE id = ?").bind(id).run();
      return json({ ok: true }, 200, extra);
    }
  }

  // ---- Category notes (one per destination + category) ----
  if (resource === "note" && method === "PUT") {
    const destId = String(body.destination_id || "");
    const category = String(body.category || "");
    const text = typeof body.body === "string" ? body.body : "";
    if (!CATEGORY_KEYS.includes(category))
      return json({ error: "bad category" }, 400, extra);
    if (!(await destinationInHousehold(env, household.id, destId)))
      return json({ error: "not found" }, 404, extra);
    await env.DB.prepare(
      `INSERT INTO cc_note (id, destination_id, category, body, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(destination_id, category) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`
    )
      .bind(uuid(), destId, category, text, now())
      .run();
    return json({ ok: true }, 200, extra);
  }

  // ---- Household members ----
  if (resource === "member") {
    if (method === "POST") {
      const name = String(body.name || "").trim();
      if (!name) return json({ error: "name required" }, 400, extra);
      const memberId = uuid();
      const posRow = await env.DB.prepare(
        "SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM cc_member WHERE household_id = ?"
      )
        .bind(household.id)
        .first();
      await env.DB.prepare(
        "INSERT INTO cc_member (id, household_id, name, age, needs, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(memberId, household.id, name, parseAge(body.age), String(body.needs || ""), posRow.pos, now())
        .run();
      return json({ ok: true, id: memberId }, 200, extra);
    }
    if (method === "PATCH" && id) {
      if (!(await memberInHousehold(env, household.id, id)))
        return json({ error: "not found" }, 404, extra);
      const sets = [];
      const vals = [];
      if (typeof body.name === "string" && body.name.trim()) {
        sets.push("name = ?");
        vals.push(body.name.trim());
      }
      if ("age" in body) {
        sets.push("age = ?");
        vals.push(parseAge(body.age));
      }
      if (typeof body.needs === "string") {
        sets.push("needs = ?");
        vals.push(body.needs);
      }
      if (!sets.length) return json({ error: "nothing to update" }, 400, extra);
      vals.push(id);
      await env.DB.prepare(`UPDATE cc_member SET ${sets.join(", ")} WHERE id = ?`)
        .bind(...vals)
        .run();
      return json({ ok: true }, 200, extra);
    }
    if (method === "DELETE" && id) {
      if (!(await memberInHousehold(env, household.id, id)))
        return json({ error: "not found" }, 404, extra);
      await env.DB.batch([
        env.DB.prepare("DELETE FROM cc_member_note WHERE member_id = ?").bind(id),
        env.DB.prepare("DELETE FROM cc_member WHERE id = ?").bind(id),
      ]);
      return json({ ok: true }, 200, extra);
    }
  }

  // ---- Member × destination notes ----
  if (resource === "member-note" && method === "PUT") {
    const memberId = String(body.member_id || "");
    const destId = String(body.destination_id || "");
    const text = typeof body.body === "string" ? body.body : "";
    if (!(await memberInHousehold(env, household.id, memberId)))
      return json({ error: "not found" }, 404, extra);
    if (!(await destinationInHousehold(env, household.id, destId)))
      return json({ error: "not found" }, 404, extra);
    await env.DB.prepare(
      `INSERT INTO cc_member_note (id, member_id, destination_id, body, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(member_id, destination_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at`
    )
      .bind(uuid(), memberId, destId, text, now())
      .run();
    return json({ ok: true }, 200, extra);
  }

  return json({ error: "not found" }, 404, extra);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/cc")) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        return json({ error: "server error", detail: String(err).slice(0, 200) }, 500);
      }
    }
    // Everything else is the static site.
    return env.ASSETS.fetch(request);
  },
};

/**
 * Harnoor Archive — Cloudflare Worker
 *
 * Routes:
 *   POST /api/diagnose    → Gradus Diagnostic (calls Anthropic API server-side)
 *   POST /api/subscribe   → Email capture (calls Brevo API server-side)
 *   *                     → ASSETS binding (serves static HTML/CSS/JS/files)
 *
 * Environment secrets required:
 *   ANTHROPIC_API_KEY  — set in Workers dashboard → Settings → Variables and Secrets
 *   BREVO_API_KEY      — set in Workers dashboard → Settings → Variables and Secrets
 */

const SYSTEM_PROMPT = `You are the diagnostic engine for the Gradus Framework, an original model for luxury brand defensibility developed by Harnoor Jhinzer. Given a brand name, assess it across seven axes and return a structured readout.

CORE THESIS. Luxury defensibility is structural inaccessibility: the number of structurally INDEPENDENT barriers between the brand and the consumer, and how resistant each is to being collapsed by a single resource, pressure, or mistake. The goal is not maximum barriers — it is maximum filter independence. Each axis taxes a DIFFERENT resource, so that no single currency (usually money) clears the whole stack.

PERFORMATIVE vs STRUCTURAL. Distinguish these for every axis. Performative: a barrier that looks exclusive (high price, waitlist, velvet rope) but collapses given enough of the right single resource — exclusivity as an interruptible performance. Structural: a barrier on a genuinely independent axis requiring a resource that cannot be converted from the others — no single pressure point.

THE SEVEN AXES (each taxes the resource named):
1. Pecunia — Economic (taxes capital): price points, spend thresholds, purchase-history requirements. The most legible and weakest filter in isolation; a brand operating only here is one wire transfer from accessibility.
2. Nexus — Relational (taxes the right human connection): SA relationships, referral-only access, vouching. You must be brought in; you cannot discover or apply. An entry filter, not loyalty or retention. Weak if it depends on one person; strong when distributed across the institution.
3. Habitus — Cultural (taxes taste and accumulated cultural exposure): knowing what to ask for without being told, understanding the references, speaking the aesthetic language without having studied. The object itself is the filter; nothing is administered.
4. Mores — Behavioral (taxes the consumer's conduct and comportment): how they dress, how they treat staff, what they already own, whether they ask the right questions. The environment makes the misaligned self-select out. This is the CONSUMER'S behavior, not the brand's ethics.
5. Tempus — Temporal (taxes time, patience, demonstrated history): open-ended waitlists, relationships measured in years, appointment-only access requiring existing standing. Time cannot be compressed by capital; someone who arrived yesterday with funds has no standing. This is time demanded of the CONSUMER, not the brand's age or heritage by itself.
6. Locus — Geographic (taxes physical presence and willingness to come): one location globally for certain lines, no e-commerce for apex products, the collection in one room in one city. Every digital concession weakens it. This is access-requires-presence, not "made in" provenance.
7. Arcanum — Informational (taxes inside knowledge and prior access): unlisted addresses, non-public collections, releases announced through no channel. You know because someone who already knows told you — so Arcanum presupposes Nexus and makes the stack self-reinforcing. This is information asymmetry as a filter, not trade-secret craft or IP.

STRESS TEST (use to judge structural vs performative on each axis). A filter is weak or performative if any of these is true: it can be cleared by money alone; it depends on a single person's judgment; it is visible enough to be deliberately gamed; clearing it makes another filter significantly easier (shared currency); or it has no managed decay mechanism.

SCORING.
- For each axis, set "type" to "structural", "performative", or "absent", and "score" 1-10 reflecting filter STRENGTH and structural DEPTH, not mere presence. 1-2 = absent or performative; 9-10 = deep, institutionally backed, independent.
- Set "overall_score" 1-10 to the INDEPENDENCE SCORE. This is NOT the average of the seven. Govern it by the law: inaccessibility is only as strong as its weakest independent filter. A brand with seven filters, three clearable by money, effectively has one filter — score it low. Reward genuine cross-axis independence; penalize stacks that share one currency.

SCORE HONESTLY. Most brands cluster on Pecunia and partial Nexus and deserve low overall scores. A famous or beloved brand can and should score low where it is genuinely performative — over-distribution, discounting, thin or borrowed history, public availability. Do not inflate to please. The framework's credibility depends on its willingness to rate a household name a 3. Use the full 1-10 range; do not cluster at 7-9.

VOICE. Precise, analytical, lightly literary. Confident, never flattering, never corporate or hype. Treat the brand as a specimen under examination.

Return ONLY valid JSON in exactly this structure, with no preamble, no markdown, no backticks:
{"brand":"","axes":[{"name":"Pecunia","type":"","score":0,"assessment":""},{"name":"Nexus","type":"","score":0,"assessment":""},{"name":"Habitus","type":"","score":0,"assessment":""},{"name":"Mores","type":"","score":0,"assessment":""},{"name":"Tempus","type":"","score":0,"assessment":""},{"name":"Locus","type":"","score":0,"assessment":""},{"name":"Arcanum","type":"","score":0,"assessment":""}],"overall_score":0,"verdict":"","summary":""}`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── /api/diagnose ────────────────────────────────────────────────────────
    if (url.pathname === '/api/diagnose') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS });
      }
      if (request.method !== 'POST') {
        return json({ error: 'Method not allowed.' }, 405);
      }
      return handleDiagnose(request, env);
    }

    // ── /api/subscribe ───────────────────────────────────────────────────────
    if (url.pathname === '/api/subscribe') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS });
      }
      if (request.method !== 'POST') {
        return json({ error: 'Method not allowed.' }, 405);
      }
      return handleSubscribe(request, env);
    }

    // ── Static assets (all other routes) ────────────────────────────────────
    return env.ASSETS.fetch(request);
  },
};

// ── Gradus Diagnostic ────────────────────────────────────────────────────────

async function handleDiagnose(request, env) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      { error: 'API key not configured. Add ANTHROPIC_API_KEY as a Secret in Workers dashboard → Settings → Variables and Secrets.' },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const brand = (body.brand || '').trim().slice(0, 120);
  if (!brand) {
    return json({ error: 'No brand provided.' }, 400);
  }

  let apiRes;
  try {
    apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1800,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Run the Gradus diagnostic on: ${brand}` }],
      }),
    });
  } catch {
    return json({ error: 'Failed to reach the analysis service. Please try again.' }, 502);
  }

  if (!apiRes.ok) {
    return json({ error: `Analysis service error (${apiRes.status}). Please try again.` }, 502);
  }

  const data = await apiRes.json();
  const raw = (data.content?.[0]?.text || '').trim();
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return new Response(cleaned, {
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ── Email Subscription ───────────────────────────────────────────────────────

async function handleSubscribe(request, env) {
  const apiKey = env.BREVO_API_KEY;
  if (!apiKey) {
    return json({ error: 'Subscription service not configured.' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }

  // Add contact to Brevo
  try {
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({ email, listIds: [6], updateEnabled: true }),
    });

    if (!contactRes.ok) {
      const errData = await contactRes.json().catch(() => ({}));
      // Treat duplicate contact as success (shouldn't happen with updateEnabled, but guard anyway)
      const isDuplicate = contactRes.status === 400 &&
        (errData.code === 'duplicate_parameter' || (errData.message || '').toLowerCase().includes('already'));
      if (!isDuplicate) {
        return json({ error: 'Subscription failed. Please try again.' }, 500);
      }
    }
  } catch {
    return json({ error: 'Subscription failed. Please try again.' }, 502);
  }

  // Send welcome transactional email
  // Fire-and-forget: don't fail the request if this errors
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Harnoor', email: 'connect@harnoorarchive.com' },
        to: [{ email }],
        subject: "You're in.",
        htmlContent: `<!DOCTYPE html><html><body style="margin:0;padding:48px 40px;background:#0A0908;font-family:Georgia,'Times New Roman',serif;"><p style="font-size:16px;line-height:1.8;color:#F0EBE1;margin:0 0 24px;">You'll hear from me when there's something worth reading. That's the only promise.</p><p style="font-size:16px;line-height:1.8;color:#F0EBE1;margin:0;">— Harnoor<br><a href="https://harnoorarchive.com" style="color:#B8935A;text-decoration:none;">harnoorarchive.com</a></p></body></html>`,
        textContent: "You'll hear from me when there's something worth reading. That's the only promise.\n\n— Harnoor\nharnoorarchive.com",
      }),
    });
  } catch {
    // Email send failed silently — contact was still added
  }

  return json({ ok: true });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

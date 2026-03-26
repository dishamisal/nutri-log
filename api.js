/* ─────────────────────────────────────────
   NutriLog — API Module (Groq)
   ───────────────────────────────────────── */

const GROQ_API = "/api/groq";
const MODEL     = "llama-3.3-70b-versatile";
const MAX_TOKENS = 1024;

/* ── Core fetch wrapper ── */

async function callGroq(prompt) {
  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const raw  = data.choices[0].message.content;

  console.log("Raw API response:", raw);

  return extractJSON(raw);
}

function extractJSON(raw) {
  // remove markdown fences if present
  raw = raw.replace(/```json|```/g, "").trim();

  // try direct parse first
  try {
    return JSON.parse(raw);
  } catch {}

  // brace matching (robust extraction)
  let start = raw.indexOf("{");
  if (start === -1) {
    console.error("No JSON found:", raw);
    throw new Error("No JSON found");
  }

  let depth = 0;

  for (let i = start; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    if (raw[i] === "}") depth--;

    if (depth === 0) {
      const candidate = raw.slice(start, i + 1);
      try {
        return JSON.parse(candidate);
      } catch {}
    }
  }

  console.error("Failed to extract valid JSON:", raw);
  throw new Error("Invalid JSON response");
}

/* ── parseMeal(text) ── */

export async function parseMeal(text) {
  const prompt = `You are a nutrition expert. A user has described a meal in plain English.
Analyze it and return ONLY a valid JSON object — no markdown, no explanation, no extra text.

JSON format:
{
  "meal_title": "short descriptive title (max 6 words)",
  "total": {
    "calories": <integer>,
    "protein_g": <integer>,
    "carbs_g": <integer>,
    "fat_g": <integer>
  },
  "items": [
    {
      "name": "food item name",
      "portion": "estimated portion size",
      "calories": <integer>,
      "protein_g": <integer>,
      "carbs_g": <integer>,
      "fat_g": <integer>
    }
  ],
  "note": "one sentence about estimation accuracy or anything notable"
}

Rules:
- Round all numbers to integers
- Use realistic Indian portion sizes when relevant (e.g. 1 roti = 80 kcal, 1 cup dal = 150 kcal)
- If quantity is vague (e.g. "a bowl", "some"), make a reasonable assumption and note it
- The "total" must equal the sum of all items

Meal description: "${text}"`;

  try {
    // const raw    = await callGroq(prompt);
    // const parsed = JSON.parse(raw);
    // return parsed;
    return await callGroq(prompt);
  } catch (e) {
    console.error("parseMeal error:", e);
    throw e;
  }
}

/* ── getDailySummary(meals) ── */

export async function getDailySummary(meals) {
  const mealList = meals.map((m, i) =>
    `${i + 1}. ${m.meal_title} — ${m.total.calories} kcal, ${m.total.protein_g}g protein, ${m.total.carbs_g}g carbs, ${m.total.fat_g}g fat`
  ).join("\n");

  const prompt = `You are a friendly nutrition coach. Here are all the meals a user logged today:

${mealList}

Return ONLY a valid JSON object — no markdown, no explanation.

{
  "summary": "2-3 sentence conversational summary of how their day looked nutritionally",
  "highlights": ["one positive observation", "one thing to watch"],
  "tip": "one practical, specific suggestion for their next meal"
}`;

  try {
    // const raw    = await callGroq(prompt);
    // const parsed = JSON.parse(raw);
    // return parsed;
    return await callGroq(prompt);
  } catch (e) {
    console.error("getDailySummary error:", e);
    throw e;
  }
}
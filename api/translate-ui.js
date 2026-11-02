/**
 * /api/translate-ui.js
 *
 * Vercel Serverless Function (Node.js runtime).
 * Translates the app's static UI string map (English source) into any
 * target language the user picks from the 99-language picker. Called
 * once per language per browser — the frontend caches the result in
 * localStorage so this only runs again if the string set changes.
 *
 * The OpenAI API key is read ONLY from the environment variable OPENAI_API_KEY.
 * It is never sent to, or hard-coded in, the frontend.
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 30000;
const MAX_SOURCE_BYTES = 60 * 1024;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set in environment variables.");
      return res.status(500).json({ error: "Server is not configured (missing API key)." });
    }

    const { lang, langName, source } = req.body || {};

    if (!lang || typeof lang !== "string" || !/^[a-zA-Z-]{2,10}$/.test(lang)) {
      return res.status(400).json({ error: "Invalid or missing lang code." });
    }
    if (!langName || typeof langName !== "string" || langName.length > 60) {
      return res.status(400).json({ error: "Invalid or missing langName." });
    }
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      return res.status(400).json({ error: "Invalid or missing source string map." });
    }

    const sourceJson = JSON.stringify(source);
    if (Buffer.byteLength(sourceJson, "utf8") > MAX_SOURCE_BYTES) {
      return res.status(400).json({ error: "Source string map is too large." });
    }

    const systemPrompt = `You are a professional app localization translator. You will be given a JSON object whose values are short English UI strings (button labels, headings, help text, disclaimers) from a palm-reading / aura-reading mobile web app.

Translate EVERY value into natural, fluent, native-sounding ${langName}, the way a professional native-speaking localizer would write it for a real consumer app — not a literal word-for-word translation.

Rules:
- Return a single JSON object with EXACTLY the same keys as the input, in the same order, with translated values.
- Do not add, remove, or rename any key.
- Do not translate or alter placeholder tokens that look like {something} (e.g. "{min}", "{max}") — keep them exactly as-is within the translated sentence.
- Keep emoji that appear in the source value in roughly the same position.
- If a value is already just emoji or punctuation with no translatable words, return it unchanged.
- Keep each translated value natural and appropriately concise for a UI label or sentence — do not pad or shorten meaning.
- Never wrap the output in markdown code fences and never add commentary. Return raw JSON only.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let openaiResp;
    try {
      openaiResp = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 8000,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: sourceJson },
          ],
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === "AbortError") {
        return res.status(504).json({ error: "The translation service took too long to respond." });
      }
      console.error("Network error calling OpenAI:", fetchErr);
      return res.status(502).json({ error: "Could not reach the translation service." });
    }
    clearTimeout(timeoutId);

    if (!openaiResp.ok) {
      const errText = await safeText(openaiResp);
      console.error("OpenAI API error:", openaiResp.status, errText);
      if (openaiResp.status === 401) {
        return res.status(500).json({ error: "Server authentication with the translation service failed." });
      }
      if (openaiResp.status === 429) {
        return res.status(429).json({ error: "The service is busy right now. Please try again shortly." });
      }
      return res.status(502).json({ error: "The translation service returned an error." });
    }

    const data = await openaiResp.json();
    const rawContent = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (!rawContent) {
      return res.status(502).json({ error: "The translation service returned an empty response." });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error("Failed to parse translation JSON:", parseErr, rawContent);
      return res.status(502).json({ error: "Could not parse the translation result." });
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return res.status(502).json({ error: "Translation result was not a valid object." });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Unhandled error in /api/translate-ui:", err);
    return res.status(500).json({ error: "An unexpected server error occurred." });
  }
};

async function safeText(resp) {
  try {
    return await resp.text();
  } catch (e) {
    return "";
  }
}

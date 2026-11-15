/**
 * /api/analyze.js
 *
 * Vercel Serverless Function (Node.js runtime).
 * Receives a palm image from the frontend, sends it to OpenAI's Vision-capable
 * model (gpt-4o), and returns a structured JSON palmistry reading.
 *
 * The OpenAI API key is read ONLY from the environment variable OPENAI_API_KEY.
 * It is never sent to, or hard-coded in, the frontend.
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o";
const REQUEST_TIMEOUT_MS = 40000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

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

    const { image, hand, language, languageName, topic } = req.body || {};

    if (!image || typeof image !== "string" || !image.startsWith("data:image")) {
      return res.status(400).json({ error: "Invalid or missing image data." });
    }
    if (!["right", "left"].includes(hand)) {
      return res.status(400).json({ error: "Invalid hand value. Expected 'right' or 'left'." });
    }
    const lang = typeof language === "string" && /^[a-zA-Z-]{2,10}$/.test(language) ? language : "ur";
    const langName =
      typeof languageName === "string" && languageName.trim() && languageName.trim().length <= 60
        ? languageName.trim()
        : lang === "ur"
        ? "Urdu"
        : "English";
    const VALID_TOPICS = ["full", "marriage", "health", "fate", "wealth", "personality", "travel", "children", "handFingers", "marks", "mounts", "heartLine", "lifeLine", "headLine", "fame", "bracelets"];
    const focusTopic = VALID_TOPICS.includes(topic) ? topic : "full";

    const approxBytes = Math.ceil((image.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return res.status(400).json({ error: "Image is too large. Please upload an image under 8 MB." });
    }

    const systemPrompt = buildSystemPrompt(lang, langName, hand, focusTopic);

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
          max_tokens: 4000,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    lang === "ur"
                      ? "منسلک تصویر کا تجزیہ کریں اور صرف بیان کردہ JSON فارمیٹ میں جواب دیں۔ یاد رہے: ہر value، چاہے وہ کتنی ہی مختصر ہو (جیسے 'موجود نہیں'، 'سیدھی'، 'درمیانہ')، اردو میں لکھیں — کوئی بھی انگریزی لفظ استعمال نہ کریں سوائے JSON کیز کے۔"
                      : `Analyze the attached image and respond ONLY in the specified JSON format, writing every text value in natural ${langName}.`,
                },
                { type: "image_url", image_url: { url: image, detail: "high" } },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === "AbortError") {
        return res.status(504).json({ error: "The vision model took too long to respond. Please try again." });
      }
      console.error("Network error calling OpenAI:", fetchErr);
      return res.status(502).json({ error: "Could not reach the analysis service. Please try again." });
    }
    clearTimeout(timeoutId);

    if (!openaiResp.ok) {
      const errText = await safeText(openaiResp);
      console.error("OpenAI API error:", openaiResp.status, errText);
      if (openaiResp.status === 401) {
        return res.status(500).json({ error: "Server authentication with the analysis service failed." });
      }
      if (openaiResp.status === 429) {
        return res.status(429).json({ error: "The service is busy right now. Please try again shortly." });
      }
      return res.status(502).json({ error: "The analysis service returned an error. Please try again." });
    }

    const data = await openaiResp.json();
    const rawContent = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

    if (!rawContent) {
      return res.status(502).json({ error: "The analysis service returned an empty response." });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error("Failed to parse model JSON:", parseErr, rawContent);
      return res.status(502).json({ error: "Could not parse the analysis result. Please try again." });
    }

    parsed.life_timeline = computeLifeTimeline(parsed, lang);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Unhandled error in /api/analyze:", err);
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

/**
 * Derives the five "life_timeline" age estimates from the heart_line/
 * fate_line "length_category"/"depth_category" judgments the model
 * already reported for THIS photo, instead of trusting the model's own
 * free-text age guess (which converged on the same handful of "common"
 * palmistry numbers for almost every photo) and instead of raw x/y pixel
 * coordinates (which turned out too noisy between photos/calls of the
 * same hand — a small coordinate wobble could swing an age by 8+ years).
 * A 3-way category judgment ("is this line Short/Medium/Long?") is a much
 * coarser, more stable classification for a vision model to repeat
 * consistently than a continuous coordinate estimate, so the same hand
 * should now land on the same (or an adjacent) age band reliably, while
 * two genuinely different hands still land on different bands.
 */
function computeLifeTimeline(parsed, lang) {
  const empty = { partner_meeting_age: "", best_relationship_ages: "", marriage_age: "", first_child_age: "", prosperity_age: "" };
  if (!parsed || typeof parsed !== "object") return empty;

  const LENGTH_IDX = { short: 0, medium: 1, long: 2 };
  const DEPTH_IDX = { faint: 0, medium: 1, deep: 2 };
  const isConfident = (line) => line && typeof line.confidence === "string" && line.confidence.toLowerCase() !== "not visible";
  const categoryScore = (line) => {
    if (!line) return null;
    const lIdx = LENGTH_IDX[String(line.length_category || "").toLowerCase()];
    const dIdx = DEPTH_IDX[String(line.depth_category || "").toLowerCase()];
    if (lIdx === undefined || dIdx === undefined) return null;
    return { lIdx, dIdx, combined: lIdx * 3 + dIdx }; // combined: 0 (short+faint) .. 8 (long+deep)
  };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const mapRange = (v, inMin, inMax, outMin, outMax) => {
    const t = clamp((v - inMin) / (inMax - inMin), 0, 1);
    return outMin + t * (outMax - outMin);
  };

  const heartLine = parsed.heart_line;
  const fateLine = parsed.fate_line;
  const heartScore = isConfident(heartLine) ? categoryScore(heartLine) : null;
  const fateScore = isConfident(fateLine) ? categoryScore(fateLine) : null;

  let partnerAge = null;
  let marriageAge = null;
  let relAge1 = null;
  let relAge2 = null;
  let childAge = null;
  let prosperityAge = null;

  if (heartScore) {
    partnerAge = Math.round(mapRange(heartScore.combined, 0, 8, 32, 19));
    marriageAge = Math.round(mapRange(heartScore.combined, 0, 8, 36, 23));
    if (marriageAge <= partnerAge) marriageAge = partnerAge + 2;

    relAge1 = clamp(partnerAge + 2 + heartScore.dIdx, 19, 40);
    relAge2 = clamp(relAge1 + 3 + heartScore.lIdx, 20, 45);

    const fateContribution = fateScore ? fateScore.lIdx : heartScore.lIdx;
    childAge = clamp(marriageAge + 2 + fateContribution, 20, 42);
  }

  if (fateScore) {
    prosperityAge = Math.round(mapRange(fateScore.combined, 0, 8, 29, 47));
  }

  const fmtAge = (n) => (lang === "ur" ? `تقریباً ${n} سال میں` : `around age ${n}`);
  const fmtAgePair = (a, b) =>
    a === b ? fmtAge(a) : lang === "ur" ? `تقریباً ${a} اور ${b} سال میں` : `around ${a} and ${b}`;

  return {
    partner_meeting_age: partnerAge !== null ? fmtAge(partnerAge) : "",
    best_relationship_ages: relAge1 !== null && relAge2 !== null ? fmtAgePair(relAge1, relAge2) : "",
    marriage_age: marriageAge !== null ? fmtAge(marriageAge) : "",
    first_child_age: childAge !== null ? fmtAge(childAge) : "",
    prosperity_age: prosperityAge !== null ? fmtAge(prosperityAge) : "",
  };
}

/**
 * Builds the system prompt sent to the vision model. Encodes the
 * traditional-only framing, mandatory disclaimers, confidence levels,
 * no-hallucination rule, and the structured JSON output contract
 * (including normalized 0-1 coordinates for the on-image annotation
 * overlay). The Urdu-language instruction is deliberately strict and
 * repeated so that short field values (e.g. "None", "Straight",
 * "Present") are translated too, not just the longer prose fields.
 */
function buildSystemPrompt(lang, langName, hand, focusTopic) {
  const langInstruction =
    lang === "ur"
      ? `Write EVERY human-readable text value in the JSON in clear, natural Urdu — with NO exceptions. This includes not just long interpretation/description/meaning fields, but also every short value such as: start, end, length, depth, shape, breaks, branches, forks, islands, crosses, chains, relation_to_other_lines, level, thickness, spacing, location, type, status, message. For example, instead of "None" write "موجود نہیں", instead of "Straight" write "سیدھی", instead of "Curved" write "خم دار", instead of "Slightly Curved" write "قدرے خم دار", instead of "Present" write "موجود", instead of "Few" write "چند", instead of "Joined with Life Line" write "لائف لائن کے ساتھ ملی ہوئی", instead of "Between Thumb and Index Finger" write "انگوٹھے اور شہادت کی انگلی کے درمیان", instead of "Near Wrist" write "کلائی کے قریب", instead of "Long" write "لمبی", instead of "Deep" write "گہری", instead of "Under Ring Finger" write "انگوٹھی والی انگلی کے نیچے", instead of "Not clearly visible" write "تصویر میں واضح طور پر نظر نہیں آ رہی". The ONLY things that should remain in English/Latin script are: the JSON keys themselves (e.g. "heart_line", "confidence"), the confidence enum values which must stay exactly "High"/"Medium"/"Low"/"Not visible", the heart_line/fate_line length_category value ("Short"/"Medium"/"Long") and depth_category value ("Faint"/"Medium"/"Deep"), the image_quality.status value ("good"/"poor"), the hand_type.type value (keep as "Earth Hand"/"Fire Hand"/"Air Hand"/"Water Hand"/"Mixed Type"), the mounts level value ("low"/"normal"/"developed"/"prominent"), and the special_marks.type value (keep as "Star"/"Cross"/"Triangle"/etc). Every other piece of text must be Urdu.

MANDATORY FINAL SELF-CHECK (do this before you output anything): once you have drafted the JSON in your head, re-scan every single value you are about to write. If any value — however short — contains an English word or phrase that is not one of the specific enum values listed above, rewrite that value in Urdu before including it in your response. Do not submit a value like "Not clearly visible", "Between Thumb and Index Finger", "Slightly Curved", or any similar English phrase; every one of those must be Urdu text instead.

CRITICAL — SIMPLE, EXPLAINED LANGUAGE FOR ALL INTERPRETATION/MEANING FIELDS: Every field that carries a traditional interpretation (interpretation, meaning, description on lines/fingers/mounts/secondary_lines/marriage/children, and every value inside personality/career/relationships/wealth) must be a full, easy-to-understand Urdu SENTENCE for an ordinary reader who has no background in palmistry — never a bare word or short technical label. Explain what the trait actually means in plain, everyday language, the way you'd explain it to a friend, in roughly 12-25 Urdu words. For example, instead of "متوازن" write "آپ محبت میں نہ بہت زیادہ جذباتی ہیں اور نہ بالکل سرد — دل اور دماغ دونوں سے کام لیتے ہیں، اور رشتوں کو سمجھداری سے نبھاتے ہیں۔"; instead of "مضبوط" (for leadership) write "آپ میں فطری قائدانہ صلاحیت ہے — لوگ آپ کی بات پر بھروسہ کرتے ہیں اور آپ ذمہ داری لینے سے نہیں گھبراتے۔"; instead of "اچھا" (for communication) write "آپ اپنی بات واضح اور مؤثر انداز میں پہنچا لیتے ہیں، اور دوسروں کی بات بھی توجہ سے سنتے ہیں۔". Apply this same rule to every personality/career/relationships/wealth value, every line's "interpretation" field, every finger/mount/secondary-line "meaning"/"description" field, and the marriage/children interpretation fields — none of them should ever be a single word or short label; each must be a short, warm, explained sentence.`
      : `Write EVERY human-readable text value in the JSON in clear, natural, fluent ${langName} — with NO exceptions. This includes not just long interpretation/description/meaning fields, but also every short value such as: start, end, length, depth, shape, breaks, branches, forks, islands, crosses, chains, relation_to_other_lines, level, thickness, spacing, location, type, status, message. Do not leave any value in English unless ${langName} IS English. The ONLY things that must stay in English/Latin script regardless of the target language are: the JSON keys themselves (e.g. "heart_line", "confidence"), the confidence enum values which must stay exactly "High"/"Medium"/"Low"/"Not visible", the heart_line/fate_line length_category value ("Short"/"Medium"/"Long") and depth_category value ("Faint"/"Medium"/"Deep"), the image_quality.status value ("good"/"poor"), the hand_type.type value (keep as "Earth Hand"/"Fire Hand"/"Air Hand"/"Water Hand"/"Mixed Type"), the mounts level value ("low"/"normal"/"developed"/"prominent"), and the special_marks.type value (keep as "Star"/"Cross"/"Triangle"/etc). Every other piece of text must be in ${langName}.

MANDATORY FINAL SELF-CHECK (do this before you output anything): once you have drafted the JSON in your head, re-scan every single value you are about to write. If any value — however short — is not in ${langName} and is not one of the specific enum values listed above, rewrite that value in ${langName} before including it in your response.

CRITICAL — SIMPLE, EXPLAINED LANGUAGE FOR ALL INTERPRETATION/MEANING FIELDS: Every field that carries a traditional interpretation (interpretation, meaning, description on lines/fingers/mounts/secondary_lines/marriage/children, and every value inside personality/career/relationships/wealth) must be a full, easy-to-understand SENTENCE in ${langName} for an ordinary reader who has no background in palmistry — never a bare word or short technical label. Explain what the trait actually means in plain, everyday language, the way you'd explain it to a friend, in roughly 15-30 words. Apply this same rule to every personality/career/relationships/wealth value, every line's "interpretation" field, every finger/mount/secondary-line "meaning"/"description" field, and the marriage/children interpretation fields — none of them should ever be a single word or short label; each must be a short, warm, explained sentence.`;

  const TOPIC_LABELS_UR = {
    marriage: "شادی اور محبت (Heart Line، marriage_lines، relationships)",
    health: "صحت کا روایتی رجحان (Life Line، health_line)",
    fate: "قسمت اور کیریئر (Fate Line، Head Line، career)",
    wealth: "مالی معاملات (wealth)",
    personality: "مجموعی شخصیت (personality، hand_type)",
    travel: "سفر کا روایتی رجحان (secondary_lines.travel_lines)",
    children: "اولاد سے متعلق روایتی تشریح (children)",
    handFingers: "ہاتھ کی قسم اور انگلیوں/انگوٹھے کی ساخت (hand_type، fingers، thumb)",
    marks: "خاص نشانات (special_marks)",
    mounts: "Mounts/ابھار (mounts)",
    heartLine: "صرف لکیرِ دل (heart_line)",
    lifeLine: "صرف لکیرِ حیات (life_line)",
    headLine: "صرف لکیرِ دماغ (head_line)",
    fame: "شہرت اور کامیابی کا روایتی رجحان (secondary_lines.sun_line)",
    bracelets: "کلائی کی کنگن لکیریں (secondary_lines.bracelets)",
  };
  const TOPIC_LABELS_EN = {
    marriage: "marriage and love (heart_line, marriage_lines, relationships)",
    health: "traditional health tendency (life_line, health_line)",
    fate: "fate and career (fate_line, head_line, career)",
    wealth: "money and wealth (wealth)",
    personality: "overall personality (personality, hand_type)",
    travel: "traditional travel tendency (secondary_lines.travel_lines)",
    children: "traditional interpretation about children (children)",
    handFingers: "hand shape and fingers/thumb structure (hand_type, fingers, thumb)",
    marks: "special marks (special_marks)",
    mounts: "mounts (mounts)",
    heartLine: "just the Heart Line (heart_line)",
    lifeLine: "just the Life Line (life_line)",
    headLine: "just the Head Line (head_line)",
    fame: "traditional fame and success tendency (secondary_lines.sun_line)",
    bracelets: "bracelet/wrist lines (secondary_lines.bracelets)",
  };
  const focusInstruction =
    focusTopic && focusTopic !== "full"
      ? lang === "ur"
        ? `\n\nFOCUS TOPIC: The user specifically wants to know about: ${TOPIC_LABELS_UR[focusTopic]}. Still fill in the complete JSON structure (the frontend needs it for the annotated image and consistency), but give exceptionally rich, detailed, warm, well-explained Urdu interpretation (aim for 40-70 Urdu words, several sentences) for the field(s) tied to this topic. Every other field can stay brief (a short accurate sentence is enough) since the user is not focused on those right now.`
        : `\n\nFOCUS TOPIC: The user specifically wants to know about: ${TOPIC_LABELS_EN[focusTopic]}. Still fill in the complete JSON structure (the frontend needs it for the annotated image and consistency), but give exceptionally rich, detailed, well-explained interpretation in ${langName} (aim for 40-70 words, several sentences) for the field(s) tied to this topic. Every other field can stay brief since the user is not focused on those right now.`
      : "";

  return `You are a careful, traditional palmistry (hand-reading) analyst working from a single photo of a ${hand} hand.${focusInstruction}

CRITICAL FRAMING:
- Palmistry is a traditional / cultural / entertainment practice. It is NOT medical diagnosis and NOT scientifically validated prediction of the future.
- Never state or imply a guaranteed future event, a medical diagnosis, a death age, fertility status, the number or gender of future children, or guaranteed financial outcomes. Where the user's traditional framework asks about these (marriage lines, children lines, wealth), give only general traditional-interpretation language and explicitly note in the relevant field that palmistry cannot scientifically determine these things.
- ${langInstruction}

CAREFUL, LITERAL VISUAL OBSERVATION — SCAN EACH LINE ONE AT A TIME, DO NOT GENERALIZE:
Before writing anything, go through this exact process for EACH of the four major lines (heart_line, head_line, life_line, fate_line) separately, one at a time:
1. Locate that specific line in the photo — trace it visually with your eyes from one end to the other.
2. Note where it genuinely starts and ends relative to the fingers, thumb, and wrist in THIS photo.
3. Look closely at its actual shape along its length — is it really straight, or does it curve, and where exactly does any curve happen?
4. Judge its actual depth/clarity as it appears in this image — deep and dark, faint, or somewhere between.
5. Look for actual breaks, branches, forks, islands, crosses, or chains ON THAT SPECIFIC LINE — do not report any of these unless you can actually see them on it.
6. Note how it actually sits relative to the other three lines you can see (crossing, parallel, joined, etc.) in this specific hand.
Only after completing this per-line scan should you write that line's fields — and every factual field (start, end, length, depth, shape, breaks, branches, forks, islands, crosses, chains, relation_to_other_lines, thickness, spacing, level) must describe what you scanned in THIS particular photo, never a generic textbook answer that could apply to any hand. If two different photos would plausibly get the same boilerplate answer for a field, you have not looked closely enough — go back and find what actually distinguishes this specific line in this specific hand. Where something is genuinely ambiguous or partially obscured after this scan, say so honestly and lower the confidence rather than defaulting to a common answer like "Straight" or "Medium".

IMAGE QUALITY CHECK (do this first):
Assess whether the palm is fully visible, in focus, reasonably lit, not cropped at the fingers, and whether the major lines are visible at all. If the image is blurry, too far away, poorly lit, cropped, or the palm is not clearly the subject, set "image_quality.status" to "poor", explain the specific issue(s) in "image_quality.message" (in the target language, friendly and actionable), and you may leave other fields minimal/empty. Otherwise set "image_quality.status" to "good".

NO HALLUCINATION — CONFIDENCE IS MANDATORY:
For every observation, include a "confidence" value: one of "High", "Medium", "Low", or "Not visible" (these four enum values stay in English exactly as written, even when the rest of the content is in Urdu). If a feature is not clearly visible in the photo, do NOT invent it — say so explicitly with confidence "Not visible".

START/END POINT MARKERS — TWO POINTS PER LINE, NOT A FULL TRACE:
For each of the four major lines (heart_line, head_line, life_line, fate_line), identify only its two endpoints in the photo — where it visibly starts and where it visibly ends — NOT the path in between. This is a much simpler, more reliable task than tracing the whole line, so take real care to be accurate here. For each line, if you can clearly see both endpoints, add a "start_point":{"x":0-1,"y":0-1} and "end_point":{"x":0-1,"y":0-1} (normalized to image width/height, x left-to-right, y top-to-bottom) placed exactly on the crease at that endpoint — not a rough guess nearby. Double-check: does this (x,y) genuinely sit on the visible crease at its start/end, not just in the general area? Only include start_point/end_point for a line if you are genuinely confident about BOTH locations; if you are not confident about either one, omit both fields for that line entirely rather than guessing — a missing marker is far better than a wrongly-placed one.

LENGTH/DEPTH CATEGORY — A DELIBERATELY SIMPLE, CONSISTENT JUDGMENT FOR heart_line AND fate_line:
For "heart_line" and "fate_line" ONLY, also fill "length_category" and "depth_category" with exactly one of the listed enum words (these stay in English exactly as written, like the confidence values). Judge these RELATIVE TO THE WHOLE VISIBLE PALM (proportion of the palm it crosses), never as an absolute pixel distance — this way your answer stays the same for the same hand even if the photo is zoomed in/out or cropped slightly differently.
- "length_category": "Short" (ends well before reaching under the ring/little finger area), "Medium" (reaches roughly under the ring finger), or "Long" (reaches all the way to the outer edge of the palm, under the little finger).
- "depth_category": "Faint" (thin, pale, hard to make out), "Medium" (clearly visible but unremarkable), or "Deep" (dark, bold, clearly carved-looking).
Give your honest, careful best judgment — do not default to "Medium" for both out of caution; really look and pick whichever of the three genuinely matches what you see. If the line is not confidently visible at all, you may still give your best-guess category, since "confidence" already separately records how sure you are.

"LIFE TIMELINE" FIELD — DO NOT FILL THIS YOURSELF:
Leave every field inside "life_timeline" as an empty string (""). The app calculates these age estimates itself, afterwards, directly from the "length_category"/"depth_category" you set for heart_line and fate_line above — it deliberately does not use any age you might write here, so do not spend effort guessing ages for this object. Just make sure heart_line and fate_line each get an accurate length_category/depth_category (per the instructions above) whenever you are confident about them, since the timeline ages depend entirely on those two judgments being right and consistent for this specific hand.

CHILDREN FIELD — BE CONCRETE ABOUT WHAT YOU SAW, NOT JUST A REASSURING PLATITUDE:
Traditional palmistry reads "children lines" as small, fine vertical lines rising from the marriage line(s) on the outer edge of the palm, under the little finger. For the "children" object:
- "signs": describe, in one concrete sentence, what you can actually see in THIS photo relevant to this — e.g. whether fine vertical lines are visible rising from a marriage line, how many look present, how clear/faint they are, or that they are not clearly visible at this image resolution. This is a visual observation, like the other line fields — never state an exact count as a certain fact, but you may describe the traditional impression (e.g. "ایک واضح اور ایک قدرے مدھم لکیر نظر آتی ہے" = "one clear and one fainter line is visible").
- "interpretation": building on "signs", a warm, specific 20-35 word sentence about the traditional emotional/relational theme this suggests for this person's bond with children — avoid generic filler like "happiness and love" alone; tie it to something from "signs" or to the marriage_lines/heart_line context already described elsewhere in this reading.
- "disclaimer": as before, state plainly that palmistry cannot scientifically determine the actual number or gender of children.
Never state or imply a definite count — "signs" describes the visual impression, "interpretation" the traditional emotional theme, not a headcount.

OUTPUT FORMAT:
Respond with ONLY a single JSON object (no markdown fences, no commentary) matching this exact shape:

{
  "image_quality": { "status": "good|poor", "message": "" },
  "hand_type": { "type": "Earth Hand|Fire Hand|Air Hand|Water Hand|Mixed Type", "description": "", "confidence": "" },
  "fingers": {
    "thumb": { "length":"", "thickness":"", "shape":"", "spacing":"", "meaning":"", "confidence":"" },
    "index": { "length":"", "thickness":"", "shape":"", "spacing":"", "meaning":"", "confidence":"" },
    "middle": { "length":"", "thickness":"", "shape":"", "spacing":"", "meaning":"", "confidence":"" },
    "ring": { "length":"", "thickness":"", "shape":"", "spacing":"", "meaning":"", "confidence":"" },
    "little": { "length":"", "thickness":"", "shape":"", "spacing":"", "meaning":"", "confidence":"" }
  },
  "thumb": { "length":"", "width":"", "flexibility":"", "upper_phalanx":"", "lower_phalanx":"", "meaning":"", "confidence":"" },
  "heart_line": { "start":"", "end":"", "length":"", "depth":"", "shape":"", "breaks":"", "branches":"", "forks":"", "islands":"", "crosses":"", "chains":"", "relation_to_other_lines":"", "interpretation":"", "confidence":"", "length_category":"Short|Medium|Long", "depth_category":"Faint|Medium|Deep", "start_point":{"x":0.0,"y":0.0}, "end_point":{"x":0.0,"y":0.0} },
  "head_line": { "start":"", "end":"", "length":"", "depth":"", "shape":"", "breaks":"", "branches":"", "forks":"", "islands":"", "crosses":"", "chains":"", "relation_to_other_lines":"", "interpretation":"", "confidence":"", "start_point":{"x":0.0,"y":0.0}, "end_point":{"x":0.0,"y":0.0} },
  "life_line": { "start":"", "end":"", "length":"", "depth":"", "shape":"", "breaks":"", "branches":"", "forks":"", "islands":"", "crosses":"", "chains":"", "relation_to_other_lines":"", "interpretation":"", "confidence":"", "start_point":{"x":0.0,"y":0.0}, "end_point":{"x":0.0,"y":0.0} },
  "fate_line": { "start":"", "end":"", "length":"", "depth":"", "shape":"", "breaks":"", "branches":"", "forks":"", "islands":"", "crosses":"", "chains":"", "relation_to_other_lines":"", "interpretation":"", "confidence":"", "length_category":"Short|Medium|Long", "depth_category":"Faint|Medium|Deep", "start_point":{"x":0.0,"y":0.0}, "end_point":{"x":0.0,"y":0.0} },
  "secondary_lines": {
    "sun_line": { "description":"", "confidence":"" },
    "health_line": { "description":"", "confidence":"" },
    "marriage_lines": { "description":"", "confidence":"" },
    "travel_lines": { "description":"", "confidence":"" },
    "influence_lines": { "description":"", "confidence":"" },
    "bracelets": { "description":"", "confidence":"" }
  },
  "mounts": {
    "jupiter": { "level":"low|normal|developed|prominent", "meaning":"", "confidence":"" },
    "saturn": { "level":"", "meaning":"", "confidence":"" },
    "apollo": { "level":"", "meaning":"", "confidence":"" },
    "mercury": { "level":"", "meaning":"", "confidence":"" },
    "venus": { "level":"", "meaning":"", "confidence":"" },
    "moon": { "level":"", "meaning":"", "confidence":"" },
    "upper_mars": { "level":"", "meaning":"", "confidence":"" },
    "lower_mars": { "level":"", "meaning":"", "confidence":"" },
    "plain_of_mars": { "level":"", "meaning":"", "confidence":"" }
  },
  "special_marks": [ { "type":"Star|Cross|Triangle|Square|Island|Circle|Trident|Fork|Grille|Vertical line|Horizontal line", "location":"", "meaning":"", "confidence":"" } ],
  "marriage": { "lines_count":"", "description":"", "shape":"", "forks_breaks":"", "confidence":"" },
  "children": { "signs":"", "interpretation":"", "disclaimer":"" },
  "personality": { "confidence_trait":"", "communication":"", "emotional_style":"", "decision_making":"", "creativity":"", "leadership":"" },
  "career": { "tendencies":"", "leadership":"", "business_tendency":"", "communication_work":"", "creative_work":"", "stability_vs_change":"" },
  "relationships": { "emotional_nature":"", "attachment_style":"", "communication":"", "tendencies":"" },
  "wealth": { "financial_tendencies":"", "stability":"", "risk_taking":"", "business_inclination":"" },
  "life_timeline": { "partner_meeting_age":"", "best_relationship_ages":"", "marriage_age":"", "first_child_age":"", "prosperity_age":"" },
  "disclaimer": ""
}

The "disclaimer" field must always be filled with a clear statement (in the target language) that this reading is a traditional/entertainment interpretation only, is not scientific, and cannot guarantee predictions about death, fertility, number/gender of children, disease diagnosis, or financial outcomes.

Never wrap the JSON in markdown code fences. Return raw JSON only.`;
}

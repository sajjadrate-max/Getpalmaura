#!/usr/bin/env node
/**
 * Generates one lightweight, crawlable SEO landing page per supported
 * UI language, at /<code>/index.html (e.g. /hi/index.html, /ar/index.html).
 *
 * Why: the main app (index.html) is a single URL whose language is
 * switched client-side via JavaScript, so Google only ever sees one
 * language's content in the raw HTML — it has no separate URL per
 * language to index. These landing pages give each of the 99 supported
 * languages its own real, indexable URL with translated <title>/
 * <meta description>/OG tags, a short genuinely-translated intro
 * paragraph (not boilerplate), and full hreflang cross-linking to every
 * other language variant + x-default, then link into the actual app
 * with that language pre-selected (?lang=<code>, see index.html's
 * initLang()).
 *
 * Source of truth for the language list is index.html's own LANGUAGES
 * array (extracted here, not duplicated by hand) so this can never
 * drift out of sync with the app's real supported-language list.
 * Per-language title/description/intro copy lives in
 * scripts/seo-lang-content.json.
 *
 * Usage: node scripts/generate-lang-pages.js
 * (Re-run any time LANGUAGES or seo-lang-content.json changes; it
 * fully regenerates every /<code>/index.html file.)
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_URL = "https://getpalmaura.com";

function loadLanguages() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const m = html.match(/const LANGUAGES = (\[[\s\S]*?\n\]);/);
  if (!m) throw new Error("Could not find LANGUAGES array in index.html");
  // eslint-disable-next-line no-eval
  return eval(m[1]);
}

function loadContent() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "seo-lang-content.json"), "utf8"));
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHreflangBlock(languages) {
  const lines = languages.map(
    (l) => `<link rel="alternate" hreflang="${l.code}" href="${SITE_URL}/${l.code}/">`
  );
  lines.push(`<link rel="alternate" hreflang="x-default" href="${SITE_URL}/">`);
  return lines.join("\n");
}

function buildPage(lang, content, hreflangBlock) {
  const c = content[lang.code];
  const title = escapeHtml(c.title);
  const description = escapeHtml(c.description);
  const heading = escapeHtml(c.heading);
  const intro = escapeHtml(c.intro);
  const cta = escapeHtml(c.cta);
  const home = escapeHtml(c.home);
  const disclaimer = escapeHtml(c.disclaimer);
  const whatTitle = escapeHtml(c.whatTitle);
  const what = escapeHtml(c.what);
  const howTitle = escapeHtml(c.howTitle);
  const how = escapeHtml(c.how);
  const linesTitle = escapeHtml(c.linesTitle);
  const lines = escapeHtml(c.lines);
  const privacyTitle = escapeHtml(c.privacyTitle);
  const privacy = escapeHtml(c.privacy);
  const faqTitle = escapeHtml(c.faqTitle);
  const url = `${SITE_URL}/${lang.code}/`;

  const faqHtml = c.faq
    .map((pair) => `<h3>${escapeHtml(pair.q)}</h3>\n<p>${escapeHtml(pair.a)}</p>`)
    .join("\n");

  const faqSchemaEntities = c.faq.map((pair) => ({
    "@type": "Question",
    name: pair.q,
    acceptedAnswer: { "@type": "Answer", text: pair.a },
  }));
  const jsonLd = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "GetPalmAura",
      url,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      inLanguage: lang.code,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqSchemaEntities,
    },
  ]);

  return `<!DOCTYPE html>
<html lang="${lang.code}" dir="${c.dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="/ga.js"></script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9829612219556114" crossorigin="anonymous"></script>
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="GetPalmAura">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${SITE_URL}/icon-512.png">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${SITE_URL}/icon-512.png">
<link rel="icon" href="/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Noto+Nastaliq+Urdu:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/site.css">
${hreflangBlock}
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<header class="site-header"><div class="wrap">
  <a class="brand notranslate" translate="no" href="/"><img src="/icon-192.png" alt="" width="34" height="34">GetPalmAura</a>
  <nav class="pills"><a href="/">${home}</a></nav>
</div></header>
<main class="wrap">
<div class="card">
<h1>${heading}</h1>
<p>${intro}</p>
<p><a href="/?lang=${lang.code}" style="display:inline-block;margin-top:10px;padding:12px 26px;border-radius:999px;background:linear-gradient(180deg,var(--gold-bright),var(--gold));color:#1a1305;font-weight:700;text-decoration:none;">${cta}</a></p>

<h2>${whatTitle}</h2>
<p>${what}</p>

<h2>${howTitle}</h2>
<p>${how}</p>

<h2>${linesTitle}</h2>
<p>${lines}</p>

<h2>${privacyTitle}</h2>
<p>${privacy}</p>

<div class="note">${disclaimer}</div>

<h2>${faqTitle}</h2>
${faqHtml}
</div>
</main>
</body>
</html>
`;
}

function main() {
  const languages = loadLanguages();
  const content = loadContent();
  const hreflangBlock = buildHreflangBlock(languages);

  let written = 0;
  for (const lang of languages) {
    if (!content[lang.code]) {
      throw new Error(`Missing seo-lang-content.json entry for language code "${lang.code}"`);
    }
    const dir = path.join(ROOT, lang.code);
    fs.mkdirSync(dir, { recursive: true });
    const html = buildPage(lang, content, hreflangBlock);
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
    written++;
  }
  console.log(`Generated ${written} language landing pages.`);
}

main();

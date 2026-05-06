#!/usr/bin/env bash
# One iteration of the auto-article loop.
#
# Picks the next topic from state/topic-queue.txt, researches it via
# DataForSEO + WebFetch, asks a cheap OpenRouter model to write the article,
# rebuilds the static site, pushes to GitHub Pages, takes a headless-Chrome
# screenshot and posts to SimpleMessage.
#
# Designed to run from the project root.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT=$(pwd)
source ~/.env
SM_KEY=$(jq -r .apiKey ~/.config/simplemessage-mcp/config.json)
SITE_URL="https://nichtagentur.github.io/sustainable-experiential-design"
MODEL="${IMAGE_MODEL:-google/gemini-2.5-flash-lite}"
LOG="$ROOT/state/run-$(date +%s).log"
exec > >(tee -a "$LOG") 2>&1

echo "=== iteration $(date -Is) ==="

# -----------------------------------------------------------------------------
# 1) Pick next topic
# -----------------------------------------------------------------------------
QUEUE="$ROOT/state/topic-queue.txt"
DONE="$ROOT/state/topics-done.txt"
touch "$DONE"

next_topic=""
while IFS= read -r line; do
  [ -z "$line" ] && continue
  slug="${line%%|*}"
  if ! grep -qFx "$slug" "$DONE"; then
    next_topic="$line"
    break
  fi
done < "$QUEUE"

if [ -z "$next_topic" ]; then
  echo "all topics done — stopping"
  exit 0
fi

SLUG="${next_topic%%|*}"
HINT="${next_topic#*|}"
echo "topic: $SLUG"
echo "hint:  $HINT"

# -----------------------------------------------------------------------------
# 2) Research — DataForSEO SERP + WebFetch top result + papertown.at scrape
# -----------------------------------------------------------------------------
SEARCH_QUERIES=(
  "$HINT"
  "papertown philipp blume living paper"
  "site:linkedin.com $HINT papertown"
)

RES_FILE="$ROOT/state/research-$SLUG.json"
echo "[]" > "$RES_FILE"

for q in "${SEARCH_QUERIES[@]}"; do
  echo "  searching: $q"
  curl -s -m 15 -u "$DATAFORSEO_LOGIN:$DATAFORSEO_PASSWORD" \
    -H "Content-Type: application/json" \
    -d '[{"keyword":"'"${q//\"/\\\"}"'","location_code":2040,"language_code":"de","device":"desktop"}]' \
    https://api.dataforseo.com/v3/serp/google/organic/live/advanced 2>/dev/null \
    | jq -c --arg q "$q" '.tasks[0].result[0].items[]? | select(.type=="organic") | {q:$q, title, url, snippet:(.description // "")}' 2>/dev/null \
    | head -3 >> "$RES_FILE.tmp" || true
done
# JSON-array-ify
echo "[" > "$RES_FILE"
sed 's/$/,/' "$RES_FILE.tmp" 2>/dev/null | sed '$ s/,$//' >> "$RES_FILE" || true
echo "]" >> "$RES_FILE"
rm -f "$RES_FILE.tmp"

# Also fetch papertown.at homepage as primary reference
PAPERTOWN_TXT=""
if curl -s -m 10 -L "https://papertown.at" 2>/dev/null | sed -e 's/<[^>]*>//g' -e '/^$/d' | head -120 > "$ROOT/state/papertown.txt"; then
  PAPERTOWN_TXT=$(head -80 "$ROOT/state/papertown.txt")
fi

RESEARCH_BLOB=$(cat "$RES_FILE" | jq -c '.[] | select(.title != null)' 2>/dev/null | head -8 | jq -s . 2>/dev/null || echo "[]")

# -----------------------------------------------------------------------------
# 3) Ask OpenRouter to write the article
# -----------------------------------------------------------------------------
SYSTEM_PROMPT='You are a senior experiential designer (working name: Philipp Blume of Papertown studio in Vienna). You write practitioner-voiced articles for the "Honest Builds" blog about experiential design with sustainable materials. Your tone is editorial, opinionated, specific, and humble about your own past mistakes (e.g. the LIVING PAPER 2014 origami stage at Republic Salzburg, which used hot-melt glue and ended in a skip).

Rules:
- 700 to 1100 words.
- Output strictly in this format:
---
slug: <use the provided slug>
title: <a clear, specific, descriptive title — no clickbait, no question marks unless rhetorical>
description: <one-sentence meta description, 140-160 chars, that summarises the article>
date: 2026-05-06
author: philipp-blume
hero: hero-default.webp
hero_alt: <alt text for the hero image, one sentence>
tags:
  - sustainable materials
  - experiential design
  - <two more relevant tags, lowercase>
---

# <article H1, same as title>

<article body in markdown — 4 to 6 H2 sections; concrete numbers where possible (kg/m², EUR/m², lead times); mention LIVING PAPER 2014 once if relevant; cite at least two external sources by name (e.g. "EU Circular Economy Action Plan", "Ellen MacArthur Foundation Circular Design Guide"); end with a "Further reading" section listing 3-5 sources>

---

*This article is part of the Honest Builds series. Other entries: [The Honest Materials](./honest-materials-sustainable-substrates.html), [Designing for Disassembly](./designing-for-disassembly-workflow.html), [Five Reuse Patterns](./five-reuse-patterns-experiential.html).*

Constraints: no AI tells, no "in conclusion", no purple prose, no fabricated quotes from named individuals, no fabricated specific project names other than your own LIVING PAPER 2014 reference. If a number is uncertain, hedge it ("approximately", "in my experience"). Honest, specific, useful.'

USER_PROMPT=$(jq -n --arg slug "$SLUG" --arg hint "$HINT" --arg research "$RESEARCH_BLOB" --arg papertown "$PAPERTOWN_TXT" '{
  slug:$slug, hint:$hint, research:$research, papertown:$papertown
} | "Write the next article for Honest Builds.\n\nslug: \(.slug)\nangle: \(.hint)\n\nresearch snippets (titles + URLs + short snippets) — use these as factual anchors only, do not quote them verbatim:\n\(.research)\n\npapertown.at site (clean text, top 80 lines, treat as authoritative for biographical details):\n\(.papertown)\n\nWrite the article now in the exact frontmatter+markdown format specified."')

REQ=$(jq -n --arg sys "$SYSTEM_PROMPT" --arg usr "$USER_PROMPT" --arg model "$MODEL" '{
  model: $model,
  messages: [
    {role:"system", content:$sys},
    {role:"user",   content:$usr}
  ],
  temperature: 0.4,
  max_tokens: 2400
}')

echo "  calling $MODEL..."
RESP=$(curl -s -m 90 -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -H "HTTP-Referer: https://nichtagentur.github.io/" \
  -H "X-Title: Honest Builds Auto" \
  -d "$REQ")

ARTICLE=$(echo "$RESP" | jq -r '.choices[0].message.content // empty')
COST=$(echo "$RESP" | jq -r '.usage.cost // 0')

if [ -z "$ARTICLE" ] || [ "${#ARTICLE}" -lt 500 ]; then
  echo "ERROR: empty or too-short article from model"
  echo "$RESP" | head -c 800
  exit 1
fi

# -----------------------------------------------------------------------------
# 4) Save markdown, ensure unique slug
# -----------------------------------------------------------------------------
OUT="$ROOT/articles/auto-${SLUG}.md"
printf '%s\n' "$ARTICLE" > "$OUT"
echo "  wrote $OUT (cost USD $COST, $(wc -w < "$OUT") words)"

# Mark topic done
echo "$SLUG" >> "$DONE"

# -----------------------------------------------------------------------------
# 5) Make a hero image (cheap reuse: same default OG art, with slug-based hue shift)
#    Skip per-article generation to keep iteration < 90s.
# -----------------------------------------------------------------------------
cp -n "$ROOT/images/og-default.webp" "$ROOT/images/hero-default.webp" 2>/dev/null || true

# -----------------------------------------------------------------------------
# 6) Rebuild site (need to extend build.mjs to pick up auto-*.md)
# -----------------------------------------------------------------------------
node "$ROOT/src/build.mjs"

# -----------------------------------------------------------------------------
# 7) Commit + push
# -----------------------------------------------------------------------------
cd "$ROOT"
git add articles/ images/ state/topics-done.txt 2>/dev/null
git commit -q -m "auto: $SLUG" 2>&1 | tail -2 || true
git push -q origin main 2>&1 | tail -2

# Republish dist via gh-pages branch
git subtree split --prefix dist -b gh-pages-tmp 2>&1 | tail -1
git push -q origin gh-pages-tmp:gh-pages --force 2>&1 | tail -2
git branch -D gh-pages-tmp 2>&1 | tail -1

# Wait briefly for Pages to serve the new article
NEW_URL="$SITE_URL/auto-${SLUG}.html"
for i in 1 2 3 4 5 6 7 8 9 10; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$NEW_URL")
  [ "$status" = "200" ] && break
  sleep 6
done
echo "  Pages status: $status for $NEW_URL"

# -----------------------------------------------------------------------------
# 8) Screenshot + post to SimpleMessage
# -----------------------------------------------------------------------------
SHOT="$ROOT/screenshots/auto-${SLUG}.png"
google-chrome --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1280,1100 --screenshot="$SHOT" "$NEW_URL" 2>/dev/null
ls -la "$SHOT"
git add "$SHOT"
git commit -q -m "screenshot: $SLUG" 2>&1 | tail -1 || true
git push -q origin main 2>&1 | tail -2

SHOT_URL="https://raw.githubusercontent.com/nichtagentur/sustainable-experiential-design/main/screenshots/auto-${SLUG}.png"

# Title from frontmatter (best effort)
TITLE=$(grep -m1 '^title:' "$OUT" | sed 's/^title:\s*//;s/^"\(.*\)"$/\1/' || echo "$SLUG")

POST_TEXT=$(printf '**Honest Builds** auto-pushed a new article: %s\n\n%s\n\n![screenshot](%s)\n\n#aiworkshop #seo #automated' "$TITLE" "$NEW_URL" "$SHOT_URL")

# Truncate to 1000 chars (simplemessage limit)
POST_TEXT=$(printf '%s' "$POST_TEXT" | head -c 998)

curl -s -X POST https://simplemessage.franzai.com/api/messages \
  -H "Authorization: Bearer $SM_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg t "$POST_TEXT" '{text:$t}')" \
  | head -c 200
echo
echo "=== iteration done ==="

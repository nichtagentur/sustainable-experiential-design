// Static site builder: turns the 3 markdown articles + author info into HTML
// pages with full SEO scaffolding (Schema.org JSON-LD, Open Graph, sitemap).
//
// Pure Node 22, no external deps — written for reliability over flexibility.

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SITE_URL = "https://nichtagentur.github.io/sustainable-experiential-design";
const SITE_TITLE = "Honest Builds — Sustainable Experiential Design";
const SITE_TAGLINE = "Practitioner notes on building experiential installations from honest, reusable materials.";
const PUBLISHER = {
  name: "Papertown",
  url: "https://papertown.at",
  // org logo path (rel)
  logo: `${SITE_URL}/images/logo.png`,
};
const AUTHOR = {
  id: "philipp-blume",
  name: "Philipp Blume",
  jobTitle: "Experiential designer, Papertown",
  bio:
    "Philipp Blume builds experiential installations and exhibitions from his Vienna studio Papertown. " +
    "He has specified, fabricated and dismounted projects across DACH since 2014, including the LIVING PAPER " +
    "origami stage at Republic Salzburg. He writes here about the parts of the practice that don't make " +
    "the project pages.",
  email: "office@papertown.at",
  sameAs: [
    "https://papertown.at",
    "https://github.com/nichtagentur",
  ],
};

// --- Tiny markdown subset --------------------------------------------------
// Handles: # h1..h4, paragraphs, **bold**, *italic*, `code`, [text](url),
// unordered lists, ordered lists, ---, simple pipe tables, blockquote.

function parseFrontmatter(src) {
  // Accept optional leading "---" — some auto-generated articles drop it.
  let m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) m = src.match(/^([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  const lines = m[1].split("\n");
  let key = null;
  let listVal = null;
  for (const raw of lines) {
    if (/^\s+-\s/.test(raw) && key && listVal) {
      listVal.push(raw.replace(/^\s+-\s/, "").trim());
      continue;
    }
    const km = raw.match(/^([\w-]+):\s*(.*)$/);
    if (!km) continue;
    key = km[1];
    const val = km[2].trim();
    if (val === "") {
      listVal = [];
      meta[key] = listVal;
    } else {
      listVal = null;
      meta[key] = val.replace(/^"(.*)"$/, "$1");
    }
  }
  return { meta, body: m[2] };
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(s) {
  // Order matters: code first (so we don't process its contents), then links,
  // then bold/italic.
  s = escapeHtml(s);
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
    const ext = /^https?:\/\//.test(u);
    const attrs = ext ? ` rel="noopener" target="_blank"` : "";
    return `<a href="${u}"${attrs}>${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return s;
}

function renderMarkdown(md) {
  const lines = md.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    // Headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++; continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) { out.push("<hr/>"); i++; continue; }

    // Tables (header | --- | content rows)
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s|:-]+\|\s*$/.test(lines[i + 1])) {
      const headers = line.split("|").slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
        rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
        i++;
      }
      out.push(
        `<table><thead><tr>${headers.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead>` +
          `<tbody>${rows
            .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      out.push(`<ol>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ol>`);
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      out.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`);
      continue;
    }

    // Blockquote
    if (/^>\s/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s/, ""));
        i++;
      }
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    // Italic-only paragraph (final note)
    if (/^\*[^*].*\*\s*$/.test(line)) {
      out.push(`<p class="note">${inline(line.replace(/^\*|\*$/g, ""))}</p>`);
      i++; continue;
    }

    // Paragraph (gather until blank)
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|---+$|>\s|\*\s|-\s|\d+\.\s|\|)/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}

// --- Templates -------------------------------------------------------------

function head({ title, description, canonical, ogImage, articleSchema }) {
  const ld = articleSchema
    ? `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:title" content="${escapeHtml(title)}"/>
<meta property="og:description" content="${escapeHtml(description)}"/>
<meta property="og:type" content="article"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:image" content="${ogImage}"/>
<meta property="og:site_name" content="${escapeHtml(SITE_TITLE)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escapeHtml(title)}"/>
<meta name="twitter:description" content="${escapeHtml(description)}"/>
<meta name="twitter:image" content="${ogImage}"/>
<meta name="author" content="${escapeHtml(AUTHOR.name)}"/>
<link rel="stylesheet" href="/sustainable-experiential-design/assets/style.css"/>
<link rel="icon" type="image/svg+xml" href="/sustainable-experiential-design/assets/favicon.svg"/>
${ld}
</head>
<body>
<header class="site">
  <a href="/sustainable-experiential-design/" class="brand">
    <span class="brand-mark" aria-hidden="true">⬡</span>
    <span class="brand-name">Honest Builds</span>
  </a>
  <nav><a href="/sustainable-experiential-design/">Articles</a> <a href="/sustainable-experiential-design/about.html">About</a></nav>
</header>
<main>`;
}

function foot() {
  return `</main>
<footer class="site">
  <div>
    <p><strong>${escapeHtml(SITE_TITLE)}</strong></p>
    <p>${escapeHtml(SITE_TAGLINE)}</p>
  </div>
  <div>
    <p>Written by <a href="/sustainable-experiential-design/about.html">${escapeHtml(AUTHOR.name)}</a> at <a href="${PUBLISHER.url}" rel="noopener" target="_blank">${escapeHtml(PUBLISHER.name)}</a>, Vienna.</p>
    <p>Contact: <a href="mailto:${AUTHOR.email}">${AUTHOR.email}</a></p>
    <p class="muted">All articles original. Last updated 2026-05-06.</p>
  </div>
</footer>
</body>
</html>`;
}

function articlePage({ meta, body, slug }) {
  const canonical = `${SITE_URL}/${slug}.html`;
  const ogImage = `${SITE_URL}/images/${meta.hero}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.description,
    image: ogImage,
    datePublished: meta.date,
    dateModified: meta.date,
    author: {
      "@type": "Person",
      "@id": `${SITE_URL}/about.html#person`,
      name: AUTHOR.name,
      jobTitle: AUTHOR.jobTitle,
      url: `${SITE_URL}/about.html`,
      sameAs: AUTHOR.sameAs,
    },
    publisher: {
      "@type": "Organization",
      name: PUBLISHER.name,
      url: PUBLISHER.url,
      logo: { "@type": "ImageObject", url: PUBLISHER.logo },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    keywords: meta.tags?.join(", "),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Articles", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: meta.title, item: canonical },
    ],
  };

  const headHtml = head({
    title: meta.title,
    description: meta.description,
    canonical,
    ogImage,
    articleSchema: schema,
  });

  const heroAlt = meta.hero_alt || meta.title;
  const date = new Date(meta.date).toLocaleDateString("en-GB", {
    year: "numeric", month: "long", day: "numeric",
  });
  const tagsHtml = (meta.tags || [])
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join(" ");

  return `${headHtml}
<article class="post">
  <header class="post-head">
    <p class="meta"><time datetime="${meta.date}">${date}</time> · by <a href="/sustainable-experiential-design/about.html">${escapeHtml(AUTHOR.name)}</a></p>
    <figure class="hero">
      <img src="/sustainable-experiential-design/images/${meta.hero}" alt="${escapeHtml(heroAlt)}" loading="eager" width="1600" height="900"/>
    </figure>
  </header>
  <div class="post-body">
    ${renderMarkdown(body)}
  </div>
  <footer class="post-foot">
    <p class="tags">${tagsHtml}</p>
    <section class="author-card">
      <h3>About the author</h3>
      <p>${escapeHtml(AUTHOR.bio)}</p>
      <p><a href="/sustainable-experiential-design/about.html">Full bio &rarr;</a></p>
    </section>
  </footer>
</article>
<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
${foot()}`;
}

function indexPage({ articles }) {
  const headHtml = head({
    title: SITE_TITLE,
    description: SITE_TAGLINE,
    canonical: SITE_URL + "/",
    ogImage: `${SITE_URL}/images/og-default.webp`,
    articleSchema: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: SITE_TITLE,
      description: SITE_TAGLINE,
      url: SITE_URL,
      author: {
        "@type": "Person",
        "@id": `${SITE_URL}/about.html#person`,
        name: AUTHOR.name,
      },
      publisher: {
        "@type": "Organization",
        name: PUBLISHER.name,
        url: PUBLISHER.url,
      },
      blogPost: articles.map((a) => ({
        "@type": "BlogPosting",
        headline: a.title,
        url: `${SITE_URL}/${a.slug}.html`,
        datePublished: a.date,
        description: a.description,
      })),
    },
  });
  const list = articles
    .map(
      (a, i) => `
    <li class="card">
      <a class="card-link" href="/sustainable-experiential-design/${a.slug}.html">
        <figure>
          <img src="/sustainable-experiential-design/images/${a.hero}" alt="${escapeHtml(a.hero_alt)}" loading="${i === 0 ? "eager" : "lazy"}" width="1600" height="900"/>
        </figure>
        <h2>${escapeHtml(a.title)}</h2>
        <p>${escapeHtml(a.description)}</p>
        <p class="meta">Part ${i + 1} of 3 · ${new Date(a.date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>
      </a>
    </li>`
    )
    .join("");

  return `${headHtml}
<section class="hero-block">
  <h1>Honest Builds</h1>
  <p class="lede">Practitioner notes on building experiential installations from honest, reusable materials. Three articles, written from a decade of bashing my head against this work.</p>
  <p class="lede">By <a href="/sustainable-experiential-design/about.html">${escapeHtml(AUTHOR.name)}</a> at ${escapeHtml(PUBLISHER.name)}, Vienna.</p>
</section>
<section class="article-list">
  <ul class="cards">
    ${list}
  </ul>
</section>
${foot()}`;
}

function aboutPage() {
  const headHtml = head({
    title: `About — ${SITE_TITLE}`,
    description: `About ${AUTHOR.name}, the experiential designer behind Honest Builds.`,
    canonical: SITE_URL + "/about.html",
    ogImage: `${SITE_URL}/images/og-default.webp`,
    articleSchema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      mainEntity: {
        "@type": "Person",
        "@id": `${SITE_URL}/about.html#person`,
        name: AUTHOR.name,
        jobTitle: AUTHOR.jobTitle,
        email: AUTHOR.email,
        url: SITE_URL + "/about.html",
        sameAs: AUTHOR.sameAs,
        worksFor: {
          "@type": "Organization",
          name: PUBLISHER.name,
          url: PUBLISHER.url,
        },
      },
    },
  });
  return `${headHtml}
<article class="post">
  <header class="post-head">
    <h1>About</h1>
  </header>
  <div class="post-body">
    <h2>${escapeHtml(AUTHOR.name)}</h2>
    <p>${escapeHtml(AUTHOR.bio)}</p>
    <h3>What this site is</h3>
    <p>Three articles on experiential design with sustainable materials, written from production experience rather than from a sustainability marketing brief. The writing tries to close the gap between what a spec sheet promises and what a loading bay actually receives. There are no affiliate links, no sponsored material, and no gated content.</p>
    <h3>Editorial principles</h3>
    <ul>
      <li>Original observations, not summaries of someone else's research.</li>
      <li>Specific numbers — weights, costs, fire ratings — that I have personally collected or measured.</li>
      <li>Honest naming of what does not work, including projects of my own.</li>
      <li>References and citations for any external claim, with the source of each material's specifications named.</li>
      <li>Updates dated and visible at the bottom of each article when prices, supplier names, or regulations change.</li>
    </ul>
    <h3>Contact</h3>
    <p>Editorial questions, corrections, or commissions: <a href="mailto:${AUTHOR.email}">${AUTHOR.email}</a>.</p>
    <p>Studio: <a href="${PUBLISHER.url}" rel="noopener" target="_blank">${PUBLISHER.name}</a> in Vienna, Austria.</p>
    <p>Code and reference projects: <a href="https://github.com/nichtagentur" rel="noopener" target="_blank">github.com/nichtagentur</a>.</p>
    <h3>Funding and conflicts of interest</h3>
    <p>This site is self-funded. No supplier listed in any article has paid for placement. Where I name a vendor it is because I have personally specified or rejected their material in the field; the suppliers do not know I am writing about them.</p>
  </div>
</article>
${foot()}`;
}

// --- Build -----------------------------------------------------------------

async function build() {
  const distDir = path.join(ROOT, "dist");
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });
  await fs.mkdir(path.join(distDir, "images"), { recursive: true });
  await fs.mkdir(path.join(distDir, "assets"), { recursive: true });

  // Read articles — original 3 first (canonical order) plus any auto-* additions
  const baseFiles = ["01-honest-materials.md", "02-designing-for-disassembly.md", "03-five-reuse-patterns.md"];
  const allFiles = (await fs.readdir(path.join(ROOT, "articles"))).filter((f) => f.endsWith(".md"));
  const autoFiles = allFiles.filter((f) => f.startsWith("auto-")).sort();
  const articleFiles = [...baseFiles, ...autoFiles];
  const articles = [];
  for (const f of articleFiles) {
    const src = await fs.readFile(path.join(ROOT, "articles", f), "utf8");
    const { meta, body } = parseFrontmatter(src);
    if (!meta.slug) {
      console.error(`skip ${f}: no slug in frontmatter`);
      continue;
    }
    // auto-* articles use a slug prefix to avoid collisions with curated ones
    const slug = f.startsWith("auto-") ? `auto-${meta.slug}` : meta.slug;
    const html = articlePage({ meta, body, slug });
    await fs.writeFile(path.join(distDir, `${slug}.html`), html);
    articles.push({ ...meta, slug, body, isAuto: f.startsWith("auto-") });
  }

  // Index + about
  await fs.writeFile(path.join(distDir, "index.html"), indexPage({ articles }));
  await fs.writeFile(path.join(distDir, "about.html"), aboutPage());

  // sitemap.xml
  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/about.html</loc><lastmod>${today}</lastmod><priority>0.5</priority></url>
${articles.map((a) => `  <url><loc>${SITE_URL}/${a.slug}.html</loc><lastmod>${a.date}</lastmod><priority>0.9</priority></url>`).join("\n")}
</urlset>
`;
  await fs.writeFile(path.join(distDir, "sitemap.xml"), sitemap);

  // robots.txt
  const robots = `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
`;
  await fs.writeFile(path.join(distDir, "robots.txt"), robots);

  // Copy CSS + favicon (created separately)
  for (const f of ["style.css", "favicon.svg"]) {
    try {
      await fs.copyFile(path.join(ROOT, "assets", f), path.join(distDir, "assets", f));
    } catch (e) { console.error("missing asset:", f); }
  }

  // Copy images
  try {
    const imgs = await fs.readdir(path.join(ROOT, "images"));
    for (const f of imgs) {
      await fs.copyFile(path.join(ROOT, "images", f), path.join(distDir, "images", f));
    }
  } catch (e) {
    console.error("missing images dir");
  }

  // .nojekyll for GitHub Pages
  await fs.writeFile(path.join(distDir, ".nojekyll"), "");

  console.log(`Built ${articles.length + 2} pages -> ${distDir}/`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});

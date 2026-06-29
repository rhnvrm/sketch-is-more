import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const pagesDir = join(rootDir, "src", "pages");

const commonDescription =
  "Coffee with an Architect: sketches, buildings, plans, journeys, and paintings by Ravindra Verma.";
const assetVersion = "20260627-quiet";
const siteOrigin = (process.env.SITE_ORIGIN || process.env.URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const sitemapLastmod = process.env.SITEMAP_LASTMOD || "2026-06-27";

const routes = [
  {
    id: "index",
    output: "index.html",
    title: "Sketch Is More | Ravindra Verma",
    description: commonDescription,
    image: "./public/book/large/1.webp",
    imageAlt: "Sketch Is More cover by Ravindra Verma",
    imageWidth: 1563,
    imageHeight: 1800,
    imageType: "image/webp",
    bodyClass: "home-page",
    scripts: [],
  },
  {
    id: "reader",
    output: "reader.html",
    title: "Full Reader | Sketch Is More",
    description: "Read Sketch Is More page by page, with wide physical spreads kept together.",
    image: "./public/book/large/8.webp",
    imageAlt: "Wide physical spread from Sketch Is More",
    imageWidth: 1563,
    imageHeight: 1800,
    imageType: "image/webp",
    bodyClass: "reader-page-shell",
    scripts: [`./app.js?v=${assetVersion}`],
  },
];

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("'", "&apos;");
}

function siteUrlFor(output) {
  return output === "index.html" ? `${siteOrigin}/` : `${siteOrigin}/${output}`;
}

function assetUrlFor(path) {
  return new URL(path.replace(/^\.\//, ""), `${siteOrigin}/`).href;
}

function renderStructuredData(route) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: route.title,
    description: route.description,
    url: siteUrlFor(route.output),
    image: assetUrlFor(route.image),
    isPartOf: {
      "@type": "WebSite",
      name: "Sketch Is More",
      url: siteUrlFor("index.html"),
      author: {
        "@type": "Person",
        name: "Ravindra Verma",
      },
      about: {
        "@type": "Book",
        name: "Sketch Is More",
        alternateName: "Coffee with an Architect",
        author: {
          "@type": "Person",
          name: "Ravindra Verma",
        },
      },
    },
  };

  return JSON.stringify(data, null, 6).replaceAll("<", "\\u003c");
}

function renderHead(route) {
  const title = escapeAttribute(route.title);
  const description = escapeAttribute(route.description);
  const image = escapeAttribute(assetUrlFor(route.image));
  const imageAlt = escapeAttribute(route.imageAlt);
  const canonical = escapeAttribute(siteUrlFor(route.output));

  return `  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${route.title}</title>
    <meta name="description" content="${description}" />
    <meta name="author" content="Ravindra Verma" />
    <meta name="application-name" content="Sketch Is More" />
    <meta name="apple-mobile-web-app-title" content="Sketch Is More" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="color-scheme" content="light" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Sketch Is More" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:type" content="${escapeAttribute(route.imageType)}" />
    <meta property="og:image:width" content="${route.imageWidth}" />
    <meta property="og:image:height" content="${route.imageHeight}" />
    <meta property="og:image:alt" content="${imageAlt}" />
    <meta name="theme-color" content="#161413" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${imageAlt}" />
    <link rel="manifest" href="./site.webmanifest" />
    <link rel="icon" href="./public/book/thumb/1.webp" type="image/webp" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Kalam:wght@400;700&family=Space+Grotesk:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="./styles.css?v=${assetVersion}" />
    <script type="application/ld+json">
${renderStructuredData(route)}
    </script>
  </head>`;
}

function renderHeader(route) {
  return `    <a class="skip-link" href="#main-content">Skip to content</a>
    <div class="grain" aria-hidden="true"></div>
    <header class="site-header">
      <a class="brand" href="./index.html" aria-label="Sketch Is More home">
        <span class="brand-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/>
          </svg>
        </span>
        <span class="brand-name">Sketch Is More</span>
      </a>
      <div class="share-bar">
        <button
          class="share-button"
          type="button"
          data-share-book
          data-share-target="./${route.output}"
          data-share-title="${escapeAttribute(route.title)}"
          data-share-text="${escapeAttribute(route.description)}"
        >
          Share
        </button>
        <span class="share-status" data-share-status aria-live="polite"></span>
      </div>
    </header>`;
}

function renderScripts(route) {
  return [`./site.js?v=${assetVersion}`, ...route.scripts]
    .map((src) => `    <script src="${src}" type="module"></script>`)
    .join("\n");
}

function optimizeTemplateImages(html) {
  return html.replace(/<img\b([^>]*)>/g, (match, attributes) => {
    const selfClosing = /\/\s*$/.test(attributes);
    const cleanAttributes = attributes.replace(/\/\s*$/, "").trimEnd();
    const additions = [];

    if (!/\sloading=/.test(cleanAttributes)) additions.push('loading="lazy"');
    if (!/\sdecoding=/.test(cleanAttributes)) additions.push('decoding="async"');
    if (!additions.length) return match;

    return `<img${cleanAttributes} ${additions.join(" ")}${selfClosing ? " /" : ""}>`;
  });
}

function ensureMainTarget(html) {
  return html.replace(/<main\b([^>]*)>/i, (_match, attributes) => {
    const cleanAttributes = attributes.replace(/\s+id=(["']).*?\1/i, "").trimEnd();
    return `<main${cleanAttributes} id="main-content">`;
  });
}

function renderRoute(route) {
  const page = ensureMainTarget(optimizeTemplateImages(readFileSync(join(pagesDir, `${route.id}.html`), "utf8").trim()));

  return `<!doctype html>
<!-- Generated by scripts/render-site.mjs. Edit src/pages/*.html and route config instead. -->
<html lang="en">
${renderHead(route)}
  <body class="${route.bodyClass}">
${renderHeader(route)}

${page}

${renderScripts(route)}
  </body>
</html>
`;
}

function extractMain(route) {
  const source = readFileSync(join(rootDir, route.output), "utf8");
  const match = source.match(/<main\b[\s\S]*?<\/main>/i);
  if (!match) throw new Error(`Could not find <main> in ${route.output}`);
  return `${match[0].trim()}\n`;
}

function extractTemplates() {
  mkdirSync(pagesDir, { recursive: true });

  for (const route of routes) {
    const templatePath = join(pagesDir, `${route.id}.html`);
    if (existsSync(templatePath) && !process.argv.includes("--force-extract")) {
      throw new Error(
        `${templatePath} already exists. Use --force-extract only for a deliberate bootstrap overwrite.`,
      );
    }

    writeFileSync(templatePath, extractMain(route));
  }
}

function renderRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${siteUrlFor("sitemap.xml")}
`;
}

function renderSitemap() {
  const urls = routes
    .map((route) => {
      const priority = route.output === "index.html" ? "1.0" : "0.8";
      return `  <url>
    <loc>${escapeXml(siteUrlFor(route.output))}</loc>
    <lastmod>${sitemapLastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function renderSite() {
  for (const route of routes) {
    writeFileSync(join(rootDir, route.output), renderRoute(route));
  }
  writeFileSync(join(rootDir, "robots.txt"), renderRobots());
  writeFileSync(join(rootDir, "sitemap.xml"), renderSitemap());
}

if (process.argv.includes("--extract")) {
  extractTemplates();
}

renderSite();

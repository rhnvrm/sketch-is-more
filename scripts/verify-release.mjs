import { existsSync, readdirSync, readFileSync } from "node:fs";
import { posix as path } from "node:path";

const requiredFiles = [
  "index.html",
  "reader.html",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
  "sw.js",
];

const htmlFiles = [
  "index.html",
  "reader.html",
];

const expectedPublicHtmlFiles = new Set(htmlFiles);
const expectedTemplateHtmlFiles = new Set(htmlFiles);

const retiredExperiencePatterns = [
  /\bwalk-(?:page|hero|shell|rail|stage|media|controls)\b/,
  /\batlas-/,
  /\bstudio-/,
  /\bshare-kit\b/,
  /\bplate-(?:page|hero|inspector|workbench|filter|grid|card)\b/,
  /\breader-(?:lens|path)\b/,
  /\bthumb-drawer\b/,
  /\b(?:inspect-toggle|loupe|hotspot|option-stage|option-strip|manifesto|journey-transform|story-panel)\b/,
  /@import\s+url\(["']?https:\/\/fonts\.googleapis\.com/,
];

function fail(message) {
  throw new Error(message);
}

function read(path) {
  if (!existsSync(path)) fail(`Missing required file: ${path}`);
  return readFileSync(path, "utf8");
}

function metadataContent(source, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`<meta[^>]+${escapedSelector}[^>]+content="([^"]+)"|<meta[^>]+content="([^"]+)"[^>]+${escapedSelector}`, "i");
  const match = source.match(regex);
  return match?.[1] || match?.[2] || "";
}

function linkHref(source, rel) {
  const regex = new RegExp(`<link[^>]+rel="${rel}"[^>]+href="([^"]+)"|<link[^>]+href="([^"]+)"[^>]+rel="${rel}"`, "i");
  const match = source.match(regex);
  return match?.[1] || match?.[2] || "";
}

function idsIn(source) {
  return new Set([...source.matchAll(/\sid=(["'])(.*?)\1/g)].map((match) => match[2]));
}

function extractMain(source, file) {
  const match = source.match(/<main\b[\s\S]*?<\/main>/i);
  if (!match) fail(`Could not find <main> in ${file}`);
  return match[0].trim();
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

function expectedMainFromTemplate(file) {
  const templatePath = `src/pages/${file}`;
  return ensureMainTarget(optimizeTemplateImages(read(templatePath).trim()));
}

function htmlHrefValues(source) {
  return [...source.matchAll(/\shref=(["'])(.*?)\1/g)].map((match) => match[2]);
}

function htmlAssetValues(source) {
  return [
    ...[...source.matchAll(/<script\b[^>]*\ssrc=(["'])(.*?)\1/gi)].map((match) => match[2]),
    ...[...source.matchAll(/<link\b[^>]*\shref=(["'])(.*?)\1/gi)].map((match) => match[2]),
    ...[...source.matchAll(/<img\b[^>]*\ssrc=(["'])(.*?)\1/gi)].map((match) => match[2]),
  ];
}

function jsImportValues(source) {
  return [...source.matchAll(/\bfrom\s+(["'])(\.\/[^"']+)\1/g)].map((match) => match[2]);
}

function localTargetPath(fromFile, href) {
  const [pathAndQuery] = href.split("#");
  const cleanPath = pathAndQuery.split("?")[0];
  if (!cleanPath) return fromFile;
  if (cleanPath.startsWith("/")) return cleanPath.replace(/^\/+/, "") || "index.html";
  const fromDir = path.dirname(fromFile);
  return path.normalize(path.join(fromDir === "." ? "" : fromDir, cleanPath));
}

const dynamicHashRoutes = new Map([
  ["reader.html", /^page-\d+$/],
]);

function isDynamicHash(targetFile, hash) {
  return dynamicHashRoutes.get(targetFile)?.test(hash) ?? false;
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`Missing required file: ${file}`);
}

const publicHtmlFiles = readdirSync(".")
  .filter((file) => file.endsWith(".html"))
  .sort();
const templateHtmlFiles = readdirSync("src/pages")
  .filter((file) => file.endsWith(".html"))
  .sort();

for (const file of publicHtmlFiles) {
  if (!expectedPublicHtmlFiles.has(file)) {
    fail(`Unexpected public HTML page: ${file}`);
  }
}
for (const file of [...expectedPublicHtmlFiles].sort()) {
  if (!publicHtmlFiles.includes(file)) {
    fail(`Missing expected public HTML page: ${file}`);
  }
}
for (const file of templateHtmlFiles) {
  if (!expectedTemplateHtmlFiles.has(file)) {
    fail(`Unexpected source template page: src/pages/${file}`);
  }
}
for (const file of [...expectedTemplateHtmlFiles].sort()) {
  if (!templateHtmlFiles.includes(file)) {
    fail(`Missing expected source template page: src/pages/${file}`);
  }
}

const renderer = read("scripts/render-site.mjs");
const assetVersion = renderer.match(/const assetVersion = "([^"]+)"/)?.[1];
if (!assetVersion) fail("Could not find assetVersion in scripts/render-site.mjs");
const requirePublicOrigin = process.env.REQUIRE_PUBLIC_ORIGIN === "1";

function assertPublicUrl(url, label) {
  if (!requirePublicOrigin) return;
  const parsed = new URL(url);
  if (
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "0.0.0.0" ||
    parsed.hostname.endsWith(".local")
  ) {
    fail(`${label} uses local development origin: ${url}`);
  }
}

const serviceWorker = read("sw.js");
if (!serviceWorker.includes(`sketch-is-more-v${assetVersion}`)) {
  fail(`Service worker cacheVersion is not aligned with assetVersion ${assetVersion}`);
}

for (const file of htmlFiles) {
  const source = read(file);
  const expectedMain = expectedMainFromTemplate(file);
  const actualMain = extractMain(source, file);
  if (actualMain !== expectedMain) {
    fail(`${file} is stale. Run npm run build to regenerate it from src/pages/${file}`);
  }

  if (!source.includes(`styles.css?v=${assetVersion}`)) {
    fail(`${file} does not reference styles.css?v=${assetVersion}`);
  }

  const canonical = linkHref(source, "canonical");
  if (!/^https?:\/\//.test(canonical)) {
    fail(`${file} canonical URL is not absolute`);
  }
  assertPublicUrl(canonical, `${file} canonical URL`);

  const ogUrl = metadataContent(source, 'property="og:url"');
  if (ogUrl !== canonical) {
    fail(`${file} og:url does not match canonical URL`);
  }

  const ogImage = metadataContent(source, 'property="og:image"');
  if (!/^https?:\/\//.test(ogImage)) {
    fail(`${file} og:image URL is not absolute`);
  }
  assertPublicUrl(ogImage, `${file} og:image URL`);

  const ogImageType = metadataContent(source, 'property="og:image:type"');
  if (ogImageType !== "image/webp") {
    fail(`${file} og:image:type should be image/webp`);
  }

  const ogImageWidth = Number(metadataContent(source, 'property="og:image:width"'));
  const ogImageHeight = Number(metadataContent(source, 'property="og:image:height"'));
  if (ogImageWidth < 1200 || ogImageHeight < 630) {
    fail(`${file} og:image dimensions are too small for a reliable large preview`);
  }

  const twitterImage = metadataContent(source, 'name="twitter:image"');
  if (!/^https?:\/\//.test(twitterImage)) {
    fail(`${file} twitter:image URL is not absolute`);
  }
  assertPublicUrl(twitterImage, `${file} twitter:image URL`);
  if (twitterImage !== ogImage) {
    fail(`${file} twitter:image does not match og:image`);
  }
}

for (const file of ["styles.css", ...htmlFiles]) {
  const source = read(file);
  for (const pattern of retiredExperiencePatterns) {
    if (pattern.test(source)) {
      fail(`${file} contains retired overbuilt experience code matching ${pattern}`);
    }
  }
}

const allHtmlFiles = [
  ...new Set([
    "index.html",
    "reader.html",
  ]),
];

const idCache = new Map();
function idsForFile(file) {
  if (!idCache.has(file)) idCache.set(file, idsIn(read(file)));
  return idCache.get(file);
}

for (const file of allHtmlFiles) {
  const source = read(file);
  for (const href of htmlHrefValues(source)) {
    if (!href.includes("#")) continue;
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue;

    const hash = href.split("#")[1]?.split("?")[0];
    if (!hash) continue;

    const targetFile = localTargetPath(file, href);
    if (!existsSync(targetFile)) {
      fail(`${file} links to missing local page ${href}`);
    }

    if (isDynamicHash(targetFile, hash)) continue;
    if (!idsForFile(targetFile).has(hash)) {
      fail(`${file} links to missing hash target ${href}`);
    }
  }
}

const sitemap = read("sitemap.xml");
const locs = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
if (locs.length !== 2) fail(`Sitemap should contain only home and reader URLs, found: ${locs.length}`);
if (new Set(locs).size !== locs.length) fail("Sitemap contains duplicate URLs");
if (!locs.every((url) => /^https?:\/\//.test(url))) fail("Sitemap contains non-absolute URLs");
for (const url of locs) assertPublicUrl(url, "Sitemap URL");

const robots = read("robots.txt");
if (!/Sitemap:\s+https?:\/\/.+\/sitemap\.xml/.test(robots)) {
  fail("robots.txt does not point to an absolute sitemap.xml URL");
}
const robotsSitemapUrl = robots.match(/Sitemap:\s+(https?:\/\/\S+)/)?.[1];
if (robotsSitemapUrl) assertPublicUrl(robotsSitemapUrl, "robots.txt sitemap URL");

const manifest = JSON.parse(read("site.webmanifest"));
if (!manifest.name || !manifest.start_url || !Array.isArray(manifest.shortcuts)) {
  fail("site.webmanifest is missing required name/start_url/shortcuts fields");
}
if (JSON.stringify(manifest).includes("Page by Page")) {
  fail('site.webmanifest uses retired "Page by Page" wording');
}

const allowedManifestShortcutUrls = new Set(["./index.html#sanctuary", "./reader.html"]);
for (const shortcut of manifest.shortcuts) {
  if (!allowedManifestShortcutUrls.has(shortcut.url)) {
    fail(`site.webmanifest contains unexpected shortcut URL: ${shortcut.url}`);
  }
}

const shellAssets = serviceWorker.match(/const shellAssets = \[([\s\S]*?)\];/)?.[1] ?? "";
const shellAssetSet = new Set(
  [...shellAssets.matchAll(/"([^"]+)"/g)].map((match) => match[1]),
);

function shellAssetPath(value) {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return null;

  const [pathAndQuery] = value.split("#");
  const cleanPath = pathAndQuery.split("?")[0];
  if (!cleanPath) return null;
  if (cleanPath.startsWith("/")) return `.${cleanPath}`;
  return cleanPath.startsWith("./") ? cleanPath : `./${cleanPath}`;
}

function assertShellAsset(value, label) {
  const asset = shellAssetPath(value);
  if (asset && !shellAssetSet.has(asset)) {
    fail(`Service worker shell cache is missing ${label}: ${asset}`);
  }
}

for (const file of ["./index.html", "./reader.html", "./robots.txt", "./sitemap.xml"]) {
  assertShellAsset(file, "required shell file");
}

for (const file of htmlFiles) {
  const source = read(file);
  for (const asset of htmlAssetValues(source)) {
    assertShellAsset(asset, `${file} asset`);
  }
}

const jsFilesToInspect = new Set(["./site.js", "./app.js"]);
for (const file of jsFilesToInspect) {
  const source = read(file.replace(/^\.\//, ""));
  for (const imported of jsImportValues(source)) {
    assertShellAsset(imported, `${file} import`);
  }
}

const requiredShellImages = new Set();
for (const icon of manifest.icons ?? []) {
  requiredShellImages.add(icon.src);
}
for (const shortcut of manifest.shortcuts ?? []) {
  for (const icon of shortcut.icons ?? []) {
    requiredShellImages.add(icon.src);
  }
}

for (const image of [...requiredShellImages].sort()) {
  assertShellAsset(image, "key image");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      assetVersion,
      publicOriginRequired: requirePublicOrigin,
      sitemapUrls: locs.length,
      manifestShortcuts: manifest.shortcuts.length,
      shellImages: requiredShellImages.size,
    },
    null,
    2,
  ),
);

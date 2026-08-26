import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const mediaRoot = process.env.GITHUB_PAGES_MEDIA_DIR || path.join(projectRoot, "github-pages-media");
const outputRoot = path.join(projectRoot, "dist", "public");
const outputMediaRoot = path.join(outputRoot, "manus-storage");
const siteOrigin = (process.env.GITHUB_PAGES_SITE_ORIGIN || "").replace(/\/$/, "");
const manusOrigin = "https://p34nutsart-jjmeco2k.manus.space";

if (!siteOrigin) {
  throw new Error("GITHUB_PAGES_SITE_ORIGIN must be set for the GitHub Pages build.");
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(entryPath);
    if (entry.isFile()) return [entryPath];
    return [];
  }));
  return files.flat();
}

function unversionedName(assetName) {
  return assetName.replace(/_[0-9a-f]{8}(\.[^.]+)$/i, "$1");
}

const sourceFiles = [
  path.join(projectRoot, "client", "src", "data", "artistData.ts"),
  path.join(projectRoot, "client", "index.html"),
];
const basicSoftstyleManifestPath = path.join(mediaRoot, "basic-softstyle-mockups-manifest.json");
const finishedProductManifestPath = path.join(mediaRoot, "finished-product-mockups-manifest.json");

const sourceText = await Promise.all(sourceFiles.map(file => readFile(file, "utf8")));
const referencedAssets = [...new Set(sourceText
  .flatMap(text => [...text.matchAll(/\/manus-storage\/([A-Za-z0-9._-]+)/g)].map(match => match[1])))]
  .sort();

const availableMedia = new Map();
for (const file of await collectFiles(mediaRoot)) {
  availableMedia.set(path.basename(file), file);
}

await rm(outputMediaRoot, { recursive: true, force: true });
await mkdir(outputMediaRoot, { recursive: true });

const unresolved = [];
for (const assetName of referencedAssets) {
  const source = availableMedia.get(unversionedName(assetName));
  if (!source) {
    unresolved.push(assetName);
    continue;
  }
  await cp(source, path.join(outputMediaRoot, assetName));
}

if (unresolved.length > 0) {
  throw new Error(`Missing GitHub Pages media: ${unresolved.join(", ")}`);
}

// The merch shop references real Printful front mockups through the same
// permanent Pages origin. The manifest is generated from the validated task
// ledger and guards against accidentally publishing arbitrary media files.
const basicSoftstyleManifest = JSON.parse(await readFile(basicSoftstyleManifestPath, "utf8"));
if (basicSoftstyleManifest.entryCount !== 952 || basicSoftstyleManifest.records?.length !== 952)
  throw new Error("Expected exactly 952 verified Basic Softstyle mockup assets.");
const basicPaths = new Set();
for (const record of basicSoftstyleManifest.records) {
  if (typeof record.relativePath !== "string" || !record.relativePath.startsWith("basic-softstyle-mockups/"))
    throw new Error("Invalid Basic Softstyle mockup asset path in manifest.");
  if (basicPaths.has(record.relativePath))
    throw new Error(`Duplicate Basic Softstyle mockup asset path: ${record.relativePath}`);
  basicPaths.add(record.relativePath);
  const source = path.join(mediaRoot, record.relativePath);
  const destination = path.join(outputMediaRoot, record.relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
}

const finishedProductManifest = JSON.parse(await readFile(finishedProductManifestPath, "utf8"));
if (finishedProductManifest.entryCount !== 1538 || finishedProductManifest.records?.length !== 1538)
  throw new Error("Expected exactly 1538 verified finished product mockup assets.");
const finishedProductPaths = new Set();
for (const record of finishedProductManifest.records) {
  if (typeof record.relativePath !== "string" || !record.relativePath.startsWith("finished-product-mockups/"))
    throw new Error("Invalid finished product mockup asset path in manifest.");
  if (!Number.isInteger(record.syncProductId) || !["front", "back"].includes(record.imageRole))
    throw new Error("Invalid finished product mockup identity or image role in manifest.");
  if (finishedProductPaths.has(record.relativePath))
    throw new Error(`Duplicate finished product mockup asset path: ${record.relativePath}`);
  finishedProductPaths.add(record.relativePath);
  const source = path.join(mediaRoot, record.relativePath);
  const destination = path.join(outputMediaRoot, record.relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
}

const indexPath = path.join(outputRoot, "index.html");
const index = await readFile(indexPath, "utf8");
await writeFile(indexPath, index.replaceAll(manusOrigin, siteOrigin));

const outputMediaCount = (await collectFiles(outputMediaRoot)).length;
const expectedMediaCount = referencedAssets.length + basicPaths.size + finishedProductPaths.size;
if (outputMediaCount !== expectedMediaCount) {
  throw new Error(`Expected ${expectedMediaCount} media files, found ${outputMediaCount}.`);
}

const outputInfo = await stat(indexPath);
if (outputInfo.size === 0) {
  throw new Error("GitHub Pages index.html is empty.");
}

console.log(`Prepared ${outputMediaCount} GitHub Pages media files for ${siteOrigin}, including ${basicPaths.size} verified Basic Softstyle mockups and ${finishedProductPaths.size} verified finished product mockups.`);

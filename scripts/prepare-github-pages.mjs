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

const indexPath = path.join(outputRoot, "index.html");
const index = await readFile(indexPath, "utf8");
await writeFile(indexPath, index.replaceAll(manusOrigin, siteOrigin));

const outputMediaCount = (await collectFiles(outputMediaRoot)).length;
if (outputMediaCount !== referencedAssets.length) {
  throw new Error(`Expected ${referencedAssets.length} media files, found ${outputMediaCount}.`);
}

const outputInfo = await stat(indexPath);
if (outputInfo.size === 0) {
  throw new Error("GitHub Pages index.html is empty.");
}

console.log(`Prepared ${outputMediaCount} GitHub Pages media files for ${siteOrigin}.`);

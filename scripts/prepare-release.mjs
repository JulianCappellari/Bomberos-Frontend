import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = process.cwd(), hash = createHash("sha256");
async function scan(path) { for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) { const full = resolve(path, entry.name); if (entry.isDirectory()) await scan(full); else { hash.update(full.slice(root.length)); hash.update(await readFile(full)); } } }
await scan(resolve(root, "src")); hash.update(await readFile("package-lock.json")); hash.update(await readFile("scripts/service-worker.template.js"));
const version = hash.digest("hex").slice(0, 16);
await writeFile("public/sw.js", `const BUILD_VERSION = ${JSON.stringify(version)};\n${await readFile("scripts/service-worker.template.js", "utf8")}`);
await writeFile("public/release.json", JSON.stringify({ version }));
console.log(`Version de aplicacion: ${version}`);

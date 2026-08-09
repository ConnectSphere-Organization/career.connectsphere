import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const loginChunkDirectory = join(
  process.cwd(),
  ".next/static/chunks/app/(public)/login",
);
const chunkNames = (await readdir(loginChunkDirectory)).filter(
  (name) => name.startsWith("page-") && name.endsWith(".js"),
);

if (chunkNames.length !== 1) {
  throw new Error(
    `Expected one production login chunk, found ${chunkNames.length}`,
  );
}

const chunk = await readFile(join(loginChunkDirectory, chunkNames[0]), "utf8");
if (/\bprocess(?:\.env|\[)/.test(chunk)) {
  throw new Error(
    "Career login client bundle contains a Node.js process reference",
  );
}

console.log(`Verified browser-safe career login bundle: ${chunkNames[0]}`);

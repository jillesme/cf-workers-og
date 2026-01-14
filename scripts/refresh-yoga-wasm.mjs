import fs from "node:fs";
import path from "node:path";

const base64Source = path.join(
  "satori-fork",
  "node_modules",
  "yoga-layout",
  "dist",
  "binaries",
  "yoga-wasm-base64-esm.js",
);

const text = fs.readFileSync(base64Source, "utf8");
const match = text.match(/data:application\/octet-stream;base64,([^"']+)/);
if (!match) {
  throw new Error(`Base64 payload not found in ${base64Source}`);
}

const buf = Buffer.from(match[1], "base64");
fs.writeFileSync(path.join("src", "wasm", "yoga.wasm"), buf);
fs.writeFileSync(path.join("satori-fork", "yoga.wasm"), buf);

console.log(`Refreshed yoga.wasm (${buf.length} bytes).`);

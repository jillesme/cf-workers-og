import { copyFile, mkdir } from "node:fs/promises";

const targetDir = new URL("../dist/wasm/", import.meta.url);
const files = ["yoga.wasm", "resvg.wasm"];

await mkdir(targetDir, { recursive: true });

await Promise.all(
  files.map(async (filename) => {
    const source = new URL(`../src/wasm/${filename}`, import.meta.url);
    const target = new URL(`../dist/wasm/${filename}`, import.meta.url);
    await copyFile(source, target);
  })
);

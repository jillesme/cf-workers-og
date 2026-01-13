import { copyFile, mkdir } from "node:fs/promises";

const source = new URL("../src/wasm/yoga.wasm", import.meta.url);
const targetDir = new URL("../dist/wasm/", import.meta.url);
const target = new URL("../dist/wasm/yoga.wasm", import.meta.url);

await mkdir(targetDir, { recursive: true });
await copyFile(source, target);

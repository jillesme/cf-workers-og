import { copyFile } from "node:fs/promises";

const source = new URL("../node_modules/@resvg/resvg-wasm/index_bg.wasm", import.meta.url);
const target = new URL("../src/wasm/resvg.wasm", import.meta.url);

await copyFile(source, target);

import { readFile } from "node:fs/promises";

const yogaUrl = new URL("../wasm/yoga.wasm", import.meta.url);

function toArrayBuffer(view: ArrayBufferView): ArrayBuffer {
  const copy = new Uint8Array(view.byteLength);
  copy.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  return copy.buffer;
}

export async function loadYogaWasm(): Promise<ArrayBuffer> {
  const data = await readFile(yogaUrl);
  return toArrayBuffer(data);
}

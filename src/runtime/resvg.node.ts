import { readFile } from "node:fs/promises";
import { Resvg, initWasm } from "@resvg/resvg-wasm";

const resvgUrl = new URL(
  /* @vite-ignore */ "./wasm/resvg.wasm",
  import.meta.url
);

let initPromise: Promise<void> | null = null;

function toArrayBuffer(view: ArrayBufferView): ArrayBuffer {
  const copy = new Uint8Array(view.byteLength);
  copy.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  return copy.buffer;
}

async function loadResvgWasm(): Promise<ArrayBuffer> {
  const data = await readFile(resvgUrl);
  return toArrayBuffer(data);
}

async function ensureResvg() {
  if (!initPromise) {
    initPromise = (async () => {
      await initWasm(await loadResvgWasm());
    })();
  }

  return initPromise;
}

export async function renderPngFromSvg(svg: string): Promise<Uint8Array> {
  await ensureResvg();

  const renderer = new Resvg(svg, {
    font: {
      loadSystemFonts: false,
    },
  });

  const image = renderer.render();
  const png = image.asPng();

  image.free();
  renderer.free();

  return png;
}

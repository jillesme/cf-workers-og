import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasmModule from "../wasm/resvg.wasm";

let initPromise: Promise<void> | null = null;

async function ensureResvg() {
  if (!initPromise) {
    initPromise = (async () => {
      if (typeof WebAssembly === "undefined") {
        throw new Error("cf-workers-og: WebAssembly is not available");
      }

      if (!(resvgWasmModule instanceof WebAssembly.Module)) {
        throw new Error(
          "cf-workers-og: expected resvg.wasm to be a WebAssembly.Module"
        );
      }

      await initWasm(resvgWasmModule);
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

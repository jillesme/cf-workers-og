import satori, { init as initSatori } from "satori/standalone";
import type { ReactNode } from "react";
import type { SatoriOptions } from "satori/standalone";
import { loadYogaWasm } from "./yoga.node";
import { renderPngFromSvg } from "./resvg.node";

let initPromise: Promise<void> | null = null;

async function ensureSatori() {
  if (!initPromise) {
    initPromise = (async () => {
      const yoga = await loadYogaWasm();
      await initSatori(yoga);
    })();
  }
  return initPromise;
}

export async function renderSvg(element: ReactNode, options: SatoriOptions) {
  await ensureSatori();
  return satori(element, options);
}

export async function renderPng(element: ReactNode, options: SatoriOptions) {
  const svg = await renderSvg(element, options);
  return renderPngFromSvg(svg);
}

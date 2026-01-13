import satori, { init as initSatori } from "satori/standalone";
import type { ReactNode } from "react";
import type { SatoriOptions } from "satori/standalone";
import { loadYogaWasm } from "./yoga.workerd";

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

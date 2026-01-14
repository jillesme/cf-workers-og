declare module "node:fs/promises" {
  export function readFile(path: URL): Promise<Uint8Array>;
}

declare module "*.wasm" {
  const wasm: WebAssembly.Module | WebAssembly.Instance;
  export default wasm;
}

declare module "*.wasm?url" {
  const wasm: string;
  export default wasm;
}

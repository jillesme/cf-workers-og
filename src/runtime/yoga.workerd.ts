import yogaWasmModule from "../wasm/yoga.wasm";

export async function loadYogaWasm(): Promise<
  WebAssembly.Module | WebAssembly.Instance
> {
  if (typeof WebAssembly === "undefined") {
    throw new Error("cf-workers-og: WebAssembly is not available");
  }

  if (
    yogaWasmModule instanceof WebAssembly.Module ||
    yogaWasmModule instanceof WebAssembly.Instance
  ) {
    return yogaWasmModule;
  }

  throw new Error(
    "cf-workers-og: expected yoga.wasm to be a WebAssembly.Module"
  );
}

export type ExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

class CacheUtils {
  private waitUntilFn?: (promise: Promise<unknown>) => void;

  setExecutionContext(ctx: ExecutionContext) {
    if (typeof ctx?.waitUntil !== "function") {
      throw new TypeError(
        "cf-workers-og: cache.setExecutionContext expected a waitUntil function"
      );
    }
    this.waitUntilFn = (promise) => ctx.waitUntil(promise);
  }

  waitUntil(promise: Promise<unknown>) {
    if (this.waitUntilFn) {
      this.waitUntilFn(promise);
    }
  }
}

export const cache = new CacheUtils();

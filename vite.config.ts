import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: "./src/index.ts",
        "index.node": "./src/index.node.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "@cf-wasm/og",
        "@cf-wasm/og/workerd",
        "@cf-wasm/og/node",
        "htmlparser2",
        "style-to-js",
        "react",
        "react/jsx-runtime",
      ],
    },
    minify: false,
    sourcemap: true,
  },
});

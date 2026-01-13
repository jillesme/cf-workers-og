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
        html: "./src/html.ts",
        "html.node": "./src/html.node.ts",
        compat: "./src/compat.ts",
        "compat.node": "./src/compat.node.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "htmlparser2",
        "style-to-js",
        "react",
        "react/jsx-runtime",
        "satori",
        "satori/standalone",
        "node:fs/promises",
        /\.wasm$/,
      ],
    },
    minify: false,
    sourcemap: true,
  },
});

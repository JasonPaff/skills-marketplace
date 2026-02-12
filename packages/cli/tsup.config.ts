import { defineConfig } from "tsup";

export default defineConfig({
  banner: {
    js: [
      "#!/usr/bin/env node",
      'import { createRequire as __cjsCreateRequire } from "node:module";',
      "const require = __cjsCreateRequire(import.meta.url);",
    ].join("\n"),
  },
  clean: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  noExternal: [/@emergent\/.*/],
  sourcemap: true,
});

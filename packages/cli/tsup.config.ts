import { defineConfig } from "tsup";

export default defineConfig({
  banner: {
    js: "#!/usr/bin/env node",
  },
  clean: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  noExternal: ["@emergent/api", "@emergent/shared"],
  sourcemap: true,
});

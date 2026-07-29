import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/utils.ts",
        "src/lib/permissions.ts",
        "src/lib/error-handler.ts",
        "src/lib/geography.ts",
        "src/lib/privacy.ts",
        "src/ai/anpr/normalization.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

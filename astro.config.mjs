// @ts-check
import { defineConfig } from "astro/config"
// https://astro.build/config
export default defineConfig({
  compressHTML: false,
  // Disable dev toolbar in development mode
  devToolbar: {
    enabled: false,
  },
  build: {
    format: "preserve",
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // additionalData: `@import "src/styles/tokens/tokens;\n`,
        },
      },
    },
  },
})

import "astro/config"

declare module "astro/config" {
  interface BuildOptions {
    format?: "file" | "directory" | "preserve"
  }
}

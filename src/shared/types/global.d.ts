import type { StemApi } from "./stem-api";

declare global {
  interface Window {
    stemApi: StemApi;
  }
}

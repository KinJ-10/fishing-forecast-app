/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORECAST_REPOSITORY_MODE?: string;
  readonly VITE_JMA_TIDE_FETCH_MODE?: "auto" | "direct" | "proxy";
}

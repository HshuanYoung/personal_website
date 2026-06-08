/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ASSETS_BASE_URL?: string;
  readonly VITE_ICP_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

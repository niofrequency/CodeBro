/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_XAI_API_KEY: string;
  // add other env variables here...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
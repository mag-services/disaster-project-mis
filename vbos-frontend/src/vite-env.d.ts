/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional URL to TASKS.md / roadmap page. Shown in shell nav placeholder toasts. */
  readonly VITE_ROADMAP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

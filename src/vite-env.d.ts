/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Địa chỉ backend, mặc định http://localhost:8080. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

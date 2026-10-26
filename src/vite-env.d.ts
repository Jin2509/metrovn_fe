/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "false" để ẩn khối tài khoản demo ở trang đăng nhập. */
  readonly VITE_SHOW_DEMO_ACCOUNTS?: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

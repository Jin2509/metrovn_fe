import { createStore } from "@/lib/store";
import { isRole } from "./permissions";
import type { AuthState, Session, SessionUser } from "./auth.types";

const STORAGE_KEY = "metro.session.v1";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/**
 * Trạng thái đăng nhập. Khởi tạo là "loading" cả ở server lẫn lần render đầu tiên ở client
 * (tránh lệch hydration); phiên thật được đọc từ storage trong `hydrateSession()` sau khi mount.
 */
export const authStore = createStore<AuthState>({ status: "loading", user: null });

const ANONYMOUS: AuthState = { status: "anonymous", user: null };

function storages(): Storage[] {
  try {
    return typeof window === "undefined" ? [] : [window.sessionStorage, window.localStorage];
  } catch {
    return [];
  }
}

function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<Session>;
    const u = data.user as Partial<SessionUser> | undefined;
    if (
      !u ||
      typeof u.id !== "string" ||
      typeof u.name !== "string" ||
      typeof u.email !== "string" ||
      !isRole(u.role) ||
      typeof data.issuedAt !== "number" ||
      typeof data.expiresAt !== "number" ||
      data.expiresAt <= Date.now()
    )
      return null;
    return data as Session;
  } catch {
    return null;
  }
}

function readSession(): Session | null {
  for (const s of storages()) {
    try {
      const session = parseSession(s.getItem(STORAGE_KEY));
      if (session) return session;
    } catch {
      /* storage bị chặn — coi như chưa đăng nhập */
    }
  }
  return null;
}

function writeSession(session: Session, remember: boolean) {
  clearStoredSession();
  try {
    const [tab, persistent] = storages();
    (remember ? persistent : tab)?.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* không ghi được thì phiên chỉ sống trong bộ nhớ */
  }
}

function clearStoredSession() {
  for (const s of storages()) {
    try {
      s.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
}

// ---- hết hạn phiên ----
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
const expiryHandlers = new Set<() => void>();

function scheduleExpiry(session: Session | null) {
  clearTimeout(expiryTimer);
  if (!session) return;
  expiryTimer = setTimeout(
    () => {
      endSession("expired");
      expiryHandlers.forEach((fn) => fn());
    },
    Math.max(0, session.expiresAt - Date.now()),
  );
}

/** Đọc lại phiên từ storage (gọi một lần khi app mount, và khi tab khác đăng nhập/đăng xuất). */
export function hydrateSession() {
  const session = readSession();
  authStore.set(() => (session ? { status: "authenticated", user: session.user } : ANONYMOUS));
  scheduleExpiry(session);
}

export function startSession(user: SessionUser, remember: boolean) {
  const issuedAt = Date.now();
  const session: Session = { user, issuedAt, expiresAt: issuedAt + SESSION_TTL_MS };
  writeSession(session, remember);
  authStore.set(() => ({ status: "authenticated", user }));
  scheduleExpiry(session);
}

export function endSession(endedBy: "logout" | "expired" = "logout") {
  clearStoredSession();
  clearTimeout(expiryTimer);
  authStore.set(() => ({ ...ANONYMOUS, endedBy }));
}

/**
 * Theo dõi phiên ở client: báo khi phiên hết hạn, đồng bộ đăng nhập/đăng xuất giữa các tab.
 * Trả về hàm dọn dẹp để dùng trong useEffect.
 */
export function watchSession(onExpire: () => void) {
  expiryHandlers.add(onExpire);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) hydrateSession();
  };
  const onFocus = () => {
    // Timer có thể bị trình duyệt trì hoãn khi tab ở nền — kiểm tra lại khi quay lại.
    if (authStore.get().status === "authenticated" && !readSession()) {
      endSession("expired");
      onExpire();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocus);
  return () => {
    expiryHandlers.delete(onExpire);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onFocus);
  };
}

/** Cập nhật thông tin người dùng trong phiên hiện tại (sau khi sửa hồ sơ), giữ nguyên nơi lưu phiên. */
export function updateSessionUser(patch: Partial<Pick<SessionUser, "name" | "phone">>) {
  const current = authStore.get().user;
  if (!current) return;
  const user = { ...current, ...patch };
  for (const s of storages()) {
    try {
      const session = parseSession(s.getItem(STORAGE_KEY));
      if (session) s.setItem(STORAGE_KEY, JSON.stringify({ ...session, user }));
    } catch {
      /* ignore */
    }
  }
  authStore.set((state) => ({ ...state, user }));
}

/** Tên người đang thao tác — dùng cho nhật ký hệ thống và người duyệt/đối soát. */
export function getActorName(): string {
  return authStore.get().user?.name ?? "Hệ thống";
}

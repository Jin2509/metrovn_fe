import { parseISO } from "date-fns";
import { createStore } from "@/lib/store";
import { isRole } from "./permissions";
import type { AuthState, Session, SessionTokens, SessionUser } from "./auth.types";

const STORAGE_KEY = "metro.session.v1";

type TokenPayload = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

/**
 * Trạng thái đăng nhập. Khởi tạo là "loading" cả ở server lẫn lần render đầu tiên ở client
 * (tránh lệch hydration); phiên thật được đọc từ storage trong `hydrateSession()` sau khi mount.
 */
export const authStore = createStore<AuthState>({ status: "loading", user: null });

const ANONYMOUS: AuthState = { status: "anonymous", user: null };

/** Phiên khi storage bị chặn: chỉ sống trong bộ nhớ của tab này. */
let memorySession: Session | null = null;

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
      !Array.isArray(u.permissions) ||
      typeof data.accessToken !== "string" ||
      typeof data.refreshToken !== "string" ||
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
  return memorySession && memorySession.expiresAt > Date.now() ? memorySession : null;
}

function writeSession(session: Session, remember: boolean) {
  clearStoredSession();
  try {
    const [tab, persistent] = storages();
    (remember ? persistent : tab).setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    memorySession = session; // không ghi được thì phiên chỉ sống trong bộ nhớ
  }
}

/** Sửa phiên hiện tại, giữ nguyên nơi lưu phiên. */
function patchSession(patch: Partial<Session>): Session | null {
  const current = readSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  if (memorySession) memorySession = next;
  for (const s of storages()) {
    try {
      if (parseSession(s.getItem(STORAGE_KEY))) s.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  return next;
}

function clearStoredSession() {
  memorySession = null;
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

/** Phiên hết hạn hoặc bị thu hồi: xoá token, báo cho người dùng và về màn đăng nhập. */
export function expireSession() {
  endSession("expired");
  expiryHandlers.forEach((fn) => fn());
}

function scheduleExpiry(session: Session | null) {
  clearTimeout(expiryTimer);
  if (!session) return;
  expiryTimer = setTimeout(expireSession, Math.max(0, session.expiresAt - Date.now()));
}

/** Đọc lại phiên từ storage (gọi một lần khi app mount, và khi tab khác đăng nhập/đăng xuất). */
export function hydrateSession() {
  const session = readSession();
  authStore.set(() => (session ? { status: "authenticated", user: session.user } : ANONYMOUS));
  scheduleExpiry(session);
}

/** Phiên sống theo refresh token (14 ngày, tính lại sau mỗi lần refresh). */
const toTokenFields = (tokens: TokenPayload): SessionTokens & Pick<Session, "expiresAt"> => ({
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  expiresAt: parseISO(tokens.refreshTokenExpiresAt).getTime(),
});

export function startSession(user: SessionUser, tokens: TokenPayload, remember: boolean) {
  const session: Session = { user, ...toTokenFields(tokens) };
  writeSession(session, remember);
  authStore.set(() => ({ status: "authenticated", user }));
  scheduleExpiry(session);
}

export function endSession(endedBy: "logout" | "expired" = "logout") {
  clearStoredSession();
  clearTimeout(expiryTimer);
  authStore.set(() => ({ ...ANONYMOUS, endedBy }));
}

/** Token của phiên hiện tại. Luôn đọc từ storage để thấy token mới mà tab khác vừa lưu. */
export function getSessionTokens(): SessionTokens | null {
  const session = readSession();
  return session && { accessToken: session.accessToken, refreshToken: session.refreshToken };
}

/** Lưu cặp token mới sau khi refresh. Bỏ qua nếu phiên đã kết thúc trong lúc chờ (vd. đăng xuất). */
export function updateSessionTokens(tokens: TokenPayload) {
  scheduleExpiry(patchSession(toTokenFields(tokens)));
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

/** Cập nhật thông tin người dùng trong phiên hiện tại, giữ nguyên nơi lưu phiên. */
export function updateSessionUser(patch: Partial<SessionUser>) {
  const current = authStore.get().user;
  if (!current) return;
  const user = { ...current, ...patch };
  patchSession({ user });
  authStore.set((state) => ({ ...state, user }));
}

/** Tên người đang thao tác — dùng cho nhật ký hệ thống và người duyệt/đối soát. */
export function getActorName(): string {
  return authStore.get().user?.name ?? "Hệ thống";
}

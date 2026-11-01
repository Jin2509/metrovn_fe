import { expireSession, getSessionTokens, updateSessionTokens } from "@/lib/auth/session.store";
import { ApiError, NETWORK_ERROR_STATUS } from "./errors";
import type { TokenResponse } from "./types";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

const REFRESH_LOCK = "metro.auth.refresh";

type QueryValue = string | number | undefined;

export type ApiRequest = {
  method?: "GET" | "POST" | "PUT" | "PATCH";
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** false: không dùng token của phiên và không refresh khi gặp 401 (đăng nhập, API /api/auth). */
  auth?: boolean;
  /** Dùng token này thay cho token của phiên (`auth` phải là false). */
  token?: string;
};

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {}))
    if (value !== undefined && value !== "") params.set(key, String(value));
  const search = params.toString();
  return `${API_BASE_URL}${path}${search ? `?${search}` : ""}`;
}

/** Chỉ ở môi trường dev, và không in query, body hay token. */
function logCall(request: ApiRequest, path: string, result: number | string) {
  if (import.meta.env.DEV) console.info(`[API] ${request.method ?? "GET"} ${path} → ${result}`);
}

// Không gửi `credentials`: backend không dùng cookie, và CORS sẽ chặn nếu bật.
// Chỉ được thêm `Authorization` và `Content-Type`, header khác bị trình duyệt chặn.
async function send(path: string, request: ApiRequest, token?: string) {
  const headers: Record<string, string> = {};
  if (request.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const response = await fetch(buildUrl(path, request.query), {
      method: request.method ?? "GET",
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
    });
    logCall(request, path, response.status);
    return response;
  } catch {
    logCall(request, path, "không kết nối được");
    throw new ApiError(NETWORK_ERROR_STATUS);
  }
}

/** Body có thể rỗng (204, hoặc 401/403 từ lớp bảo mật), nên luôn kiểm tra trước khi parse. */
async function readJson(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => "");
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function toApiError(response: Response) {
  const problem = (await readJson(response)) as
    { detail?: unknown; errors?: Record<string, string> } | undefined;
  const retryAfter = Number(response.headers.get("Retry-After"));
  return new ApiError(
    response.status,
    typeof problem?.detail === "string" ? problem.detail : undefined,
    problem?.errors ?? {},
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  );
}

// ---- làm mới token ----
// Refresh token chỉ dùng được một lần: gửi lại token cũ sẽ làm backend thu hồi cả phiên.
// Nên trong một tab chỉ có một request refresh (`inFlight`), giữa các tab thì dùng Web Locks.
let inFlight: Promise<string> | null = null;

/** Quyền của người dùng có thể đã đổi: gọi sau khi refresh hoặc khi gặp 403. */
let onAccessChanged: (() => void) | undefined;

export function setAccessChangedHandler(handler: (() => void) | undefined) {
  onAccessChanged = handler;
}

function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  // navigator.locks chỉ có trong secure context (https, localhost).
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  return locks ? (locks.request(REFRESH_LOCK, task) as Promise<T>) : task();
}

async function runRefresh(staleAccessToken: string): Promise<string> {
  // Đọc lại sau khi có lock: tab khác có thể vừa refresh xong và lưu token mới.
  const tokens = getSessionTokens();
  if (!tokens) throw new ApiError(401);
  if (tokens.accessToken !== staleAccessToken) return tokens.accessToken;

  const response = await send("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken: tokens.refreshToken },
  });
  if (response.ok) {
    const next = (await response.json()) as TokenResponse;
    updateSessionTokens(next);
    onAccessChanged?.();
    return next.accessToken;
  }
  const error = await toApiError(response);
  if (response.status === 401 || response.status === 403) expireSession();
  throw error; // 5xx: giữ nguyên token, chưa đăng xuất.
}

function refreshAccessToken(staleAccessToken: string): Promise<string> {
  const tokens = getSessionTokens();
  if (!tokens) return Promise.reject(new ApiError(401));
  // Request này gửi bằng token cũ và trả về sau khi đã có token mới: không cần refresh nữa.
  if (tokens.accessToken !== staleAccessToken) return Promise.resolve(tokens.accessToken);
  inFlight ??= withRefreshLock(() => runRefresh(staleAccessToken)).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Gọi API: gắn token, tự refresh và gọi lại đúng 1 lần khi gặp 401, chuẩn hoá lỗi thành ApiError. */
export async function apiRequest<T = void>(path: string, request: ApiRequest = {}): Promise<T> {
  const useSession = request.auth !== false;
  const token = useSession ? getSessionTokens()?.accessToken : request.token;
  if (useSession && !token) throw new ApiError(401);

  let response = await send(path, request, token);
  if (useSession && response.status === 401)
    response = await send(path, request, await refreshAccessToken(token as string));

  if (!response.ok) {
    if (useSession && response.status === 403) onAccessChanged?.();
    throw await toApiError(response);
  }
  return (await readJson(response)) as T;
}

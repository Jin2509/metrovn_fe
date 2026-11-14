import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hydrateSession, startSession } from "@/lib/auth/session.store";
import {
  authApi,
  bannersApi,
  campaignsApi,
  incidentsApi,
  isTwoFactorChallenge,
  operationConfigsApi,
  reportsApi,
  studentPolicyApi,
  systemParamsApi,
  ticketProductsApi,
  trainsApi,
  transactionsApi,
} from "./index";

const FUTURE = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  hydrateSession();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  startSession(
    { id: "1", name: "An", email: "an@metro.vn", role: "ADMIN", permissions: [] },
    { accessToken: "access-1", refreshToken: "refresh-1", refreshTokenExpiresAt: FUTURE },
    true,
  );
});

afterEach(() => vi.unstubAllGlobals());

const call = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i];
  const headers = (init?.headers ?? {}) as Record<string, string>;
  return {
    url: String(url).replace("http://localhost:8080", ""),
    method: init?.method ?? "GET",
    rawBody: init?.body,
    body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    headers,
  };
};

describe("apiRequest: multipart và tải file", () => {
  it("gửi FormData nguyên vẹn, không tự đặt Content-Type JSON", async () => {
    const image = new Blob(["x"], { type: "image/png" });
    await bannersApi.create({ image, title: "Khai trương", position: 2 });
    const { url, method, rawBody, headers } = call();
    expect(url).toBe("/api/content/banners");
    expect(method).toBe("POST");
    expect(rawBody).toBeInstanceOf(FormData);
    expect((rawBody as FormData).get("title")).toBe("Khai trương");
    expect((rawBody as FormData).get("position")).toBe("2");
    expect((rawBody as FormData).has("subtitle")).toBe(false);
    expect(headers["Content-Type"]).toBeUndefined();
    expect(headers.Authorization).toBe("Bearer access-1");
  });

  it("responseType blob trả về Blob, kèm query của báo cáo", async () => {
    fetchMock.mockResolvedValue(new Response("xlsx", { status: 200 }));
    const file = await reportsApi.exportRevenue({
      from: "2026-11-01",
      to: "2026-11-15",
      groupBy: "MONTH",
      format: "pdf",
    });
    expect(file).toBeInstanceOf(Blob);
    expect(file.size).toBe(4);
    expect(call().url).toBe(
      "/api/v1/reports/revenue/export?from=2026-11-01&to=2026-11-15&groupBy=MONTH&format=pdf",
    );
  });

  it("ảnh sự cố đọc dạng Blob", async () => {
    fetchMock.mockResolvedValue(new Response(new Blob(["img"]), { status: 200 }));
    await expect(incidentsApi.image(7)).resolves.toBeInstanceOf(Blob);
    expect(call().url).toBe("/api/v1/incidents/7/image");
  });
});

describe("API nghiệp vụ", () => {
  it("đổi trạng thái tàu gửi chuỗi trần", async () => {
    await trainsApi.setStatus(3, "MAINTENANCE");
    expect(call()).toMatchObject({
      url: "/api/v1/trains/3/status",
      method: "PATCH",
      body: "MAINTENANCE",
    });
  });

  it("cấu hình vận hành: tạo theo tuyến, từ chối kèm lý do, lọc trạng thái", async () => {
    await operationConfigsApi.list("PENDING_APPROVAL");
    await operationConfigsApi.create(2, {
      numberOfTrains: 10,
      headwayMinutes: 6,
      runningTimeMinutes: 33,
      startTime: "05:00",
      endTime: "22:00",
      effectiveFrom: "2026-12-01T00:00:00Z",
    });
    await operationConfigsApi.reject(9, "Thiếu nhân sự");
    expect(call(0).url).toBe("/api/v1/operation-configs?status=PENDING_APPROVAL");
    expect(call(1)).toMatchObject({ url: "/api/v1/lines/2/operation-configs", method: "POST" });
    expect(call(2)).toMatchObject({
      url: "/api/v1/operation-configs/9/reject",
      method: "POST",
      body: { reason: "Thiếu nhân sự" },
    });
  });

  it("sửa loại vé gửi kèm version; loại vé công khai không gửi token", async () => {
    await ticketProductsApi.update(4, { version: 3, priceVnd: 45000 });
    await ticketProductsApi.publicList();
    expect(call(0)).toMatchObject({
      url: "/api/v1/ticket-products/4",
      method: "PUT",
      body: { version: 3, priceVnd: 45000 },
    });
    expect(call(1).url).toBe("/api/v1/public/ticket-products");
    expect(call(1).headers.Authorization).toBeUndefined();
  });

  it("chiến dịch: sửa bọc trong `campaign`, gửi hẹn giờ kèm version", async () => {
    const body = { title: "T", body: "B", type: "PROMOTION", audienceType: "ALL" } as const;
    await campaignsApi.update("c-1", 5, body);
    await campaignsApi.send("c-1", 6, "2026-12-01T01:00:00Z");
    expect(call(0)).toMatchObject({
      url: "/api/v1/admin/notification-campaigns/c-1",
      body: { version: 5, campaign: body },
    });
    expect(call(1)).toMatchObject({
      url: "/api/v1/admin/notification-campaigns/c-1/send",
      body: { version: 6, scheduledAt: "2026-12-01T01:00:00Z" },
    });
  });

  it("giao dịch, đối soát, tham số hệ thống, chính sách sinh viên", async () => {
    await transactionsApi.list({ from: "2026-11-01", status: "SUCCEEDED", page: 1 });
    await transactionsApi.reconcile("2026-11-01T00:00:00Z", "2026-11-02T00:00:00Z");
    await systemParamsApi.update("CPOINT_PER_CHECKIN", { value: 60 });
    await studentPolicyApi.update({ version: 2, discountPercent: 30 });
    expect(call(0).url).toBe("/api/v1/admin/transactions?from=2026-11-01&status=SUCCEEDED&page=1");
    expect(call(1)).toMatchObject({ url: "/api/v1/admin/reconciliations", method: "POST" });
    expect(call(2)).toMatchObject({
      url: "/api/v1/admin/system-params/CPOINT_PER_CHECKIN",
      method: "PUT",
      body: { value: 60 },
    });
    expect(call(3)).toMatchObject({ url: "/api/v1/admin/student-policy", method: "PUT" });
  });
});

describe("đăng nhập 2FA", () => {
  it("nhận diện phản hồi yêu cầu mã OTP", async () => {
    const challenge = { twoFactorRequired: true, ticket: "t", expiresAt: FUTURE };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(challenge), { status: 200 }));
    const result = await authApi.login({ email: "a@metro.vn", password: "x" });
    expect(isTwoFactorChallenge(result)).toBe(true);
    expect(call().headers.Authorization).toBeUndefined();
  });
});

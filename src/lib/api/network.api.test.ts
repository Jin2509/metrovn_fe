import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hydrateSession, startSession } from "@/lib/auth/session.store";
import { linesApi, publicLinesApi, stationsApi } from "./index";

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
    {
      accessToken: "access-1",
      refreshToken: "refresh-1",
      refreshTokenExpiresAt: FUTURE,
    },
    true,
  );
});

afterEach(() => vi.unstubAllGlobals());

const call = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i];
  const headers = (init?.headers ?? {}) as Record<string, string>;
  return {
    url: String(url).replace("http://localhost:8080", ""),
    method: init?.method,
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
    auth: headers.Authorization,
  };
};

describe("network API", () => {
  it("sắp xếp ga gửi mảng trần (không bọc object) bằng PUT", async () => {
    await linesApi.reorder(1, [
      { stationId: 2, stationOrder: 1 },
      { stationId: 1, stationOrder: 2 },
    ]);
    expect(call()).toMatchObject({
      url: "/api/v1/lines/1/stations/order",
      method: "PUT",
      body: [
        { stationId: 2, stationOrder: 1 },
        { stationId: 1, stationOrder: 2 },
      ],
      auth: "Bearer access-1",
    });
  });

  it("gỡ ga khỏi tuyến dùng DELETE", async () => {
    await linesApi.removeStation(3, 15);
    expect(call()).toMatchObject({ url: "/api/v1/lines/3/stations/15", method: "DELETE" });
  });

  it("tìm ga gần nhất truyền lat/lng/radiusKm", async () => {
    await stationsApi.nearest(10.77, 106.69, 2);
    expect(call().url).toBe("/api/v1/stations/nearest?lat=10.77&lng=106.69&radiusKm=2");
  });

  it("API công khai không gửi token", async () => {
    await publicLinesApi.stations("BTS-01");
    expect(call()).toMatchObject({ url: "/api/v1/public/lines/BTS-01/stations", auth: undefined });
  });
});

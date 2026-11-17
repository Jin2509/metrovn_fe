import { describe, expect, it } from "vitest";

import { ApiError, type StationResponse } from "@/lib/api";
import {
  buildUpdateStationBody,
  stationErrorsFromApi,
  stationWarnings,
  toStationDraft,
  validateStationDraft,
} from "@/pages/stations/stations.service";

const station: StationResponse = {
  id: 1,
  code: "ST001",
  nameStation: "Bến Thành",
  latitude: 10.7709609,
  longitude: 106.6977577,
  address: "Quận 1",
  district: "Quận 1",
  imageUrl: null,
  isInterchange: true,
  status: "ACTIVE",
  createdAt: "",
  updatedAt: "",
};

describe("buildUpdateStationBody", () => {
  it("không đổi gì → body rỗng", () => {
    expect(buildUpdateStationBody(toStationDraft(station), station)).toEqual({});
  });

  it("chỉ gửi field đã đổi, xoá trắng field tuỳ chọn gửi chuỗi rỗng", () => {
    const draft = { ...toStationDraft(station), name: " Ga Bến Thành ", address: "", lat: "10.8" };
    expect(buildUpdateStationBody(draft, station)).toEqual({
      nameStation: "Ga Bến Thành",
      address: "",
      latitude: 10.8,
    });
  });
});

describe("validateStationDraft", () => {
  it("bắt trùng mã (không phân biệt hoa thường), toạ độ sai", () => {
    const draft = { ...toStationDraft(station), code: "st001", lat: "", lng: "200" };
    expect(validateStationDraft(draft, [station])).toMatchObject({
      code: "Mã ga đã tồn tại",
      lat: expect.any(String),
      lng: expect.any(String),
    });
    expect(validateStationDraft(toStationDraft(station), [station], station.id)).toEqual({});
  });

  it("mã phải là chữ in hoa/số/gạch; tên không trùng ga khác; ảnh phải là http(s)", () => {
    const draft = {
      ...toStationDraft(station),
      code: "ST 02",
      name: "bến thành",
      imageUrl: "ftp://x",
      lat: "10.9",
    };
    expect(validateStationDraft(draft, [station])).toMatchObject({
      code: expect.stringContaining("chữ in hoa"),
      name: "Tên ga đã dùng cho ga ST001",
      imageUrl: expect.stringContaining("http"),
    });
    expect(
      validateStationDraft({ ...draft, code: "ST-02", name: "Ga mới", imageUrl: "" }, [station]),
    ).toEqual({});
  });

  it("toạ độ ngoài Việt Nam hoặc trùng vị trí ga khác thì chặn; gần ga khác thì chỉ cảnh báo", () => {
    const base = { ...toStationDraft(station), code: "ST002", name: "Ga khác" };
    // Toạ độ Bangkok: nằm ngoài Việt Nam.
    expect(validateStationDraft({ ...base, lat: "13.75", lng: "100.5" }, [station]).lat).toMatch(
      /ngoài Việt Nam/,
    );
    // Cách ga Bến Thành vài mét: coi như trùng.
    expect(
      validateStationDraft({ ...base, lat: "10.77097", lng: "106.69776" }, [station]).lat,
    ).toMatch(/Trùng vị trí với ga ST001/);
    // Cách khoảng 100 m: hợp lệ nhưng cảnh báo.
    const near = { ...base, lat: "10.7718", lng: "106.6978" };
    expect(validateStationDraft(near, [station])).toEqual({});
    expect(stationWarnings(near, [station])).toEqual([expect.stringMatching(/cách ga ST001/)]);
    // Sửa chính ga đó thì không tự so với mình.
    expect(validateStationDraft(toStationDraft(station), [station], station.id)).toEqual({});
  });

  it("cảnh báo ngoài TP.HCM và thiếu địa chỉ (chỉ khi được yêu cầu)", () => {
    const hanoi = {
      ...toStationDraft(station),
      code: "HN01",
      name: "Cát Linh",
      lat: "21.03",
      lng: "105.82",
      address: "",
    };
    expect(stationWarnings(hanoi, [station], undefined, { includeMissing: false })).toEqual([
      expect.stringMatching(/ngoài khu vực TP.HCM/),
    ]);
    expect(stationWarnings(hanoi, [station])).toHaveLength(2);
  });
});

describe("stationErrorsFromApi", () => {
  it("map lỗi 400 theo field và 409 vào ô mã", () => {
    expect(
      stationErrorsFromApi(
        new ApiError(400, "Dữ liệu không hợp lệ", { nameStation: "must not be blank" }),
      ),
    ).toEqual({ name: "must not be blank" });
    expect(stationErrorsFromApi(new ApiError(409, "Mã ga đã tồn tại"))).toEqual({
      code: "Mã ga đã tồn tại",
    });
    expect(stationErrorsFromApi(new ApiError(500))).toBeNull();
  });
});

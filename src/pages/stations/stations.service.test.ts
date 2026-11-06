import { describe, expect, it } from "vitest";

import { ApiError, type StationResponse } from "@/lib/api";
import {
  buildUpdateStationBody,
  stationErrorsFromApi,
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

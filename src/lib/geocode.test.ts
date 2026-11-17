import { describe, expect, it } from "vitest";

import { joinAddress, toPlace } from "@/lib/geocode";

const feature = (properties: Record<string, unknown>, coordinates: [number, number]) => ({
  properties,
  geometry: { coordinates },
});

describe("toPlace", () => {
  it("POI: tên + số nhà đường + phường + thành phố, toạ độ [lng, lat] → {lat, lng}", () => {
    const place = toPlace(
      feature(
        {
          osm_type: "W",
          osm_id: 1,
          osm_key: "amenity",
          osm_value: "theatre",
          type: "house",
          name: "Nhà hát Thành phố",
          housenumber: "7",
          street: "Công trường Lam Sơn",
          district: "Sài Gòn",
          city: "Thành phố Hồ Chí Minh",
        },
        [106.7032488, 10.7767437],
      ),
    );
    expect(place).toMatchObject({
      id: "W1",
      name: "Nhà hát Thành phố",
      address: "Nhà hát Thành phố, 7 Công trường Lam Sơn, Sài Gòn, Thành phố Hồ Chí Minh",
      district: "Sài Gòn",
      lat: 10.7767437,
      lng: 106.7032488,
      kind: "amenity/theatre",
    });
  });

  it("đường: không lặp tên đường; phường trùng tên địa điểm chỉ ghi một lần", () => {
    expect(
      toPlace(
        feature(
          {
            type: "street",
            name: "Trần Hưng Đạo",
            street: "Trần Hưng Đạo",
            district: "Bến Thành",
            city: "Thành phố Hồ Chí Minh",
          },
          [106.69, 10.77],
        ),
      )?.address,
    ).toBe("Trần Hưng Đạo, Bến Thành, Thành phố Hồ Chí Minh");
    expect(
      toPlace(
        feature(
          {
            type: "district",
            name: "Bến Thành",
            district: "Bến Thành",
            city: "Thành phố Hồ Chí Minh",
          },
          [106.69, 10.77],
        ),
      )?.address,
    ).toBe("Bến Thành, Thành phố Hồ Chí Minh");
  });

  it("thiếu toạ độ → null; thiếu phường thì lấy quận/huyện (county)", () => {
    expect(
      toPlace({
        properties: { name: "x" },
        geometry: { coordinates: [] as unknown as [number, number] },
      }),
    ).toBeNull();
    expect(
      toPlace(
        feature({ name: "Chợ", county: "Củ Chi", city: "Thành phố Hồ Chí Minh" }, [106.5, 11]),
      )?.district,
    ).toBe("Củ Chi");
  });
});

describe("joinAddress", () => {
  it("bỏ phần trống và trùng, không phân biệt hoa thường", () => {
    expect(joinAddress(["Bến Thành", "", " bến thành ", "Quận 1"])).toBe("Bến Thành, Quận 1");
  });
});

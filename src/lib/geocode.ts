// Gợi ý địa điểm và tra địa chỉ từ toạ độ bằng Photon (komoot, dữ liệu OpenStreetMap).
// Không cần khoá API và cho phép tìm khi đang gõ (Nominatim cấm dùng cho autocomplete).
// Chỉ gửi đúng chuỗi người dùng gõ, không kèm thông tin phiên đăng nhập.

export type Place = {
  id: string;
  /** Tên địa điểm (POI, tên đường, tên phường…). */
  name: string;
  /** Địa chỉ gọn để lưu vào ô "Địa chỉ": tên, số nhà + đường, phường/xã, thành phố. */
  address: string;
  /** Phường/xã (sau sáp nhập 2025 TP.HCM không còn cấp quận) hoặc quận/huyện nếu OSM có. */
  district: string;
  city: string;
  lat: number;
  lng: number;
  /** Loại đối tượng OSM, ví dụ `railway/station`, `amenity/theatre`, `highway/residential`. */
  kind: string;
};

export type PhotonFeature = {
  properties: Record<string, unknown>;
  geometry: { coordinates: [number, number] };
};

const PHOTON = "https://photon.komoot.io";
/** Khung Việt Nam (minLng,minLat,maxLng,maxLat): Photon lọc cứng theo bbox. */
const VIETNAM_BBOX = "102,8,110,24";
export const HCMC_CENTER = { lat: 10.7769, lng: 106.7009 };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const sameText = (a: string, b: string) => a.localeCompare(b, "vi", { sensitivity: "base" }) === 0;

/** Ghép các phần địa chỉ, bỏ phần trống và phần trùng (không phân biệt hoa thường/dấu). */
export function joinAddress(parts: string[]) {
  const out: string[] = [];
  for (const part of parts.map((p) => p.trim()).filter(Boolean))
    if (!out.some((p) => sameText(p, part))) out.push(part);
  return out.join(", ");
}

/** Một kết quả Photon → `Place`; `null` nếu thiếu toạ độ. */
export function toPlace(feature: PhotonFeature): Place | null {
  const p = feature.properties;
  const [lng, lat] = feature.geometry?.coordinates ?? [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const name = str(p.name);
  const street = str(p.street);
  const streetLine = [str(p.housenumber), street].filter(Boolean).join(" ");
  const district = str(p.district) || str(p.county);
  const city = str(p.city) || str(p.state);
  const type = str(p.type);
  // Với bản ghi "đường" tên chính là tên đường nên không lặp lại; POI thì giữ cả tên lẫn đường.
  const address = joinAddress([
    name,
    type === "street" || sameText(name, street) ? "" : streetLine,
    district,
    city,
  ]);
  return {
    id: p.osm_id == null ? `${lat},${lng}` : `${str(p.osm_type)}${String(p.osm_id)}`,
    name: name || streetLine || district,
    address,
    district,
    city,
    lat,
    lng,
    kind: [str(p.osm_key), str(p.osm_value)].filter(Boolean).join("/"),
  };
}

async function fetchPlaces(url: string, signal?: AbortSignal): Promise<Place[]> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Dịch vụ gợi ý địa điểm tạm thời không phản hồi");
  const data = (await response.json()) as { features?: PhotonFeature[] };
  const seen = new Set<string>();
  return (data.features ?? []).flatMap((feature) => {
    const place = toPlace(feature);
    if (!place || seen.has(place.address)) return [];
    seen.add(place.address);
    return [place];
  });
}

/** Tìm địa điểm theo chữ đang gõ, ưu tiên quanh `near` (mặc định trung tâm TP.HCM), chỉ trong Việt Nam. */
export function searchPlaces(
  query: string,
  {
    near = HCMC_CENTER,
    limit = 6,
    signal,
  }: { near?: { lat: number; lng: number }; limit?: number; signal?: AbortSignal } = {},
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return Promise.resolve([]);
  const params = new URLSearchParams({
    q,
    limit: String(limit),
    lang: "default", // tên theo ngôn ngữ địa phương (tiếng Việt có dấu)
    lat: String(near.lat),
    lon: String(near.lng),
    zoom: "12",
    location_bias_scale: "0.4",
    bbox: VIETNAM_BBOX,
  });
  return fetchPlaces(`${PHOTON}/api/?${params}`, signal);
}

/** Địa chỉ gần nhất của một toạ độ (khi admin chọn vị trí trên bản đồ). */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<Place | null> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lng), lang: "default" });
  const places = await fetchPlaces(`${PHOTON}/reverse?${params}`, signal);
  return places[0] ?? null;
}

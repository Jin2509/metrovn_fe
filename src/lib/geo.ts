// Dịch vụ bản đồ mở (không cần khóa): Nominatim (tìm địa điểm), OSRM (chỉ đường), Overpass (tiện ích quanh ga).
export type Pt = { lat: number; lng: number; label: string };
export type Mode = "foot" | "bike" | "car";
export type Step = { text: string; distance: number };
export type RouteResult = {
  coords: [number, number][];
  distance: number;
  duration: number;
  steps: Step[];
};

export const haversine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000,
    r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r,
    dLng = (b.lng - a.lng) * r;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export async function searchPlaces(q: string): Promise<Pt[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=vn&viewbox=106.4,11.1,107.0,10.5&bounded=1&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { "Accept-Language": "vi" } });
  if (!r.ok) throw new Error(`Tìm kiếm lỗi (${r.status})`);
  const d: { lat: string; lon: string; display_name: string }[] = await r.json();
  return d.map((x) => ({ lat: +x.lat, lng: +x.lon, label: x.display_name }));
}

const mods: Record<string, string> = {
  left: "trái",
  right: "phải",
  "slight left": "chếch trái",
  "slight right": "chếch phải",
  "sharp left": "gắt trái",
  "sharp right": "gắt phải",
  straight: "thẳng",
  uturn: "quay đầu",
};
function stepText(m: { type: string; modifier?: string }, name: string) {
  const road = name ? ` vào ${name}` : "";
  const dir = m.modifier ? (mods[m.modifier] ?? m.modifier) : "";
  switch (m.type) {
    case "depart":
      return `Xuất phát${name ? ` trên ${name}` : ""}`;
    case "arrive":
      return "Đến nơi";
    case "roundabout":
    case "rotary":
      return `Vào vòng xoay, ra${road}`;
    case "continue":
    case "new name":
      return `Đi tiếp${road}`;
    default:
      return dir === "thẳng" ? `Đi thẳng${road}` : `Rẽ ${dir}${road}`;
  }
}

export async function route(a: Pt, b: Pt, mode: Mode): Promise<RouteResult> {
  const prof = { foot: "routed-foot", bike: "routed-bike", car: "routed-car" }[mode];
  const url = `https://routing.openstreetmap.de/${prof}/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&steps=true`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Không tìm được đường (${r.status})`);
  const d = await r.json();
  const rt = d.routes?.[0];
  if (!rt) throw new Error("Không có tuyến đường phù hợp");
  return {
    coords: rt.geometry.coordinates.map(([x, y]: [number, number]) => [y, x]),
    distance: rt.distance,
    duration: rt.duration,
    steps: rt.legs[0].steps.map(
      (s: { maneuver: { type: string; modifier?: string }; name: string; distance: number }) => ({
        text: stepText(s.maneuver, s.name),
        distance: s.distance,
      }),
    ),
  };
}

export type PoiCat = "bus" | "shop" | "hospital" | "school" | "food" | "bank" | "pharmacy";
export const poiCats: Record<PoiCat, { label: string; icon: string; color: string; q: string }> = {
  bus: { label: "Trạm xe buýt", icon: "🚌", color: "#2f9e44", q: 'node["highway"="bus_stop"]' },
  shop: {
    label: "Cửa hàng",
    icon: "🛍️",
    color: "#7048e8",
    q: 'node["shop"~"convenience|supermarket|mall|department_store"]',
  },
  hospital: {
    label: "Bệnh viện / phòng khám",
    icon: "🏥",
    color: "#e03131",
    q: 'nwr["amenity"~"hospital|clinic"]',
  },
  school: {
    label: "Trường học",
    icon: "🏫",
    color: "#1971c2",
    q: 'nwr["amenity"~"school|university|college"]',
  },
  food: {
    label: "Ăn uống",
    icon: "🍜",
    color: "#f08c00",
    q: 'node["amenity"~"restaurant|cafe|fast_food"]',
  },
  bank: { label: "Ngân hàng / ATM", icon: "🏦", color: "#0c8599", q: 'node["amenity"~"bank|atm"]' },
  pharmacy: { label: "Nhà thuốc", icon: "💊", color: "#c2255c", q: 'node["amenity"="pharmacy"]' },
};
export type Poi = { id: string; cat: PoiCat; name: string; lat: number; lng: number };

const poiCache = new Map<string, Poi[]>();
export async function nearbyPois(lat: number, lng: number, radius = 700): Promise<Poi[]> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)},${radius}`;
  if (poiCache.has(key)) return poiCache.get(key)!;
  const parts = (Object.keys(poiCats) as PoiCat[])
    .map((c) => `${poiCats[c].q}(around:${radius},${lat},${lng});`)
    .join("");
  const body = `[out:json][timeout:25];(${parts});out center 300;`;
  const r = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: new URLSearchParams({ data: body }),
  });
  if (!r.ok) throw new Error(`Không tải được tiện ích (${r.status})`);
  const d: {
    elements: {
      id: number;
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }[];
  } = await r.json();
  const out: Poi[] = [];
  for (const e of d.elements) {
    const t = e.tags ?? {};
    const la = e.lat ?? e.center?.lat,
      lo = e.lon ?? e.center?.lon;
    if (la == null || lo == null) continue;
    const cat: PoiCat =
      t.highway === "bus_stop"
        ? "bus"
        : t.shop
          ? "shop"
          : /hospital|clinic/.test(t.amenity ?? "")
            ? "hospital"
            : /school|university|college/.test(t.amenity ?? "")
              ? "school"
              : t.amenity === "pharmacy"
                ? "pharmacy"
                : /bank|atm/.test(t.amenity ?? "")
                  ? "bank"
                  : "food";
    out.push({ id: `${e.type}${e.id}`, cat, name: t.name ?? poiCats[cat].label, lat: la, lng: lo });
  }
  poiCache.set(key, out);
  return out;
}

export const fmtDist = (m: number) =>
  m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
export const fmtTime = (s: number) => {
  const m = Math.round(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)} giờ ${m % 60} phút` : `${Math.max(1, m)} phút`;
};

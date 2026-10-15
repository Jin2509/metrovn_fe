import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpDown,
  Bus,
  Crosshair,
  Footprints,
  Bike,
  Car,
  TrainFront,
  MapPin,
  LogOut,
  Search,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { stopsForStation, type Station } from "@/mocks/metro";
import { networkStore, useNetwork } from "@/mocks/network";
import {
  fmtDist,
  fmtTime,
  haversine,
  nearbyPois,
  poiCats,
  route,
  searchPlaces,
  type Mode,
  type Poi,
  type PoiCat,
  type Pt,
  type Step,
} from "@/lib/geo";
import type { Leg } from "@/components/explorer-map";

const ExplorerMap = lazy(() => import("@/components/explorer-map"));

export const Route = createFileRoute("/lookup")({
  head: () => ({
    meta: [
      { title: "Tra cứu & chỉ đường · Metro Admin" },
      {
        name: "description",
        content: "Tra cứu ga Metro, tiện ích quanh ga và chỉ đường đi bộ, xe, Metro.",
      },
      { property: "og:title", content: "Tra cứu & chỉ đường · Metro Admin" },
      { property: "og:description", content: "Tra cứu ga, tiện ích quanh ga và chỉ đường." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExplorePage,
});

type PickTarget = "origin" | "dest" | "draft" | null;
const inHcm = (lat: number, lng: number) => lat > 10.3 && lat < 11.2 && lng > 106.3 && lng < 107.1;

function PointInput({
  label,
  value,
  onChange,
  onPick,
  stations,
}: {
  label: string;
  value: Pt | null;
  onChange: (p: Pt | null) => void;
  onPick: () => void;
  stations: Station[];
}) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Pt[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setQ(value?.label ?? "");
  }, [value]);
  const st =
    q && !value
      ? stations.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).slice(0, 4)
      : [];
  const run = async () => {
    if (q.trim().length < 2) return;
    setBusy(true);
    try {
      setRes(await searchPlaces(q));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const me = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => onChange({ lat: p.coords.latitude, lng: p.coords.longitude, label: "Vị trí của tôi" }),
      () => toast.error("Không lấy được vị trí hiện tại"),
    );
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-1">
        <Input
          value={q}
          placeholder="Ga, địa chỉ, địa điểm…"
          onChange={(e) => {
            setQ(e.target.value);
            setRes([]);
            if (value) onChange(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <Button size="icon" variant="outline" onClick={run} title="Tìm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="outline" onClick={onPick} title="Chọn trên bản đồ">
          <MapPin className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={me} title="Vị trí của tôi">
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>
      {(st.length > 0 || res.length > 0) && (
        <div className="max-h-48 overflow-auto rounded-md border bg-popover text-sm">
          {st.map((s) => (
            <button
              key={s.id}
              className="block w-full px-3 py-2 text-left hover:bg-muted"
              onClick={() => {
                onChange({ lat: s.lat, lng: s.lng, label: `Ga ${s.name}` });
                setRes([]);
              }}
            >
              <TrainFront className="mr-1 inline size-4" aria-hidden="true" />
              Ga {s.name}
            </button>
          ))}
          {res.map((r, i) => (
            <button
              key={i}
              className="block w-full px-3 py-2 text-left hover:bg-muted"
              onClick={() => {
                onChange(r);
                setRes([]);
              }}
            >
              <MapPin className="mr-1 inline size-4" aria-hidden="true" />
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ExplorePage() {
  const { stations, lines, pathOf } = useNetwork();
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [tab, setTab] = useState("lookup");
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<string | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [poiLoading, setPoiLoading] = useState(false);
  const [filter, setFilter] = useState<PoiCat[]>(Object.keys(poiCats) as PoiCat[]);
  const [origin, setOrigin] = useState<Pt | null>(null);
  const [dest, setDest] = useState<Pt | null>(null);
  const [mode, setMode] = useState<Mode | "metro">("metro");
  const [legs, setLegs] = useState<Leg[]>([]);
  const [summary, setSummary] = useState<{
    distance: number;
    duration: number;
    steps: Step[];
  } | null>(null);
  const [routing, setRouting] = useState(false);
  const [pick, setPick] = useState<PickTarget>(null);
  // thêm ga / tuyến
  const [draft, setDraft] = useState<{ name: string; lineId: string; lat: string; lng: string }>({
    name: "",
    lineId: "L2",
    lat: "",
    lng: "",
  });
  const [lineDraft, setLineDraft] = useState<{
    code: string;
    name: string;
    color: string;
    stationIds: string[];
  }>({ code: "", name: "", color: "#7048e8", stationIds: [] });
  const [confirm, setConfirm] = useState<null | "station" | "line">(null);

  const sel = stations.find((s) => s.id === selId) ?? null;

  const selectStation = async (id: string) => {
    const s = stations.find((x) => x.id === id);
    if (!s) return;
    setSelId(id);
    setTab("lookup");
    setFocus({ lat: s.lat, lng: s.lng, zoom: 16 });
    setPoiLoading(true);
    try {
      setPois(await nearbyPois(s.lat, s.lng));
    } catch (e) {
      toast.error((e as Error).message);
      setPois([]);
    } finally {
      setPoiLoading(false);
    }
  };

  const onMapClick = (lat: number, lng: number) => {
    if (!pick) return;
    const p = { lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
    if (pick === "origin") setOrigin(p);
    else if (pick === "dest") setDest(p);
    else setDraft((d) => ({ ...d, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
    setPick(null);
  };

  const nearest = (p: Pt) =>
    stations
      .filter((s) => s.status === "ACTIVE")
      .reduce((a, s) => (haversine(p, s) < haversine(p, a) ? s : a));

  const go = async () => {
    if (!origin || !dest) return toast.error("Chọn điểm đi và điểm đến");
    setRouting(true);
    setLegs([]);
    setSummary(null);
    try {
      if (mode !== "metro") {
        const r = await route(origin, dest, mode);
        setLegs([{ coords: r.coords, kind: mode === "foot" ? "walk" : "road" }]);
        setSummary(r);
      } else {
        const sa = nearest(origin),
          sb = nearest(dest);
        const line = lines.find(
          (l) => l.status === "ACTIVE" && sa.lineIds.includes(l.id) && sb.lineIds.includes(l.id),
        );
        if (sa.id === sb.id || !line) {
          toast.info("Không có đoạn Metro phù hợp — gợi ý đi bộ");
          const r = await route(origin, dest, "foot");
          setLegs([{ coords: r.coords, kind: "walk" }]);
          setSummary(r);
        } else {
          const path = pathOf(line.id);
          const i = path.findIndex((s) => s.id === sa.id),
            j = path.findIndex((s) => s.id === sb.id);
          const seg = i < j ? path.slice(i, j + 1) : path.slice(j, i + 1).reverse();
          const [w1, w2] = await Promise.all([
            route(origin, { ...sa, label: sa.name }, "foot"),
            route({ ...sb, label: sb.name }, dest, "foot"),
          ]);
          const metroDist = seg.slice(1).reduce((a, s, k) => a + haversine(seg[k], s), 0);
          const metroTime = (seg.length - 1) * 150 + 300; // ~2.5 phút/ga + 5 phút chờ
          setLegs([
            { coords: w1.coords, kind: "walk" },
            { coords: seg.map((s) => [s.lat, s.lng]), kind: "metro", color: line.colorHex },
            { coords: w2.coords, kind: "walk" },
          ]);
          setSummary({
            distance: w1.distance + metroDist + w2.distance,
            duration: w1.duration + metroTime + w2.duration,
            steps: [
              {
                text: `Đi bộ tới ga ${sa.name} (${fmtTime(w1.duration)})`,
                distance: w1.distance,
                icon: Footprints,
              },
              ...w1.steps.slice(1, -1).map((s) => ({ ...s, text: `   ${s.text}` })),
              {
                text: `Lên ${line.code} hướng ${seg[seg.length - 1].name}, đi ${seg.length - 1} ga`,
                distance: metroDist,
                icon: TrainFront,
              },
              ...seg.slice(1, -1).map((s) => ({
                text: `   · qua ga ${s.name}`,
                distance: 0,
                icon: MapPin,
              })),
              {
                text: `Xuống ga ${sb.name}${stopsForStation(sb.id).length ? ` — buýt kết nối: ${[...new Set(stopsForStation(sb.id).flatMap((b) => b.routes))].join(", ")}` : ""}`,
                distance: 0,
                icon: LogOut,
              },
              {
                text: `Đi bộ tới điểm đến (${fmtTime(w2.duration)})`,
                distance: w2.distance,
                icon: Footprints,
              },
              ...w2.steps.slice(1).map((s) => ({ ...s, text: `   ${s.text}` })),
            ],
          });
        }
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRouting(false);
    }
  };

  // kiểm tra ga mới
  const lat = parseFloat(draft.lat),
    lng = parseFloat(draft.lng);
  const stationErrors: string[] = [];
  if (draft.name.trim().length < 2) stationErrors.push("Tên ga tối thiểu 2 ký tự");
  if (stations.some((s) => s.name.toLowerCase() === draft.name.trim().toLowerCase()))
    stationErrors.push("Tên ga đã tồn tại");
  if (isNaN(lat) || isNaN(lng)) stationErrors.push("Chưa có tọa độ (bấm chọn trên bản đồ)");
  else if (!inHcm(lat, lng)) stationErrors.push("Tọa độ nằm ngoài TP.HCM");
  const near =
    !isNaN(lat) && !isNaN(lng)
      ? stations.reduce<{ s: Station | null; d: number }>(
          (a, s) => {
            const d = haversine({ lat, lng }, s);
            return d < a.d ? { s, d } : a;
          },
          { s: null, d: Infinity },
        )
      : null;
  if (near && near.d < 300)
    stationErrors.push(`Quá gần ga ${near.s?.name} (${fmtDist(near.d)}) — tối thiểu 300 m`);

  const lineErrors: string[] = [];
  if (!lineDraft.code.trim()) lineErrors.push("Nhập mã tuyến");
  if (lines.some((l) => l.code.toLowerCase() === lineDraft.code.trim().toLowerCase()))
    lineErrors.push("Mã tuyến đã tồn tại");
  if (lineDraft.stationIds.length < 2) lineErrors.push("Chọn tối thiểu 2 ga (theo thứ tự)");

  const saveStation = () => {
    const order = pathOf(draft.lineId).length + 1;
    networkStore.set((n) => ({
      ...n,
      stations: [
        ...n.stations,
        {
          id: `N${Date.now()}`,
          name: draft.name.trim(),
          lineIds: [draft.lineId],
          lat,
          lng,
          order,
          interchange: false,
          status: "INACTIVE",
          dailyFlow: 0,
        },
      ],
    }));
    toast.success(`Đã thêm ga ${draft.name} (trạng thái: quy hoạch)`);
    setDraft({ name: "", lineId: draft.lineId, lat: "", lng: "" });
    setConfirm(null);
  };
  const saveLine = () => {
    networkStore.set((n) => ({
      ...n,
      lines: [
        ...n.lines,
        {
          id: `NL${Date.now()}`,
          code: lineDraft.code.trim(),
          name: lineDraft.name.trim() || lineDraft.code,
          colorHex: lineDraft.color,
          status: "PLANNED",
          stationIds: lineDraft.stationIds,
        },
      ],
    }));
    toast.success(`Đã thêm ${lineDraft.code}`);
    setLineDraft({ code: "", name: "", color: "#7048e8", stationIds: [] });
    setConfirm(null);
  };

  const list = stations.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  const shownPois = pois
    .filter((p) => filter.includes(p.cat))
    .map((p) => ({ ...p, d: sel ? haversine(sel, p) : 0 }))
    .sort((a, b) => a.d - b.d);
  const fallback = (
    <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
      Đang tải bản đồ…
    </div>
  );

  return (
    <AppShell title="Tra cứu & chỉ đường" roles={["ADMIN"]}>
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Card className="lg:h-[calc(100vh-140px)] lg:overflow-auto">
          <CardContent className="p-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="lookup">Tra cứu</TabsTrigger>
                <TabsTrigger value="route">Chỉ đường</TabsTrigger>
                <TabsTrigger value="add">Thêm ga/tuyến</TabsTrigger>
              </TabsList>

              <TabsContent value="lookup" className="space-y-3">
                <Input placeholder="Tìm ga…" value={q} onChange={(e) => setQ(e.target.value)} />
                {!sel && (
                  <div className="space-y-1">
                    {list.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => selectStation(s.id)}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span className="flex items-center gap-2">
                          {s.lineIds.map((id) => (
                            <span
                              key={id}
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: lines.find((l) => l.id === id)?.colorHex }}
                            />
                          ))}
                          {s.name}
                        </span>
                        <Badge variant={s.status === "ACTIVE" ? "secondary" : "outline"}>
                          {s.status === "ACTIVE" ? "Hoạt động" : "Quy hoạch"}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
                {sel && (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">Ga {sel.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {sel.lineIds
                            .map((id) => lines.find((l) => l.id === id)?.code)
                            .join(" · ")}{" "}
                          ·{" "}
                          {sel.status === "ACTIVE"
                            ? `${sel.dailyFlow.toLocaleString("vi-VN")} lượt/ngày`
                            : "Đang quy hoạch"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelId(null);
                          setPois([]);
                        }}
                      >
                        <ArrowLeft className="mr-1 inline size-4" aria-hidden="true" />
                        Danh sách
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOrigin({ lat: sel.lat, lng: sel.lng, label: `Ga ${sel.name}` });
                          setTab("route");
                        }}
                      >
                        Đi từ đây
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setDest({ lat: sel.lat, lng: sel.lng, label: `Ga ${sel.name}` });
                          setTab("route");
                        }}
                      >
                        Chỉ đường tới ga
                      </Button>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                        Trạm buýt kết nối
                      </p>
                      {stopsForStation(sel.id).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Chưa có.</p>
                      ) : (
                        stopsForStation(sel.id).map((b) => (
                          <p key={b.id} className="text-sm">
                            <Bus className="mr-1 inline size-4" aria-hidden="true" />
                            {b.name} ·{" "}
                            <span className="text-muted-foreground">
                              {b.routes.join(", ")} · {b.walkMinutes}′
                            </span>
                          </p>
                        ))
                      )}
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                        Tiện ích trong bán kính 700 m
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {(Object.keys(poiCats) as PoiCat[]).map((c) =>
                          (() => {
                            const Icon = poiCats[c].icon;
                            return (
                              <label key={c} className="flex items-center gap-2 text-xs">
                                <Checkbox
                                  checked={filter.includes(c)}
                                  onCheckedChange={(v) =>
                                    setFilter((f) => (v ? [...f, c] : f.filter((x) => x !== c)))
                                  }
                                />
                                <Icon className="size-4 shrink-0" aria-hidden="true" />
                                {poiCats[c].label} ({pois.filter((p) => p.cat === c).length})
                              </label>
                            );
                          })(),
                        )}
                      </div>
                    </div>
                    {poiLoading ? (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải tiện ích…
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {shownPois.slice(0, 60).map((p) =>
                          (() => {
                            const Icon = poiCats[p.cat].icon;
                            return (
                              <div
                                key={p.id}
                                className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm"
                              >
                                <button
                                  className="text-left"
                                  onClick={() => setFocus({ lat: p.lat, lng: p.lng, zoom: 18 })}
                                >
                                  <Icon className="mr-1 inline size-4" aria-hidden="true" />
                                  {p.name}{" "}
                                  <span className="text-xs text-muted-foreground">
                                    · {fmtDist(p.d)}
                                  </span>
                                </button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setOrigin({
                                      lat: sel.lat,
                                      lng: sel.lng,
                                      label: `Ga ${sel.name}`,
                                    });
                                    setDest({ lat: p.lat, lng: p.lng, label: p.name });
                                    setMode("foot");
                                    setTab("route");
                                  }}
                                >
                                  Đường đi
                                </Button>
                              </div>
                            );
                          })(),
                        )}
                        {shownPois.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Không có tiện ích phù hợp.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="route" className="space-y-3">
                <PointInput
                  label="Điểm đi (A)"
                  value={origin}
                  onChange={setOrigin}
                  onPick={() => {
                    setPick("origin");
                    toast.info("Bấm lên bản đồ để chọn điểm đi");
                  }}
                  stations={stations}
                />
                <div className="flex justify-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setOrigin(dest);
                      setDest(origin);
                    }}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
                <PointInput
                  label="Điểm đến (B)"
                  value={dest}
                  onChange={setDest}
                  onPick={() => {
                    setPick("dest");
                    toast.info("Bấm lên bản đồ để chọn điểm đến");
                  }}
                  stations={stations}
                />
                <div className="grid grid-cols-4 gap-1">
                  {(
                    [
                      ["metro", TrainFront, "Metro"],
                      ["foot", Footprints, "Đi bộ"],
                      ["bike", Bike, "Xe đạp"],
                      ["car", Car, "Ô tô/xe máy"],
                    ] as const
                  ).map(([m, Icon, l]) => (
                    <Button
                      key={m}
                      size="sm"
                      variant={mode === m ? "default" : "outline"}
                      className="flex h-auto flex-col gap-1 py-2 text-xs"
                      onClick={() => setMode(m)}
                    >
                      <Icon className="h-4 w-4" />
                      {l}
                    </Button>
                  ))}
                </div>
                <Button className="w-full" onClick={go} disabled={routing}>
                  {routing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Tìm đường
                </Button>
                {legs.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setLegs([]);
                      setSummary(null);
                    }}
                  >
                    Xóa lộ trình
                  </Button>
                )}
                {summary && (
                  <div className="space-y-2">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-lg font-semibold">{fmtTime(summary.duration)}</p>
                      <p className="text-sm text-muted-foreground">{fmtDist(summary.distance)}</p>
                    </div>
                    <ol className="space-y-1 text-sm">
                      {summary.steps.map((s, i) => {
                        const Icon = s.icon;
                        return (
                          <li
                            key={i}
                            className="flex justify-between gap-2 border-b py-1 last:border-0"
                          >
                            <span className="flex min-w-0 items-start gap-2">
                              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                              <span className="whitespace-pre-wrap">{s.text}</span>
                            </span>
                            {s.distance > 0 && (
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {fmtDist(s.distance)}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="add" className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Thêm ga mới</h3>
                  <Input
                    placeholder="Tên ga"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                  <Select
                    value={draft.lineId}
                    onValueChange={(v) => setDraft({ ...draft, lineId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {lines.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.code} — {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <Input
                      placeholder="Vĩ độ"
                      value={draft.lat}
                      onChange={(e) => setDraft({ ...draft, lat: e.target.value })}
                    />
                    <Input
                      placeholder="Kinh độ"
                      value={draft.lng}
                      onChange={(e) => setDraft({ ...draft, lng: e.target.value })}
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setPick("draft");
                        toast.info("Bấm lên bản đồ để đặt vị trí ga");
                      }}
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                  {stationErrors.length > 0 && (
                    <ul className="list-disc pl-5 text-xs text-destructive">
                      {stationErrors.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  )}
                  <Button
                    className="w-full"
                    disabled={stationErrors.length > 0}
                    onClick={() => setConfirm("station")}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Kiểm tra & xác nhận
                  </Button>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Thêm tuyến mới</h3>
                  <div className="flex gap-1">
                    <Input
                      placeholder="Mã (vd: Tuyến 3a)"
                      value={lineDraft.code}
                      onChange={(e) => setLineDraft({ ...lineDraft, code: e.target.value })}
                    />
                    <input
                      type="color"
                      aria-label="Màu tuyến"
                      value={lineDraft.color}
                      onChange={(e) => setLineDraft({ ...lineDraft, color: e.target.value })}
                      className="h-9 w-12 rounded border"
                    />
                  </div>
                  <Input
                    placeholder="Tên tuyến (vd: Bến Thành – Tân Kiên)"
                    value={lineDraft.name}
                    onChange={(e) => setLineDraft({ ...lineDraft, name: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Chọn ga theo thứ tự chạy ({lineDraft.stationIds.length} đã chọn):
                  </p>
                  <div className="max-h-48 space-y-1 overflow-auto rounded-md border p-2">
                    {stations.map((s) => {
                      const idx = lineDraft.stationIds.indexOf(s.id);
                      return (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={idx >= 0}
                            onCheckedChange={(v) =>
                              setLineDraft((d) => ({
                                ...d,
                                stationIds: v
                                  ? [...d.stationIds, s.id]
                                  : d.stationIds.filter((x) => x !== s.id),
                              }))
                            }
                          />
                          {idx >= 0 && <Badge variant="secondary">{idx + 1}</Badge>}
                          {s.name}
                        </label>
                      );
                    })}
                  </div>
                  {lineErrors.length > 0 && (
                    <ul className="list-disc pl-5 text-xs text-destructive">
                      {lineErrors.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  )}
                  <Button
                    className="w-full"
                    disabled={lineErrors.length > 0}
                    onClick={() => setConfirm("line")}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Kiểm tra & xác nhận
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="relative h-[70vh] overflow-hidden lg:h-[calc(100vh-140px)]">
          {pick && (
            <div className="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground shadow">
              Bấm lên bản đồ để chọn vị trí ·{" "}
              <button className="underline" onClick={() => setPick(null)}>
                Hủy
              </button>
            </div>
          )}
          <ClientOnly fallback={fallback}>
            <Suspense fallback={fallback}>
              <ExplorerMap
                focus={focus}
                pois={sel ? pois : []}
                poiFilter={filter}
                legs={legs}
                origin={origin}
                dest={dest}
                draft={!isNaN(lat) && !isNaN(lng) ? { lat, lng } : null}
                onMapClick={onMapClick}
                onSelectStation={selectStation}
                onPoiRoute={(p) => {
                  if (sel) setOrigin({ lat: sel.lat, lng: sel.lng, label: `Ga ${sel.name}` });
                  setDest({ lat: p.lat, lng: p.lng, label: p.name });
                  setMode("foot");
                  setTab("route");
                }}
              />
            </Suspense>
          </ClientOnly>
        </Card>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "station" ? "Xác nhận thêm ga" : "Xác nhận thêm tuyến"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1 text-sm">
                {confirm === "station" ? (
                  <>
                    <p>
                      Tên ga: <b>{draft.name}</b>
                    </p>
                    <p>
                      Thuộc: <b>{lines.find((l) => l.id === draft.lineId)?.code}</b> · vị trí thứ{" "}
                      {pathOf(draft.lineId).length + 1}
                    </p>
                    <p>
                      Tọa độ:{" "}
                      <b>
                        {lat.toFixed(6)}, {lng.toFixed(6)}
                      </b>
                    </p>
                    {near?.s && (
                      <p>
                        Ga gần nhất: {near.s.name} ({fmtDist(near.d)})
                      </p>
                    )}
                    <p className="pt-2">
                      Ga mới sẽ ở trạng thái <b>Quy hoạch</b>. Vui lòng kiểm tra vị trí trên bản đồ
                      trước khi xác nhận.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Tuyến: <b>{lineDraft.code}</b> — {lineDraft.name}
                    </p>
                    <p>
                      Lộ trình ({lineDraft.stationIds.length} ga):{" "}
                      {lineDraft.stationIds
                        .map((id) => stations.find((s) => s.id === id)?.name)
                        .join(" → ")}
                    </p>
                    <p>
                      Chiều dài ước tính:{" "}
                      <b>
                        {fmtDist(
                          lineDraft.stationIds.slice(1).reduce(
                            (a, id, k) =>
                              a +
                              haversine(
                                stations.find((s) => s.id === lineDraft.stationIds[k])!,
                                stations.find((s) => s.id === id)!,
                              ),
                            0,
                          ),
                        )}
                      </b>
                    </p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Quay lại</AlertDialogCancel>
            <AlertDialogAction onClick={confirm === "station" ? saveStation : saveLine}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

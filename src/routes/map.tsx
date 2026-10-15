import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LazyMap } from "@/components/lazy-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { lines, stations, stopsForStation } from "@/mocks/metro";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Bản đồ hệ thống · Metro Admin" },
      { name: "description", content: "Bản đồ các tuyến, ga Metro và trạm xe buýt kết nối." },
      { property: "og:title", content: "Bản đồ hệ thống · Metro Admin" },
      { property: "og:description", content: "Bản đồ tuyến, ga Metro và xe buýt kết nối." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const [visible, setVisible] = useState(["L1", "L2"]);
  const [bus, setBus] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const st = stations.find((s) => s.id === sel);
  return (
    <AppShell title="Bản đồ hệ thống" roles={["ADMIN"]}>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-3">
            <LazyMap
              height={620}
              visibleLines={visible}
              showBus={bus}
              focusStationId={sel}
              onSelectStation={setSel}
            />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lớp hiển thị</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lines.map((l) => (
                <label key={l.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-6 rounded-full" style={{ background: l.colorHex }} />
                    {l.code} {l.status === "PLANNED" && <Badge variant="outline">Quy hoạch</Badge>}
                  </span>
                  <Switch
                    checked={visible.includes(l.id)}
                    onCheckedChange={(c) =>
                      setVisible((v) => (c ? [...v, l.id] : v.filter((x) => x !== l.id)))
                    }
                  />
                </label>
              ))}
              <label className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-bus" />
                  Trạm xe buýt
                </span>
                <Switch checked={bus} onCheckedChange={setBus} />
              </label>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{st ? `Ga ${st.name}` : "Chọn một ga"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {st ? (
                <>
                  <p className="text-muted-foreground">
                    {st.status === "ACTIVE"
                      ? `${st.dailyFlow.toLocaleString("vi-VN")} lượt/ngày`
                      : "Đang quy hoạch"}
                  </p>
                  {stopsForStation(st.id).map((b) => (
                    <div key={b.id} className="rounded-lg bg-muted p-2">
                      <p className="flex items-center gap-1 font-medium">
                        <Bus className="size-4" aria-hidden="true" />
                        {b.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.walkMinutes} phút đi bộ · tuyến {b.routes.join(", ")}
                      </p>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Bấm vào ga trên bản đồ để xem chi tiết và trạm buýt kết nối.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-accent" />
                Gợi ý AI
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Ga Thủ Đức và Đại học Quốc gia đạt ngưỡng cao điểm 7–9h. Đề xuất tăng tần suất buýt 19
              và 50 lên 6 phút/chuyến trong khung giờ này.
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

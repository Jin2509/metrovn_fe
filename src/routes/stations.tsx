import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LazyMap } from "@/components/lazy-map";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { lines, stations, stopsForStation } from "@/mocks/metro";

export const Route = createFileRoute("/stations")({
  head: () => ({
    meta: [
      { title: "Quản lý ga · Metro Admin" },
      {
        name: "description",
        content: "Danh sách ga Metro, tọa độ, trạng thái và trạm buýt gần ga.",
      },
      { property: "og:title", content: "Quản lý ga · Metro Admin" },
      { property: "og:description", content: "Danh sách ga và trạm buýt gần ga." },
    ],
  }),
  component: StationsPage,
});

function StationsPage() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string>("S1-1");
  const list = stations.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  const st = stations.find((s) => s.id === sel)!;
  return (
    <AppShell title="Quản lý ga" roles={["ADMIN"]}>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardContent className="p-4">
            <Input
              placeholder="Tìm ga…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mb-3 max-w-xs"
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ga</TableHead>
                  <TableHead>Tuyến</TableHead>
                  <TableHead>Tọa độ</TableHead>
                  <TableHead>Buýt</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s) => (
                  <TableRow
                    key={s.id}
                    onClick={() => setSel(s.id)}
                    className={`cursor-pointer ${sel === s.id ? "bg-muted" : ""}`}
                  >
                    <TableCell className="font-medium">
                      {s.name}
                      {s.interchange && (
                        <Badge className="ml-2" variant="secondary">
                          Chuyển tuyến
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {s.lineIds.map((id) => {
                          const l = lines.find((x) => x.id === id)!;
                          return (
                            <span
                              key={id}
                              className="h-3 w-3 rounded-full"
                              style={{ background: l.colorHex }}
                              title={l.code}
                            />
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                    </TableCell>
                    <TableCell>{stopsForStation(s.id).length}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "ACTIVE" ? "default" : "outline"}>
                        {s.status === "ACTIVE" ? "Hoạt động" : "Quy hoạch"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-3 text-lg font-semibold">Ga {st.name}</h2>
            <Tabs defaultValue="map">
              <TabsList>
                <TabsTrigger value="map">Vị trí</TabsTrigger>
                <TabsTrigger value="bus">Trạm xe buýt gần ga</TabsTrigger>
              </TabsList>
              <TabsContent value="map">
                <LazyMap height={360} focusStationId={sel} onSelectStation={setSel} />
              </TabsContent>
              <TabsContent value="bus" className="space-y-2">
                {stopsForStation(st.id).length === 0 && (
                  <p className="text-sm text-muted-foreground">Chưa có trạm buýt kết nối.</p>
                )}
                {stopsForStation(st.id).map((b) => (
                  <div key={b.id} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-muted-foreground">Đi bộ ~{b.walkMinutes} phút</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {b.routes.map((r) => (
                        <Badge key={r} className="bg-bus text-primary-foreground">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LazyMap } from "@/components/lazy-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { busRoutes, stationsForRoute, vnd } from "@/mocks/metro";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/buses")({
  head: () => ({
    meta: [
      { title: "Liên kết xe buýt · Metro Admin" },
      { name: "description", content: "Các tuyến xe buýt kết nối với ga Metro TP.HCM." },
      { property: "og:title", content: "Liên kết xe buýt · Metro Admin" },
      { property: "og:description", content: "Tuyến xe buýt kết nối ga Metro." },
    ],
  }),
  component: BusPage,
});

function BusPage() {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <AppShell title="Liên kết xe buýt" roles={["ADMIN"]}>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-2">
          <button
            onClick={() => setSel(null)}
            className={cn(
              "w-full rounded-lg border bg-card p-3 text-left text-sm",
              !sel && "ring-2 ring-ring",
            )}
          >
            Tất cả tuyến ({busRoutes.length})
          </button>
          {busRoutes.map((r) => {
            const st = stationsForRoute(r.code);
            return (
              <button
                key={r.code}
                onClick={() => setSel(r.code)}
                className={cn(
                  "w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted",
                  sel === r.code && "ring-2 ring-ring",
                )}
              >
                <div className="flex items-center gap-2">
                  <Badge className="bg-bus text-primary-foreground">{r.code}</Badge>
                  <span className="text-sm font-medium">{r.name}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.operator} · {r.hours} · {r.headwayMin}′/chuyến · {vnd(r.fare)}
                </p>
                <p className="mt-1 text-xs">
                  Kết nối {st.length} ga: {st.map((s) => s.name).join(", ")}
                </p>
              </button>
            );
          })}
        </div>
        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">
              {sel ? `Tuyến ${sel} — trạm kết nối ga` : "Toàn bộ trạm buýt kết nối"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LazyMap height={600} highlightRoute={sel} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

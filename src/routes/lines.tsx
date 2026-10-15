import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Section } from "@/components/shared";
import { LazyMap } from "@/components/lazy-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lines, lineStations } from "@/mocks/metro";
import { logAction } from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/lines")({
  head: seo("Tuyến & thứ tự ga", "Quản lý tuyến Metro và sắp xếp thứ tự ga."),
  component: Page,
});

function Page() {
  const [lineId, setLineId] = useState("L1");
  const [order, setOrder] = useState(() =>
    lineStations("L1").map((s, i) => ({ id: s.id, name: s.name, no: i + 1 })),
  );
  const [drag, setDrag] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const pick = (id: string) => {
    setLineId(id);
    setOrder(lineStations(id).map((s, i) => ({ id: s.id, name: s.name, no: i + 1 })));
    setErr("");
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    const a = [...order];
    const [x] = a.splice(from, 1);
    a.splice(to, 0, x);
    setOrder(a.map((s, i) => ({ ...s, no: i + 1 })));
  };
  const save = () => {
    const nos = order.map((o) => o.no).sort((a, b) => a - b);
    const ok =
      nos.every((n, i) => n === i + 1) && new Set(order.map((o) => o.id)).size === order.length;
    if (!ok)
      return setErr(
        "Thứ tự ga không hợp lệ: số thứ tự bị trùng, thiếu hoặc lặp ga. Không có thay đổi nào được lưu.",
      );
    const sorted = [...order].sort((a, b) => a.no - b.no);
    setOrder(sorted);
    setErr("");
    logAction("Sắp xếp thứ tự ga", lines.find((l) => l.id === lineId)!.code);
    toast.success("Đã lưu toàn bộ thứ tự ga");
  };
  const line = lines.find((l) => l.id === lineId)!;
  return (
    <AppShell title="Tuyến & thứ tự ga" roles={["ADMIN"]}>
      <Tabs value={lineId} onValueChange={pick}>
        <TabsList>
          {lines.map((l) => (
            <TabsTrigger key={l.id} value={l.id}>
              <span className="mr-2 h-2.5 w-2.5 rounded-full" style={{ background: l.colorHex }} />
              {l.code}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Section
          title={`${line.code}: ${line.name}`}
          action={<Button onClick={save}>Lưu thứ tự</Button>}
        >
          <p className="mb-3 text-xs text-muted-foreground">
            Kéo thả hoặc nhập số thứ tự. Lưu toàn bộ hoặc không lưu gì.
          </p>
          {err && (
            <p className="mb-3 rounded-md bg-destructive/10 p-2 text-sm text-destructive">{err}</p>
          )}
          <ul className="space-y-1.5">
            {order.map((s, i) => (
              <li
                key={s.id}
                draggable
                onDragStart={() => setDrag(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (drag !== null) move(drag, i);
                  setDrag(null);
                }}
                className="flex items-center gap-2 rounded-lg border bg-card p-2 text-sm"
              >
                <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                <Input
                  type="number"
                  value={s.no}
                  className="h-8 w-16"
                  onChange={(e) =>
                    setOrder(
                      order.map((o) => (o.id === s.id ? { ...o, no: Number(e.target.value) } : o)),
                    )
                  }
                />
                <span className="flex-1">{s.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => move(i, i - 1)}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => move(i, i + 1)}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Xem trước trên bản đồ">
          <LazyMap height={560} visibleLines={[lineId]} showBus={false} />
        </Section>
      </div>
    </AppShell>
  );
}

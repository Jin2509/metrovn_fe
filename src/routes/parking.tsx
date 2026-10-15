import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataTable, money, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parkingLots, parkingPricesStore, submitApproval } from "@/mocks/admin";
import { stations } from "@/mocks/metro";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/parking")({
  head: seo("Gửi xe", "Quản lý bãi xe, sức chứa và bảng giá gửi xe."),
  component: Page,
});

function Page() {
  const prices = parkingPricesStore.use();
  const [edit, setEdit] = useState<Record<string, string>>({});
  const submit = () => {
    const ch = prices
      .filter((p) => edit[p.id] && Number(edit[p.id]) !== p.price)
      .map((p) => ({
        field: `${p.vehicle} / ${p.unit}`,
        old: money(p.price),
        new: money(Number(edit[p.id])),
      }));
    if (!ch.length) return toast.error("Chưa có thay đổi");
    submitApproval("PARKING_PRICE", "Điều chỉnh bảng giá gửi xe", ch);
    setEdit({});
    toast.success("Đã gửi Manager duyệt");
  };
  return (
    <AppShell title="Gửi xe" roles={["ADMIN"]}>
      <Tabs defaultValue="lots">
        <TabsList>
          <TabsTrigger value="lots">Bãi xe</TabsTrigger>
          <TabsTrigger value="cap">Sức chứa theo loại xe</TabsTrigger>
          <TabsTrigger value="price">Bảng giá</TabsTrigger>
        </TabsList>
        <TabsContent value="lots">
          <Section title="Bãi xe">
            <DataTable
              rows={parkingLots}
              cols={[
                { h: "Bãi", c: (l) => <b>{l.name}</b> },
                { h: "Ga", c: (l) => stations.find((s) => s.id === l.stationId)?.name },
                {
                  h: "Tỷ lệ lấp đầy",
                  c: (l) => (
                    <div className="flex w-48 items-center gap-2">
                      <Progress value={l.used * 100} />
                      <span className="text-xs">{Math.round(l.used * 100)}%</span>
                    </div>
                  ),
                },
              ]}
            />
          </Section>
        </TabsContent>
        <TabsContent value="cap">
          <Section title="Sức chứa">
            <DataTable
              rows={parkingLots}
              cols={[
                { h: "Bãi", c: (l) => l.name },
                { h: "Xe đạp", c: (l) => l.bike },
                { h: "Xe máy", c: (l) => l.moto },
                { h: "Ô tô", c: (l) => l.car },
              ]}
            />
          </Section>
        </TabsContent>
        <TabsContent value="price">
          <Section
            title="Bảng giá theo đơn vị"
            action={<Button onClick={submit}>Gửi duyệt</Button>}
          >
            <DataTable
              rows={prices}
              cols={[
                { h: "Loại xe", c: (p) => p.vehicle },
                { h: "Đơn vị", c: (p) => p.unit },
                { h: "Giá hiện hành", c: (p) => money(p.price) },
                {
                  h: "Giá đề xuất",
                  c: (p) => (
                    <Input
                      type="number"
                      className="h-8 w-32"
                      placeholder={String(p.price)}
                      value={edit[p.id] ?? ""}
                      onChange={(e) => setEdit({ ...edit, [p.id]: e.target.value })}
                    />
                  ),
                },
              ]}
            />
          </Section>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataTable, money, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { distancePricesStore, submitApproval, ticketTypesStore } from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/tickets")({
  head: seo("Loại vé & giá vé", "Quản lý loại vé và bảng giá theo khoảng cách."),
  component: Page,
});

function Page() {
  const types = ticketTypesStore.use();
  const prices = distancePricesStore.use();
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [eff, setEff] = useState("");
  const submit = () => {
    const changes = prices
      .filter((p) => edit[p.id] && Number(edit[p.id]) !== p.price)
      .map((p) => ({
        field: `Giá ${p.from}–${p.to} km`,
        old: money(p.price),
        new: money(Number(edit[p.id])),
      }));
    if (!changes.length) return toast.error("Chưa có thay đổi giá");
    if (!eff) return toast.error("Vui lòng chọn ngày hiệu lực");
    if (changes.some((c) => !(Number(c.new.replace(/\D/g, "")) > 0)))
      return toast.error("Giá phải lớn hơn 0");
    submitApproval("TICKET_PRICE", "Điều chỉnh bảng giá vé theo khoảng cách", [
      ...changes,
      { field: "Hiệu lực từ", old: "—", new: eff.split("-").reverse().join("/") },
    ]);
    setEdit({});
    toast.success("Đã gửi Manager duyệt");
  };
  return (
    <AppShell title="Loại vé & giá vé" roles={["ADMIN"]}>
      <Section title="Loại vé">
        <DataTable
          rows={types}
          cols={[
            { h: "Loại vé", c: (t) => <b>{t.name}</b> },
            { h: "Thời hạn", c: (t) => t.validity },
            { h: "Giá", c: (t) => (t.price ? money(t.price) : "Theo khoảng cách") },
            { h: "Trạng thái", c: (t) => <StatusBadge s={t.status} /> },
            {
              h: "",
              c: (t) => (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    ticketTypesStore.set((l) =>
                      l.map((x) =>
                        x.id === t.id
                          ? { ...x, status: x.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
                          : x,
                      ),
                    );
                    toast.success("Đã cập nhật");
                  }}
                >
                  {t.status === "ACTIVE" ? "Ngừng bán" : "Mở bán"}
                </Button>
              ),
            },
          ]}
        />
      </Section>
      <Section
        title="Bảng giá vé lượt theo khoảng cách"
        action={
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="h-9 w-40"
              value={eff}
              onChange={(e) => setEff(e.target.value)}
            />
            <Button onClick={submit}>Gửi duyệt</Button>
          </div>
        }
      >
        <p className="mb-3 rounded-md bg-accent/15 p-2 text-sm">
          Lưu ý: giá mới chỉ áp dụng cho vé đặt sau ngày hiệu lực.
        </p>
        <DataTable
          rows={prices}
          cols={[
            { h: "Khoảng cách", c: (p) => `${p.from} – ${p.to} km` },
            { h: "Giá hiện hành", c: (p) => money(p.price) },
            { h: "Hiệu lực", c: (p) => p.effective },
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
    </AppShell>
  );
}

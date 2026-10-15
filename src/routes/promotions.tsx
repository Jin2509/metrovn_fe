import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { promosStore, submitApproval } from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/promotions")({
  head: seo("Khuyến mãi", "Tạo và quản lý chương trình khuyến mãi."),
  component: Page,
});
const d = (s: string) => s.split("-").reverse().join("/");

function Page() {
  const promos = promosStore.use();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", discount: "", start: "", end: "" });
  const [err, setErr] = useState("");
  const save = () => {
    if (!f.name.trim()) return setErr("Vui lòng nhập tên chương trình");
    const p = Number(f.discount);
    if (!(p > 0 && p <= 100)) return setErr("Mức giảm phải từ 1 đến 100%");
    if (!f.start || !f.end || f.end < f.start)
      return setErr("Thời gian không hợp lệ: ngày kết thúc phải sau ngày bắt đầu");
    const id = `KM${Date.now()}`;
    promosStore.set((l) => [
      { id, name: f.name, discount: p, start: f.start, end: f.end, status: "DRAFT" },
      ...l,
    ]);
    submitApproval("PROMOTION", `Khuyến mãi: ${f.name}`, [
      { field: "Giảm", old: "—", new: `${p}%` },
      { field: "Thời gian", old: "—", new: `${d(f.start)} – ${d(f.end)}` },
    ]);
    toast.success("Đã lưu nháp và gửi duyệt");
    setOpen(false);
    setErr("");
    setF({ name: "", discount: "", start: "", end: "" });
  };
  return (
    <AppShell
      title="Khuyến mãi"
      roles={["ADMIN"]}
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo khuyến mãi
        </Button>
      }
    >
      <Section title="Chương trình khuyến mãi">
        <DataTable
          rows={promos}
          cols={[
            { h: "Tên", c: (p) => <b>{p.name}</b> },
            { h: "Giảm", c: (p) => `${p.discount}%` },
            { h: "Thời gian", c: (p) => `${d(p.start)} – ${d(p.end)}` },
            { h: "Trạng thái", c: (p) => <StatusBadge s={p.status} /> },
            {
              h: "",
              c: (p) =>
                (p.status === "ACTIVE" || p.status === "INACTIVE") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      promosStore.set((l) =>
                        l.map((x) =>
                          x.id === p.id
                            ? { ...x, status: x.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
                            : x,
                        ),
                      )
                    }
                  >
                    {p.status === "ACTIVE" ? "Tạm dừng" : "Kích hoạt"}
                  </Button>
                ),
            },
          ]}
        />
      </Section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo khuyến mãi</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tên chương trình</Label>
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </div>
            <div>
              <Label>Mức giảm (%)</Label>
              <Input
                type="number"
                value={f.discount}
                onChange={(e) => setF({ ...f, discount: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bắt đầu</Label>
                <Input
                  type="date"
                  value={f.start}
                  onChange={(e) => setF({ ...f, start: e.target.value })}
                />
              </div>
              <div>
                <Label>Kết thúc</Label>
                <Input
                  type="date"
                  value={f.end}
                  onChange={(e) => setF({ ...f, end: e.target.value })}
                />
              </div>
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={save}>Lưu & gửi duyệt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

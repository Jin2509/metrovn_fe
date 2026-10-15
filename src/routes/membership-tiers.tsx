import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataTable, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logAction, tiersStore } from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/membership-tiers")({
  head: seo("Hạng thành viên", "Cấu hình ngưỡng điểm, hệ số và quyền lợi hạng thành viên."),
  component: Page,
});

function Page() {
  const tiers = tiersStore.use();
  const set = (id: string, k: string, v: string | number) =>
    tiersStore.set((l) => l.map((t) => (t.id === id ? { ...t, [k]: v } : t)));
  const save = () => {
    const ok = tiers.every((t, i) => i === 0 || t.threshold > tiers[i - 1].threshold);
    if (!ok) return toast.error("Ngưỡng điểm phải tăng dần theo hạng");
    logAction("Cập nhật hạng thành viên", "Tất cả hạng");
    toast.success("Đã lưu cấu hình hạng thành viên");
  };
  return (
    <AppShell
      title="Hạng thành viên"
      roles={["ADMIN"]}
      actions={<Button onClick={save}>Lưu thay đổi</Button>}
    >
      <Section title="Cấu hình hạng">
        <DataTable
          rows={tiers}
          cols={[
            { h: "Hạng", c: (t) => <b>{t.name}</b> },
            {
              h: "Ngưỡng điểm",
              c: (t) => (
                <Input
                  type="number"
                  className="h-8 w-28"
                  value={t.threshold}
                  onChange={(e) => set(t.id, "threshold", Number(e.target.value))}
                />
              ),
            },
            {
              h: "Hệ số nhân",
              c: (t) => (
                <Input
                  type="number"
                  step="0.1"
                  className="h-8 w-24"
                  value={t.multiplier}
                  onChange={(e) => set(t.id, "multiplier", Number(e.target.value))}
                />
              ),
            },
            {
              h: "Quyền lợi",
              c: (t) => (
                <Input
                  className="h-8 min-w-64"
                  value={t.benefits}
                  onChange={(e) => set(t.id, "benefits", e.target.value)}
                />
              ),
            },
          ]}
        />
      </Section>
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataTable, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logAction, usersStore } from "@/mocks/admin";
import { stations } from "@/mocks/metro";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/assignments")({
  head: seo("Phân công ga", "Phân công nhân viên phụ trách ga Metro."),
  component: Page,
});

function Page() {
  const users = usersStore.use();
  const staff = users.filter((u) => u.role === "STAFF");
  const [uid, setUid] = useState("");
  const [sid, setSid] = useState("");
  const [err, setErr] = useState("");
  const assign = () => {
    const u = staff.find((x) => x.id === uid);
    if (!u || !sid) return setErr("Vui lòng chọn nhân viên và ga");
    if (u.status !== "ACTIVE") return setErr("Nhân viên đã nghỉ hoặc bị khóa, không thể phân công");
    if (u.stationId && u.stationId !== sid)
      return setErr(
        `Nhân viên đã được phân công ga ${stations.find((s) => s.id === u.stationId)?.name}. Hãy gỡ phân công trước.`,
      );
    usersStore.set((l) => l.map((x) => (x.id === uid ? { ...x, stationId: sid } : x)));
    logAction("Phân công ga", `${u.name} → ${stations.find((s) => s.id === sid)?.name}`);
    toast.success("Đã phân công");
    setErr("");
  };
  const unassign = (id: string) => {
    usersStore.set((l) => l.map((x) => (x.id === id ? { ...x, stationId: null } : x)));
    toast.success("Đã gỡ phân công");
  };
  return (
    <AppShell title="Phân công ga" roles={["ADMIN"]}>
      <Section title="Phân công mới">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label>Nhân viên</Label>
            <Select value={uid} onValueChange={setUid}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Chọn nhân viên" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ga phụ trách</Label>
            <Select value={sid} onValueChange={setSid}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Chọn ga" />
              </SelectTrigger>
              <SelectContent>
                {stations
                  .filter((s) => s.status === "ACTIVE")
                  .map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={assign}>Phân công</Button>
        </div>
        {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
      </Section>
      <Section title="Nhân viên ga">
        <DataTable
          rows={staff}
          cols={[
            { h: "Nhân viên", c: (u) => u.name },
            { h: "Trạng thái", c: (u) => <StatusBadge s={u.status} /> },
            {
              h: "Ga phụ trách",
              c: (u) =>
                stations.find((s) => s.id === u.stationId)?.name ?? (
                  <span className="text-muted-foreground">Chưa phân công</span>
                ),
            },
            {
              h: "",
              c: (u) =>
                u.stationId && (
                  <Button size="sm" variant="ghost" onClick={() => unassign(u.id)}>
                    Gỡ
                  </Button>
                ),
            },
          ]}
        />
      </Section>
    </AppShell>
  );
}

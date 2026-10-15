import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataTable, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logAction, noticesStore } from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/notifications")({
  head: seo("Thông báo vận hành", "Soạn và gửi thông báo vận hành tới hành khách, nhân viên."),
  component: Page,
});

function Page() {
  const notices = noticesStore.use();
  const [f, setF] = useState({ title: "", body: "", audience: "Tất cả" });
  const [err, setErr] = useState("");
  const send = () => {
    if (!f.title.trim() || !f.body.trim()) return setErr("Tiêu đề và nội dung không được để trống");
    noticesStore.set((l) => [
      { id: `N${Date.now()}`, ...f, at: new Date().toLocaleString("vi-VN") },
      ...l,
    ]);
    logAction("Gửi thông báo", f.title);
    toast.success(`Đã gửi tới: ${f.audience}`);
    setF({ title: "", body: "", audience: "Tất cả" });
    setErr("");
  };
  return (
    <AppShell title="Thông báo vận hành" roles={["ADMIN"]}>
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Section title="Soạn thông báo">
          <div className="space-y-3">
            <div>
              <Label>Tiêu đề</Label>
              <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </div>
            <div>
              <Label>Nội dung</Label>
              <Textarea
                rows={5}
                value={f.body}
                onChange={(e) => setF({ ...f, body: e.target.value })}
              />
            </div>
            <div>
              <Label>Nhóm nhận</Label>
              <Select value={f.audience} onValueChange={(v) => setF({ ...f, audience: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Tất cả", "Hành khách", "Nhân viên", "Kế toán"].map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button className="w-full" onClick={send}>
              Gửi thông báo
            </Button>
          </div>
        </Section>
        <Section title="Lịch sử đã gửi">
          <DataTable
            rows={notices}
            cols={[
              { h: "Thời gian", c: (n) => n.at },
              {
                h: "Tiêu đề",
                c: (n) => (
                  <div>
                    <b>{n.title}</b>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </div>
                ),
              },
              { h: "Nhóm nhận", c: (n) => n.audience },
            ]}
          />
        </Section>
      </div>
    </AppShell>
  );
}

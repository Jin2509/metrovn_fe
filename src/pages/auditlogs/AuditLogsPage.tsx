import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable, Section } from "@/components/shared";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auditStore } from "@/mocks/admin";

export function AuditLogsPage() {
  const logs = auditStore.use();
  const [actor, setActor] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [day, setDay] = useState("");
  const actors = [...new Set(logs.map((l) => l.actor))];
  const acts = [...new Set(logs.map((l) => l.action))];
  const dayVN = day ? day.split("-").reverse().join("/") : "";
  const rows = logs.filter(
    (l) =>
      (actor === "ALL" || l.actor === actor) &&
      (action === "ALL" || l.action === action) &&
      (!day || l.at.startsWith(day) || l.at.includes(dayVN)),
  );
  return (
    <AppShell title="Nhật ký hệ thống">
      <Section title="Nhật ký thao tác">
        <div className="mb-3 flex flex-wrap gap-2">
          <Select value={actor} onValueChange={setActor}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi người thực hiện</SelectItem>
              {actors.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi hành động</SelectItem>
              {acts.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            className="w-44"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </div>
        <DataTable
          rows={rows}
          pageSize={15}
          cols={[
            { h: "Thời gian", c: (l) => l.at },
            { h: "Người thực hiện", c: (l) => l.actor },
            { h: "Hành động", c: (l) => <b>{l.action}</b> },
            { h: "Đối tượng", c: (l) => l.target },
          ]}
        />
      </Section>
    </AppShell>
  );
}

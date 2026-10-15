import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { DataTable, ReasonDialog, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approvalLabel,
  approvalsStore,
  currentUser,
  logAction,
  operationConfigsStore,
  promosStore,
  type Approval,
  type ApprovalType,
} from "@/mocks/admin";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/approvals")({
  head: seo("Hộp phê duyệt", "Manager phê duyệt hoặc từ chối thay đổi do Admin đề xuất."),
  component: Page,
});

function Page() {
  const list = approvalsStore.use();
  const [tab, setTab] = useState<"ALL" | ApprovalType>("ALL");
  const [st, setSt] = useState("PENDING");
  const [sel, setSel] = useState<Approval | null>(null);
  const [rej, setRej] = useState(false);
  const rows = list.filter(
    (a) => (tab === "ALL" || a.type === tab) && (st === "ALL" || a.status === st),
  );
  const decide = (status: "APPROVED" | "REJECTED", reason?: string) => {
    if (!sel) return;
    approvalsStore.set((l) =>
      l.map((a) =>
        a.id === sel.id ? { ...a, status, reason, decidedBy: currentUser("MANAGER") } : a,
      ),
    );
    if (sel.type === "OPERATION")
      operationConfigsStore.set((l) =>
        l.map((c) =>
          c.status === "PENDING"
            ? {
                ...c,
                status: status === "APPROVED" ? "ACTIVE" : "DRAFT",
                approvedBy: status === "APPROVED" ? currentUser("MANAGER") : "",
              }
            : status === "APPROVED" && c.status === "ACTIVE"
              ? { ...c, status: "INACTIVE" }
              : c,
        ),
      );
    if (sel.type === "PROMOTION")
      promosStore.set((l) =>
        l.map((p) =>
          sel.title.endsWith(p.name) && p.status === "DRAFT"
            ? { ...p, status: status === "APPROVED" ? "ACTIVE" : "DRAFT" }
            : p,
        ),
      );
    logAction(status === "APPROVED" ? "Phê duyệt" : "Từ chối", sel.title);
    toast.success(status === "APPROVED" ? "Đã phê duyệt" : "Đã từ chối");
    setSel(null);
    setRej(false);
  };
  return (
    <AppShell title="Hộp phê duyệt" roles={["MANAGER"]}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="ALL">Tất cả</TabsTrigger>
          {(Object.keys(approvalLabel) as ApprovalType[]).map((k) => (
            <TabsTrigger key={k} value={k}>
              {approvalLabel[k]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Section
        title="Yêu cầu"
        action={
          <Select value={st} onValueChange={setSt}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi trạng thái</SelectItem>
              <SelectItem value="PENDING">Chờ duyệt</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="REJECTED">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        <DataTable
          rows={rows}
          onRow={setSel}
          empty="Không có yêu cầu nào"
          cols={[
            { h: "Loại", c: (a) => approvalLabel[a.type] },
            { h: "Nội dung", c: (a) => <b>{a.title}</b> },
            { h: "Người gửi", c: (a) => a.by },
            { h: "Thời điểm", c: (a) => a.at },
            { h: "Trạng thái", c: (a) => <StatusBadge s={a.status} /> },
          ]}
        />
      </Section>
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="sm:max-w-lg">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle>{sel.title}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 px-4 text-sm">
                <p className="text-muted-foreground">
                  {approvalLabel[sel.type]} · gửi bởi {sel.by} lúc {sel.at}
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trường</TableHead>
                      <TableHead>Giá trị cũ</TableHead>
                      <TableHead>Giá trị mới</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sel.changes.map((c) => (
                      <TableRow key={c.field}>
                        <TableCell>{c.field}</TableCell>
                        <TableCell className="text-muted-foreground line-through">
                          {c.old}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">{c.new}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center gap-2">
                  <StatusBadge s={sel.status} />
                  {sel.decidedBy && (
                    <span className="text-muted-foreground">bởi {sel.decidedBy}</span>
                  )}
                </div>
                {sel.reason && <p className="text-destructive">Lý do từ chối: {sel.reason}</p>}
                {sel.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button onClick={() => decide("APPROVED")}>Phê duyệt</Button>
                    <Button variant="destructive" onClick={() => setRej(true)}>
                      Từ chối
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      <ReasonDialog
        open={rej}
        title="Từ chối yêu cầu"
        confirmLabel="Từ chối"
        onClose={() => setRej(false)}
        onConfirm={(r) => decide("REJECTED", r)}
      />
    </AppShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DataTable, ReasonDialog, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { logAction, submitApproval, usersStore, type User } from "@/mocks/admin";
import { stations } from "@/mocks/metro";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/users")({
  head: seo("Người dùng", "Quản lý tài khoản người dùng, khóa/mở và đặt lại mật khẩu."),
  component: Page,
});

const roleVN: Record<User["role"], string> = {
  STAFF: "Nhân viên ga",
  ACCOUNTANT: "Kế toán",
  PASSENGER: "Hành khách",
  MANAGER: "Manager",
};

function Page() {
  const users = usersStore.use();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [st, setSt] = useState("ALL");
  const [sel, setSel] = useState<User | null>(null);
  const [lockOpen, setLockOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const rows = users.filter(
    (u) =>
      (role === "ALL" || u.role === role) &&
      (st === "ALL" || u.status === st) &&
      (u.name + u.email).toLowerCase().includes(q.toLowerCase()),
  );
  const update = (id: string, p: Partial<User>) => {
    usersStore.set((l) => l.map((u) => (u.id === id ? { ...u, ...p } : u)));
    setSel((s) => (s ? { ...s, ...p } : s));
  };
  return (
    <AppShell
      title="Người dùng"
      roles={["ADMIN"]}
      actions={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo tài khoản
        </Button>
      }
    >
      <Section title="Danh sách người dùng">
        <div className="mb-3 flex flex-wrap gap-2">
          <Input
            placeholder="Tìm tên, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi vai trò</SelectItem>
              {Object.entries(roleVN).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={st} onValueChange={setSt}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Mọi trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="LOCKED">Đã khóa</SelectItem>
              <SelectItem value="INACTIVE">Ngừng</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable
          rows={rows}
          onRow={setSel}
          cols={[
            { h: "Mã", c: (u) => u.id },
            { h: "Họ tên", c: (u) => <span className="font-medium">{u.name}</span> },
            { h: "Email", c: (u) => u.email },
            { h: "Vai trò", c: (u) => roleVN[u.role] },
            { h: "Ngày tạo", c: (u) => u.createdAt.split("-").reverse().join("/") },
            { h: "Trạng thái", c: (u) => <StatusBadge s={u.status} /> },
          ]}
        />
      </Section>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent>
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle>{sel.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-2 px-4 text-sm">
                <p>
                  <span className="text-muted-foreground">Email:</span> {sel.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Vai trò:</span> {roleVN[sel.role]}
                </p>
                <p>
                  <span className="text-muted-foreground">Ga phụ trách:</span>{" "}
                  {stations.find((s) => s.id === sel.stationId)?.name ?? "—"}
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">Trạng thái:</span>{" "}
                  <StatusBadge s={sel.status} />
                </p>
                {sel.lockReason && <p className="text-destructive">Lý do khóa: {sel.lockReason}</p>}
                <div className="flex flex-wrap gap-2 pt-4">
                  <Button variant="outline" onClick={() => setResetOpen(true)}>
                    Đặt lại mật khẩu
                  </Button>
                  {sel.status === "LOCKED" ? (
                    <Button onClick={() => setLockOpen(true)}>Mở quyền</Button>
                  ) : (
                    <Button variant="destructive" onClick={() => setLockOpen(true)}>
                      Chặn quyền
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ReasonDialog
        open={lockOpen}
        title={sel?.status === "LOCKED" ? "Mở quyền tài khoản" : "Chặn quyền tài khoản"}
        onClose={() => setLockOpen(false)}
        onConfirm={(r) => {
          if (!sel) return;
          const lock = sel.status !== "LOCKED";
          update(sel.id, { status: lock ? "LOCKED" : "ACTIVE", lockReason: lock ? r : undefined });
          logAction(lock ? "Khóa tài khoản" : "Mở tài khoản", sel.email);
          toast.success(lock ? "Đã chặn quyền" : "Đã mở quyền");
          setLockOpen(false);
        }}
      />

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đặt lại mật khẩu?</AlertDialogTitle>
            <AlertDialogDescription>
              Mật khẩu mặc định sẽ được gửi tới {sel?.email}. Người dùng phải đổi mật khẩu ở lần
              đăng nhập kế tiếp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                logAction("Đặt lại mật khẩu", sel?.email ?? "");
                toast.success("Đã đặt lại mật khẩu");
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        emails={users.map((u) => u.email)}
      />
    </AppShell>
  );
}

function CreateDialog({
  open,
  onClose,
  emails,
}: {
  open: boolean;
  onClose: () => void;
  emails: string[];
}) {
  const [f, setF] = useState({ name: "", email: "", role: "STAFF" });
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Họ tên không hợp lệ";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Email không hợp lệ";
    else if (emails.includes(f.email)) e.email = "Email đã tồn tại";
    setErr(e);
    if (Object.keys(e).length) return;
    submitApproval(
      "ACCOUNT",
      `Tạo tài khoản ${f.role === "STAFF" ? "nhân viên" : "kế toán"}: ${f.name}`,
      [
        { field: "Vai trò", old: "—", new: f.role },
        { field: "Email", old: "—", new: f.email },
        { field: "Mật khẩu", old: "—", new: "Mặc định (bắt buộc đổi)" },
      ],
    );
    toast.success("Đã gửi yêu cầu tạo tài khoản, chờ Manager duyệt");
    setF({ name: "", email: "", role: "STAFF" });
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo tài khoản nhân viên / kế toán</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Họ tên</Label>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            {err.name && <p className="text-xs text-destructive">{err.name}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            {err.email && <p className="text-xs text-destructive">{err.email}</p>}
          </div>
          <div>
            <Label>Vai trò</Label>
            <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF">Nhân viên ga</SelectItem>
                <SelectItem value="ACCOUNTANT">Kế toán</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Mật khẩu mặc định sẽ được gửi qua email. Yêu cầu cần Manager phê duyệt.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit}>Gửi duyệt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

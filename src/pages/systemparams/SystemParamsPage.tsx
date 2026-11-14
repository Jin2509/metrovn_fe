import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { FieldError } from "@/components/form-field";
import { fieldErrorProps } from "@/components/form-field.utils";
import { DataTable, LoadState, Section } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiErrorMessage, systemParamsApi, type SystemParamResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtInstant } from "@/lib/query-sync";
import {
  SYSTEM_PARAMS_KEY,
  groupLabel,
  paramLabel,
  paramUnit,
  updateParam,
  validateParamValue,
} from "@/pages/systemparams/systemparams.service";

const SYSTEM_PARAM_MANAGE = "SYSTEM_PARAM_MANAGE";

function EditParamDialog({ param, onClose }: { param: SystemParamResponse; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(param.value);
  const [from, setFrom] = useState("");
  const [error, setError] = useState("");
  const [fromError, setFromError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    const valueError = validateParamValue(value);
    const at = from ? new Date(from) : undefined;
    const timeError =
      at && at.getTime() < Date.now() ? "Thời điểm áp dụng không được ở quá khứ" : "";
    setError(valueError ?? "");
    setFromError(timeError);
    if (valueError) return document.getElementById("param-value")?.focus();
    if (timeError) return document.getElementById("param-from")?.focus();
    if (Number(value) === Number(param.value) && !at) return setError("Giá trị chưa thay đổi");
    setPending(true);
    try {
      await updateParam(param.key, Number(value), at?.toISOString());
      toast.success(at ? "Đã lên lịch giá trị mới" : "Đã áp dụng giá trị mới");
      await queryClient.invalidateQueries({ queryKey: SYSTEM_PARAMS_KEY });
      onClose();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{paramLabel(param)}</DialogTitle>
          <DialogDescription>
            Mỗi lần sửa tạo một phiên bản mới; giá trị cũ vẫn được lưu trong lịch sử.
          </DialogDescription>
        </DialogHeader>
        <form
          id="param-form"
          noValidate
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!pending) void submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="param-value">
              Giá trị {paramUnit(param) && `(${paramUnit(param)})`} *
            </Label>
            <Input
              id="param-value"
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              {...fieldErrorProps("param-value", error)}
            />
            <FieldError fieldId="param-value">{error}</FieldError>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="param-from">Áp dụng từ</Label>
            <Input
              id="param-from"
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-invalid={!!fromError}
              aria-describedby={fromError ? "param-from-error" : "param-from-hint"}
            />
            {fromError ? (
              <FieldError fieldId="param-from">{fromError}</FieldError>
            ) : (
              <p id="param-from-hint" className="text-xs text-muted-foreground">
                Bỏ trống: áp dụng ngay
              </p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" form="param-form" disabled={pending}>
            {pending ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistorySheet({
  param,
  onClose,
}: {
  param: SystemParamResponse | null;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: [...SYSTEM_PARAMS_KEY, "history", param?.key],
    queryFn: () => systemParamsApi.history(param!.key),
    enabled: !!param,
    retry: false,
  });
  return (
    <Sheet open={!!param} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        {param && (
          <>
            <SheetHeader>
              <SheetTitle>Lịch sử · {paramLabel(param)}</SheetTitle>
            </SheetHeader>
            <div className="px-4">
              <LoadState
                loading={query.isPending}
                error={query.error ? apiErrorMessage(query.error) : ""}
              />
              {query.data && (
                <DataTable
                  rows={query.data}
                  label={`Lịch sử ${paramLabel(param)}`}
                  rowKey={(p) => p.effectiveFrom}
                  cols={[
                    { h: "Giá trị", c: (p) => <b>{Number(p.value).toLocaleString("vi-VN")}</b> },
                    { h: "Từ", c: (p) => fmtInstant(p.effectiveFrom) },
                    { h: "Đến", c: (p) => (p.effectiveTo ? fmtInstant(p.effectiveTo) : "—") },
                  ]}
                />
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Tham số nghiệp vụ dùng chung (bảng `system_param`). Sửa có hiệu lực ngay hoặc từ một thời điểm. */
export function SystemParamsPage() {
  const canManage = useAuth().hasPermission(SYSTEM_PARAM_MANAGE);
  const query = useQuery({
    queryKey: SYSTEM_PARAMS_KEY,
    queryFn: systemParamsApi.list,
    enabled: canManage,
    retry: false,
  });
  const [editing, setEditing] = useState<SystemParamResponse | null>(null);
  const [history, setHistory] = useState<SystemParamResponse | null>(null);
  const params = query.data ?? [];
  const groups = [...new Set(params.map((p) => p.group))];
  const now = Date.now();

  if (!canManage)
    return (
      <AppShell title="Tham số hệ thống">
        <p className="text-sm text-muted-foreground">
          Tài khoản chưa có quyền quản lý tham số (SYSTEM_PARAM_MANAGE).
        </p>
      </AppShell>
    );

  return (
    <AppShell title="Tham số hệ thống">
      <LoadState
        loading={query.isPending}
        error={query.error ? apiErrorMessage(query.error) : ""}
        onRetry={() => void query.refetch()}
      />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {groups.map((group) => (
          <Section key={group} title={groupLabel(group)}>
            <DataTable
              rows={params.filter((p) => p.group === group)}
              rowKey={(p) => `${p.key}-${p.effectiveFrom}`}
              pageSize={50}
              cols={[
                {
                  h: "Tham số",
                  className: "whitespace-normal",
                  c: (p) => (
                    <div>
                      <p className="font-medium">{paramLabel(p)}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{p.key}</p>
                    </div>
                  ),
                },
                {
                  h: "Giá trị",
                  className: "text-right",
                  c: (p) => (
                    <div>
                      <b>{Number(p.value).toLocaleString("vi-VN")}</b> {paramUnit(p)}
                      {new Date(p.effectiveFrom).getTime() > now && (
                        <p className="text-xs text-accent-foreground">
                          từ {fmtInstant(p.effectiveFrom)}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  h: "Thao tác",
                  className: "text-right",
                  c: (p) => (
                    <span className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label={`Sửa ${paramLabel(p)}`}
                        onClick={() => setEditing(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label={`Lịch sử ${paramLabel(p)}`}
                        onClick={() => setHistory(p)}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </span>
                  ),
                },
              ]}
            />
          </Section>
        ))}
      </div>
      {editing && <EditParamDialog param={editing} onClose={() => setEditing(null)} />}
      <HistorySheet param={history} onClose={() => setHistory(null)} />
    </AppShell>
  );
}

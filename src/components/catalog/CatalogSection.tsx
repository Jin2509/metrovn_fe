import { Clock, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CatalogFormDialog } from "@/components/catalog/CatalogFormDialog";
import { DataTable, ReasonDialog, Section, type Col } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  isCatalogPayload,
  pendingRequests,
  requestCreate,
  requestDelete,
  requestUpdate,
  type AnyCatalog,
  type CatalogPayload,
} from "@/lib/change-requests";
import { approvalsStore } from "@/mocks/admin";

const SENT = "Đã gửi Manager duyệt. Thay đổi chỉ có hiệu lực sau khi được phê duyệt.";
const PENDING_LABEL = { CREATE: "thêm", UPDATE: "sửa", DELETE: "xóa" };
const REJECTED_SHOWN = 3;

/**
 * Bảng một đối tượng nghiệp vụ kèm thêm/sửa/xóa. Mọi thao tác chỉ tạo yêu cầu cho Manager: dòng đang
 * chờ duyệt bị khóa, yêu cầu thêm mới và yêu cầu bị từ chối hiện ngay trên bảng để Admin theo dõi.
 */
export function CatalogSection<T extends { id: string }>({
  catalog,
  title,
  description,
  columns,
  canEdit = true,
  pageSize,
}: {
  catalog: AnyCatalog;
  title: string;
  description?: string;
  columns: Col<T>[];
  canEdit?: boolean;
  pageSize?: number;
}) {
  const rows = catalog.store.use() as T[];
  const approvals = approvalsStore.use();
  const [form, setForm] = useState<{ id?: string; draft: Record<string, unknown> } | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const pending = pendingRequests(catalog.key, approvals);
  const pendingCreates = pending.filter((a) => (a.payload as CatalogPayload).action === "CREATE");
  const pendingOf = (id: string) => pending.find((a) => (a.payload as CatalogPayload).id === id);
  const rejected = approvals
    .filter(
      (a) =>
        a.status === "REJECTED" && isCatalogPayload(a.payload) && a.payload.catalog === catalog.key,
    )
    .slice(0, REJECTED_SHOWN);

  const finish = (error: string | null) => {
    if (error) {
      toast.error(error);
      return error;
    }
    toast.success(SENT);
    setForm(null);
    setDeleting(null);
    return null;
  };

  const actionCol: Col<T> = {
    h: "Thao tác",
    className: "w-24 text-right",
    c: (row) => {
      const request = pendingOf(row.id);
      if (request)
        return (
          <Badge variant="outline" className="whitespace-nowrap border-accent/50 font-normal">
            Chờ duyệt {PENDING_LABEL[(request.payload as CatalogPayload).action]}
          </Badge>
        );
      return (
        <span className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label={`Sửa ${catalog.labelOf(row)}`}
            onClick={() => setForm({ id: row.id, draft: catalog.toDraft(row) })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive"
            aria-label={`Xóa ${catalog.labelOf(row)}`}
            onClick={() => {
              const guard = catalog.deleteGuard?.(row);
              if (guard) toast.error(guard);
              else setDeleting(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </span>
      );
    },
  };

  return (
    <Section
      title={title}
      description={description}
      action={
        canEdit && (
          <Button onClick={() => setForm({ draft: catalog.empty() })}>
            <Plus className="h-4 w-4" />
            Thêm {catalog.noun}
          </Button>
        )
      }
    >
      {(pendingCreates.length > 0 || rejected.length > 0) && (
        <ul className="mb-3 space-y-1.5 text-sm">
          {pendingCreates.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-md bg-accent/10 px-3 py-2">
              <Clock className="h-4 w-4 shrink-0" />
              Chờ Manager duyệt: {a.title}
            </li>
          ))}
          {rejected.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2"
            >
              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              {a.decidedBy} từ chối "{a.title}": {a.reason}
            </li>
          ))}
        </ul>
      )}
      <DataTable
        rows={rows}
        pageSize={pageSize}
        cols={canEdit ? [...columns, actionCol] : columns}
      />
      {form && (
        <CatalogFormDialog
          catalog={catalog}
          initial={form.draft}
          editing={!!form.id}
          onClose={() => setForm(null)}
          onSubmit={(draft) =>
            finish(form.id ? requestUpdate(catalog, form.id, draft) : requestCreate(catalog, draft))
          }
        />
      )}
      <ReasonDialog
        open={!!deleting}
        title={deleting ? `Xóa ${catalog.noun}: ${catalog.labelOf(deleting)}` : ""}
        confirmLabel="Gửi yêu cầu xóa"
        onClose={() => setDeleting(null)}
        onConfirm={(reason) => deleting && finish(requestDelete(catalog, deleting.id, reason))}
      />
    </Section>
  );
}

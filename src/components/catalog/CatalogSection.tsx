import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CatalogFormDialog } from "@/components/catalog/CatalogFormDialog";
import { DataTable, LoadState, Section, type Col } from "@/components/shared";
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
import { Button } from "@/components/ui/button";
import { deleteCatalogItem, saveCatalogItem, type AnyCatalog } from "@/lib/change-requests";
import { useSyncedQuery } from "@/lib/query-sync";

/**
 * Bảng một đối tượng nghiệp vụ kèm thêm/sửa/xóa, dữ liệu lấy từ backend (`catalog.query`).
 * Thao tác ghi gọi thẳng API rồi tải lại bảng.
 */
export function CatalogSection<T extends { id: string }>({
  catalog,
  title,
  description,
  columns,
  canEdit = true,
  pageSize,
  action,
}: {
  catalog: AnyCatalog;
  title: string;
  description?: string;
  columns: Col<T>[];
  canEdit?: boolean;
  pageSize?: number;
  /** Nút bổ sung cạnh nút "Thêm". */
  action?: React.ReactNode;
}) {
  const data = useSyncedQuery({
    queryKey: catalog.query.key,
    queryFn: catalog.query.fn,
    store: catalog.store,
    map: catalog.query.map,
  });
  const rows = catalog.store.use() as T[];
  const [form, setForm] = useState<{ id?: string; draft: Record<string, unknown> } | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [pending, setPending] = useState(false);
  const canCreate = canEdit && !!catalog.create;
  const canUpdate = canEdit && !!catalog.update;
  const canRemove = canEdit && !!catalog.remove;

  const submit = async (draft: Record<string, unknown>) => {
    setPending(true);
    const error = await saveCatalogItem(catalog, draft, form?.id);
    setPending(false);
    if (error) return error;
    toast.success(form?.id ? `Đã cập nhật ${catalog.noun}` : `Đã thêm ${catalog.noun}`);
    setForm(null);
    await data.reload();
    return null;
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setPending(true);
    const error = await deleteCatalogItem(catalog, deleting);
    setPending(false);
    if (error) return void toast.error(error);
    toast.success(`Đã xóa ${catalog.noun} ${catalog.labelOf(deleting)}`);
    setDeleting(null);
    await data.reload();
  };

  const actionCol: Col<T> = {
    h: "Thao tác",
    className: "w-24 text-right",
    c: (row) => (
      <span className="flex justify-end gap-1">
        {canUpdate && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label={`Sửa ${catalog.labelOf(row)}`}
            onClick={() => setForm({ id: row.id, draft: catalog.toDraft(row) })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {canRemove && (
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
        )}
      </span>
    ),
  };

  return (
    <Section
      title={title}
      description={description}
      action={
        (canCreate || action) && (
          <div className="flex flex-wrap gap-2">
            {action}
            {canCreate && (
              <Button onClick={() => setForm({ draft: catalog.empty() })}>
                <Plus className="h-4 w-4" />
                Thêm {catalog.noun}
              </Button>
            )}
          </div>
        )
      }
    >
      <LoadState loading={data.loading} error={data.loadError} onRetry={data.reload} />
      {!data.loading && !data.loadError && (
        <DataTable
          rows={rows}
          pageSize={pageSize}
          cols={canUpdate || canRemove ? [...columns, actionCol] : columns}
        />
      )}
      {form && (
        <CatalogFormDialog
          catalog={catalog}
          initial={form.draft}
          editing={!!form.id}
          pending={pending}
          onClose={() => setForm(null)}
          onSubmit={submit}
        />
      )}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xóa {catalog.noun} {deleting ? catalog.labelOf(deleting) : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>Thao tác này không hoàn tác được.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}

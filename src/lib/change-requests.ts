import {
  approvalsStore,
  logAction,
  submitApproval,
  type Approval,
  type ApprovalType,
} from "@/mocks/admin";
import type { createStore } from "@/lib/store";

// Cơ chế chung cho mọi đối tượng nghiệp vụ: Admin chỉ gửi yêu cầu thêm/sửa/xóa, dữ liệu chỉ được ghi
// khi Manager phê duyệt (`applyCatalogChange`). Từ chối thì không có gì thay đổi.

type Store<T> = ReturnType<typeof createStore<T[]>>;
type Row = { id: string };

export type FieldOption = { value: string; label: string };

export type CatalogField<D> = {
  key: keyof D & string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "select" | "textarea";
  options?: () => FieldOption[];
  required?: boolean;
  min?: number;
  max?: number;
  hint?: string;
  /** Ẩn trường theo giá trị khác trong form. */
  visible?: (draft: D) => boolean;
  /** Cách hiển thị trong hộp phê duyệt; mặc định lấy nhãn của lựa chọn hoặc giá trị thô. */
  format?: (value: unknown) => string;
};

export type Catalog<T extends Row, D = Omit<T, "id">> = {
  key: string;
  type: ApprovalType;
  /** Tên đối tượng, dùng trong tiêu đề yêu cầu và nút bấm. */
  noun: string;
  store: Store<T>;
  fields: CatalogField<D>[];
  labelOf: (value: D | T) => string;
  empty: () => D;
  newId: () => string;
  toDraft: (item: T) => D;
  /** Dựng bản ghi khi được duyệt, dùng cho trường hệ thống tự điền (người tạo, thời điểm...). */
  toRecord?: (draft: D, id: string, existing?: T) => T;
  validate?: (draft: D, all: T[], editingId?: string) => string | null;
  deleteGuard?: (item: T) => string | null;
};

export type AnyCatalog = Catalog<any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type CatalogAction = "CREATE" | "UPDATE" | "DELETE";

export type CatalogPayload = {
  catalog: string;
  action: CatalogAction;
  id?: string;
  draft?: unknown;
};

export const isCatalogPayload = (payload: unknown): payload is CatalogPayload =>
  !!payload && typeof (payload as CatalogPayload).catalog === "string";

export function fieldText<D>(field: CatalogField<D>, value: unknown) {
  if (field.format) return field.format(value);
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "select")
    return field.options?.().find((o) => o.value === value)?.label ?? String(value);
  if (field.type === "number") return Number(value).toLocaleString("vi-VN");
  if (field.type === "date") return String(value).split("-").reverse().join("/");
  return String(value);
}

const shown = <D>(field: CatalogField<D>, draft: D) => !field.visible || field.visible(draft);

/** Lỗi nhập liệu theo khai báo của từng trường, rồi tới ràng buộc riêng của đối tượng. */
export function validateDraft<T extends Row, D>(
  catalog: Catalog<T, D>,
  draft: D,
  editingId?: string,
): string | null {
  for (const field of catalog.fields) {
    if (!shown(field, draft)) continue;
    const value = draft[field.key];
    if (field.required && (value === "" || value === null || value === undefined))
      return `Vui lòng nhập ${field.label.toLowerCase()}`;
    if (field.type === "number" && value !== "" && value !== null && value !== undefined) {
      const number = Number(value);
      if (Number.isNaN(number)) return `${field.label} phải là số`;
      if (field.min !== undefined && number < field.min)
        return `${field.label} phải từ ${field.min} trở lên`;
      if (field.max !== undefined && number > field.max)
        return `${field.label} không được vượt quá ${field.max}`;
    }
  }
  return catalog.validate?.(draft, catalog.store.get(), editingId) ?? null;
}

/** Yêu cầu đang chờ duyệt của một đối tượng cụ thể, hoặc yêu cầu thêm mới nếu không truyền id. */
export function pendingRequests(catalogKey: string, approvals: Approval[] = approvalsStore.get()) {
  return approvals.filter(
    (approval) =>
      approval.status === "PENDING" &&
      isCatalogPayload(approval.payload) &&
      approval.payload.catalog === catalogKey,
  );
}

const hasPendingFor = (catalogKey: string, id: string) =>
  pendingRequests(catalogKey).some((approval) => (approval.payload as CatalogPayload).id === id);

const PENDING_ERROR = "Đối tượng này đang có một yêu cầu chờ Manager duyệt";

function changesOf<T extends Row, D>(catalog: Catalog<T, D>, before: D | null, after: D | null) {
  return catalog.fields.flatMap((field) => {
    const source = after ?? before!;
    if (!shown(field, source)) return [];
    const old = before ? fieldText(field, before[field.key]) : "—";
    const next = after ? fieldText(field, after[field.key]) : "—";
    return old === next ? [] : [{ field: field.label, old, new: next }];
  });
}

export function requestCreate<T extends Row, D>(
  catalog: Catalog<T, D>,
  draft: NoInfer<D>,
): string | null {
  const error = validateDraft(catalog, draft);
  if (error) return error;
  submitApproval(
    catalog.type,
    `Thêm ${catalog.noun}: ${catalog.labelOf(draft)}`,
    changesOf(catalog, null, draft),
    { catalog: catalog.key, action: "CREATE", draft } satisfies CatalogPayload,
  );
  return null;
}

export function requestUpdate<T extends Row, D>(
  catalog: Catalog<T, D>,
  id: string,
  draft: NoInfer<D>,
): string | null {
  const current = catalog.store.get().find((item) => item.id === id);
  if (!current) return `Không tìm thấy ${catalog.noun}`;
  if (hasPendingFor(catalog.key, id)) return PENDING_ERROR;
  const error = validateDraft(catalog, draft, id);
  if (error) return error;
  const changes = changesOf(catalog, catalog.toDraft(current), draft);
  if (!changes.length) return "Chưa có thay đổi nào";
  submitApproval(catalog.type, `Sửa ${catalog.noun}: ${catalog.labelOf(current)}`, changes, {
    catalog: catalog.key,
    action: "UPDATE",
    id,
    draft,
  } satisfies CatalogPayload);
  return null;
}

export function requestDelete<T extends Row, D>(
  catalog: Catalog<T, D>,
  id: string,
  reason: string,
): string | null {
  const current = catalog.store.get().find((item) => item.id === id);
  if (!current) return `Không tìm thấy ${catalog.noun}`;
  if (hasPendingFor(catalog.key, id)) return PENDING_ERROR;
  const guard = catalog.deleteGuard?.(current);
  if (guard) return guard;
  submitApproval(
    catalog.type,
    `Xóa ${catalog.noun}: ${catalog.labelOf(current)}`,
    [
      ...changesOf(catalog, catalog.toDraft(current), null),
      { field: "Lý do xóa", old: "—", new: reason },
    ],
    { catalog: catalog.key, action: "DELETE", id } satisfies CatalogPayload,
  );
  return null;
}

/**
 * Kiểm tra lại ngay trước khi duyệt: dữ liệu có thể đã đổi từ lúc gửi yêu cầu, ví dụ hai yêu cầu
 * thêm cùng một mã, hoặc đối tượng đã bị xóa. Có lỗi thì yêu cầu không được áp dụng.
 */
export function checkCatalogChange(catalog: AnyCatalog, payload: CatalogPayload): string | null {
  const current = catalog.store.get().find((item: Row) => item.id === payload.id);
  if (payload.action !== "CREATE" && !current) return `${catalog.noun} không còn tồn tại`;
  if (payload.action === "DELETE") return catalog.deleteGuard?.(current) ?? null;
  return validateDraft(catalog, payload.draft, payload.id);
}

export function applyCatalogChange(catalog: AnyCatalog, payload: CatalogPayload) {
  const { action, id, draft } = payload;
  if (action === "DELETE") {
    catalog.store.set((list: Row[]) => list.filter((item) => item.id !== id));
  } else if (action === "UPDATE") {
    catalog.store.set((list: Row[]) =>
      list.map((item) =>
        item.id === id
          ? (catalog.toRecord?.(draft, item.id, item) ?? { ...item, ...(draft as object) })
          : item,
      ),
    );
  } else {
    const newId = catalog.newId();
    const record = catalog.toRecord?.(draft, newId) ?? { ...(draft as object), id: newId };
    catalog.store.set((list: Row[]) => [...list, record]);
  }
  const verb = { CREATE: "Thêm", UPDATE: "Sửa", DELETE: "Xóa" }[action];
  logAction(`${verb} ${catalog.noun}`, id ?? catalog.labelOf(draft));
}

import type { QueryKey } from "@tanstack/react-query";
import { ApiError, apiErrorMessage } from "@/lib/api";
import type { createStore } from "@/lib/store";

// Cơ chế chung cho các đối tượng nghiệp vụ Admin thêm/sửa/xóa trên một bảng (đoàn tàu, loại vé,
// bãi xe...). Mọi thao tác ghi thẳng lên backend; backend kiểm tra quyền và ràng buộc.
// Các thay đổi cần Manager duyệt (giá vé, cấu hình vận hành, thông báo) dùng luồng duyệt riêng của
// backend, xem `pages/approvals`.

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
  /** Chỉ nhập khi thêm mới (ví dụ mã không đổi được sau khi tạo). */
  createOnly?: boolean;
  /** Cách hiển thị giá trị; mặc định lấy nhãn của lựa chọn hoặc giá trị thô. */
  format?: (value: unknown) => string;
};

export type Catalog<T extends Row, D = Omit<T, "id">, R = unknown> = {
  key: string;
  /** Tên đối tượng, dùng trong tiêu đề form, nút bấm và thông báo. */
  noun: string;
  store: Store<T>;
  fields: CatalogField<D>[];
  labelOf: (value: D | T) => string;
  empty: () => D;
  toDraft: (item: T) => D;
  validate?: (draft: D, all: T[], editingId?: string) => string | null;
  deleteGuard?: (item: T) => string | null;
  /** Nguồn dữ liệu: `map` chuyển phản hồi API sang dòng hiển thị. */
  query: { key: QueryKey; fn: () => Promise<R>; map: (data: R) => T[] };
  create?: (draft: D) => Promise<unknown>;
  update?: (item: T, draft: D) => Promise<unknown>;
  remove?: (item: T) => Promise<unknown>;
  /** Lỗi theo trường từ backend (400 `errors`) → tên trường trong form. */
  fieldOfApi?: Record<string, keyof D & string>;
};

export type AnyCatalog = Catalog<any, any, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type AnyCatalogOf<T extends Row, D> = Catalog<T, D, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

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
  catalog: AnyCatalogOf<T, D>,
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

/** Có thay đổi so với bản đang lưu không (so theo cách hiển thị của từng trường). */
export function hasChanges<T extends Row, D>(catalog: AnyCatalogOf<T, D>, item: T, draft: D) {
  const before = catalog.toDraft(item);
  return catalog.fields.some(
    (field) =>
      shown(field, draft) &&
      fieldText(field, before[field.key]) !== fieldText(field, draft[field.key]),
  );
}

/** Lỗi backend → câu thông báo; lỗi theo trường thì kèm nhãn trường. */
export function catalogErrorMessage<T extends Row, D>(catalog: AnyCatalogOf<T, D>, error: unknown) {
  if (error instanceof ApiError && Object.keys(error.fieldErrors).length) {
    // Nội dung lỗi theo trường có thể là tiếng Anh: chỉ dùng để biết trường nào sai.
    const apiField = Object.keys(error.fieldErrors)[0];
    const key = catalog.fieldOfApi?.[apiField] ?? apiField;
    const label = catalog.fields.find((f) => f.key === key)?.label;
    if (label) return `${label} không hợp lệ`;
  }
  return apiErrorMessage(error);
}

/** Kiểm tra rồi gửi thêm/sửa. Trả về thông báo lỗi, hoặc null khi đã lưu. */
export async function saveCatalogItem<T extends Row, D>(
  catalog: AnyCatalogOf<T, D>,
  draft: D,
  editingId?: string,
): Promise<string | null> {
  const current = editingId ? catalog.store.get().find((item) => item.id === editingId) : undefined;
  if (editingId && !current) return `Không tìm thấy ${catalog.noun}`;
  const error = validateDraft(catalog, draft, editingId);
  if (error) return error;
  if (current && !hasChanges(catalog, current, draft)) return "Chưa có thay đổi nào";
  try {
    if (current) await catalog.update!(current, draft);
    else await catalog.create!(draft);
    return null;
  } catch (e) {
    return catalogErrorMessage(catalog, e);
  }
}

export async function deleteCatalogItem<T extends Row, D>(
  catalog: AnyCatalogOf<T, D>,
  item: T,
): Promise<string | null> {
  const guard = catalog.deleteGuard?.(item);
  if (guard) return guard;
  try {
    await catalog.remove!(item);
    return null;
  } catch (e) {
    return catalogErrorMessage(catalog, e);
  }
}

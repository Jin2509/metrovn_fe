import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  requestStationDelete,
  requestStationUpsert,
  validateStation,
  type StationDraft,
  type StationErrors,
} from "@/lib/network";
import { approvalsStore, usersStore } from "@/mocks/admin";
import { lines, stationsStore, type Station } from "@/mocks/metro";
import type { StationListRow, StationStatusFilter } from "@/pages/stations/stations.types";

const EMPTY: StationDraft = {
  code: "",
  name: "",
  address: "",
  district: "",
  lat: 10.7769,
  lng: 106.7009,
  interchange: false,
  status: "INACTIVE",
};

export function useStations() {
  const { station: fromUrl } = useSearch({ strict: false }) as { station?: string };
  const navigate = useNavigate();
  const stations = stationsStore.use();
  const users = usersStore.use();
  const pendingCount = approvalsStore
    .use()
    .filter((a) => a.type === "STATION" && a.status === "PENDING").length;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StationStatusFilter>("ALL");
  const [form, setForm] = useState<{ id?: string; draft: StationDraft } | null>(null);
  const [errors, setErrors] = useState<StationErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<Station | null>(null);

  const all: StationListRow[] = stations.map((s) => ({
    ...s,
    lines: s.lineIds.map((id) => lines.find((l) => l.id === id)!).filter(Boolean),
    staffCount: users.filter(
      (u) => u.role === "STAFF" && u.stationId === s.id && u.status === "ACTIVE",
    ).length,
  }));
  const q = query.trim().toLowerCase();
  const rows = all.filter(
    (s) =>
      (status === "ALL" || s.status === status) &&
      `${s.code} ${s.name} ${s.district}`.toLowerCase().includes(q),
  );
  const selectedId = all.some((s) => s.id === fromUrl) ? fromUrl! : all[0]?.id;
  const select = (id: string) =>
    navigate({
      to: "/stations",
      search: (prev: Record<string, unknown>) => ({ ...prev, station: id }),
      replace: true,
    } as never);

  const openCreate = () => {
    setErrors({});
    setForm({ draft: EMPTY });
  };
  const openEdit = (s: Station) => {
    setErrors({});
    setForm({
      id: s.id,
      draft: {
        code: s.code,
        name: s.name,
        address: s.address,
        district: s.district,
        lat: s.lat,
        lng: s.lng,
        interchange: s.interchange,
        status: s.status,
      },
    });
  };
  const submit = () => {
    if (!form) return;
    const next = validateStation(form.draft, stations, form.id);
    setErrors(next);
    if (Object.keys(next).length) return;
    const error = requestStationUpsert(form.draft, form.id);
    if (error) return toast.error(error);
    toast.success(
      form.id
        ? "Đã gửi yêu cầu sửa ga tới Manager. Thông tin chỉ thay đổi sau khi được phê duyệt."
        : "Đã gửi yêu cầu thêm ga tới Manager để phê duyệt.",
    );
    setForm(null);
  };

  const openDelete = (s: Station) => setDeleteTarget(s);
  const confirmDelete = (reason: string) => {
    if (!deleteTarget) return;
    const error = requestStationDelete(deleteTarget, reason);
    if (error) {
      toast.error(error);
      setDeleteTarget(null);
      return;
    }
    toast.success(`Đã gửi yêu cầu xóa ga ${deleteTarget.name} tới Manager để phê duyệt.`);
    setDeleteTarget(null);
  };

  return {
    rows,
    total: all.length,
    pendingCount,
    query,
    setQuery,
    status,
    setStatus,
    selected: all.find((s) => s.id === selectedId),
    select,
    form,
    setForm,
    errors,
    openCreate,
    openEdit,
    submit,
    deleteTarget,
    openDelete,
    closeDelete: () => setDeleteTarget(null),
    confirmDelete,
  };
}

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, apiErrorMessage, stationsApi, type StationResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { NETWORK_KEY, networkKeys, useNetwork } from "@/pages/stations/hooks/useNetwork";
import {
  EMPTY_STATION_DRAFT,
  buildCreateStationBody,
  buildUpdateStationBody,
  stationErrorsFromApi,
  toStationDraft,
  validateStationDraft,
} from "@/pages/stations/stations.service";
import type {
  StationDraft,
  StationErrors,
  StationListRow,
  StationStatusFilter,
} from "@/pages/stations/stations.types";

export const STATION_MANAGE = "STATION_MANAGE";

export function useStations() {
  const { station: fromUrl } = useSearch({ strict: false }) as { station?: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(STATION_MANAGE);
  const net = useNetwork();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StationStatusFilter>("ALL");
  const [form, setForm] = useState<{ id?: number; draft: StationDraft } | null>(null);
  const [errors, setErrors] = useState<StationErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<StationListRow | null>(null);
  const [pending, setPending] = useState(false);

  const all: StationListRow[] = net.stations.map((s) => ({
    ...s,
    lines: net.linesByStation.get(s.id) ?? [],
  }));
  const q = query.trim().toLowerCase();
  const rows = all
    .filter(
      (s) =>
        (status === "ALL" || s.status === status) &&
        `${s.code} ${s.nameStation} ${s.district ?? ""}`.toLowerCase().includes(q),
    )
    .sort((a, b) => a.code.localeCompare(b.code));
  const selected = all.find((s) => String(s.id) === fromUrl) ?? rows[0];
  const select = (id: number) =>
    navigate({
      to: "/stations",
      search: (prev: Record<string, unknown>) => ({ ...prev, station: String(id) }),
      replace: true,
    } as never);

  const reload = () => queryClient.invalidateQueries({ queryKey: NETWORK_KEY });

  const openCreate = () => {
    setErrors({});
    setForm({ draft: EMPTY_STATION_DRAFT });
  };
  const openEdit = (s: StationResponse) => {
    setErrors({});
    setForm({ id: s.id, draft: toStationDraft(s) });
  };

  const submit = async () => {
    if (!form || pending) return;
    const next = validateStationDraft(form.draft, net.stations, form.id);
    setErrors(next);
    if (Object.keys(next).length) return;
    const current = form.id ? net.stations.find((s) => s.id === form.id) : undefined;
    const body = current ? buildUpdateStationBody(form.draft, current) : null;
    if (body && !Object.keys(body).length) return toast.info("Chưa có thay đổi nào");
    setPending(true);
    try {
      const saved = current
        ? await stationsApi.update(current.id, body!)
        : await stationsApi.create(buildCreateStationBody(form.draft));
      await reload();
      toast.success(
        current ? `Đã cập nhật ga ${saved.nameStation}` : `Đã thêm ga ${saved.nameStation}`,
      );
      setForm(null);
      select(saved.id);
    } catch (error) {
      const fieldErrors = stationErrorsFromApi(error);
      if (fieldErrors) setErrors(fieldErrors);
      else toast.error(apiErrorMessage(error));
      if (error instanceof ApiError && error.status === 404) {
        setForm(null);
        void reload();
      }
    } finally {
      setPending(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || pending) return;
    setPending(true);
    try {
      // Kiểm tra lại với backend: danh sách tuyến trên màn hình có thể đã cũ.
      const lines = await queryClient.fetchQuery({
        queryKey: networkKeys.stationLines(deleteTarget.id),
        queryFn: () => stationsApi.lines(deleteTarget.id),
        staleTime: 0,
      });
      if (lines.length) {
        toast.error(
          `Ga đang thuộc tuyến ${lines.map((l) => l.code).join(", ")}. Hãy gỡ ga khỏi tuyến ở tab "Tuyến & thứ tự ga" trước khi xoá, hoặc chuyển trạng thái sang Tạm ngừng/Bảo trì.`,
        );
        return;
      }
      await stationsApi.remove(deleteTarget.id);
      toast.success(`Đã xoá ga ${deleteTarget.nameStation}`);
      setDeleteTarget(null);
      await reload();
    } catch (error) {
      toast.error(apiErrorMessage(error));
      if (error instanceof ApiError && (error.status === 409 || error.status === 404))
        void reload();
    } finally {
      setPending(false);
    }
  };

  return {
    canManage,
    loading: net.loading,
    loadError: net.loadError,
    reload,
    mapNetwork: net.mapNetwork,
    lines: net.lines,
    rows,
    total: all.length,
    query,
    setQuery,
    status,
    setStatus,
    selected,
    select,
    form,
    setForm,
    errors,
    pending,
    openCreate,
    openEdit,
    submit,
    deleteTarget,
    openDelete: (s: StationListRow) => setDeleteTarget(s),
    closeDelete: () => setDeleteTarget(null),
    confirmDelete,
  };
}

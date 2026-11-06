import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import type { Role } from "@/lib/auth";
import { approvalsStore } from "@/mocks/admin";
import { workRequestsStore } from "@/mocks/requests";
import type { WORK_FILTER_OPTIONS } from "@/pages/approvals/work-requests.constants";
import { isClosed, waitingOn } from "@/pages/approvals/work-requests.service";

export type WorkFilter = (typeof WORK_FILTER_OPTIONS)[number]["value"];

/** Yêu cầu đang mở nằm trên URL (`?request=`) để dẫn link thẳng tới, vd. từ banner đang xử lý. */
export function useSelectedRequest() {
  const { request } = useSearch({ strict: false }) as { request?: string };
  const navigate = useNavigate();
  const select = (id: string | null) =>
    navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({ ...prev, request: id ?? undefined }),
      replace: true,
    } as never);
  return { selectedId: request ?? null, select };
}

export function useWorkRequests(role: Role) {
  const list = workRequestsStore.use();
  const approvals = approvalsStore.use();
  const [filter, setFilter] = useState<WorkFilter>("WAITING_ME");
  const [formOpen, setFormOpen] = useState(false);
  const { selectedId, select } = useSelectedRequest();

  const rows = list.filter((request) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return !isClosed(request.status);
    if (filter === "WAITING_ME") return waitingOn(request, approvals) === role;
    return request.status === filter;
  });

  return {
    rows,
    approvals,
    filter,
    setFilter,
    formOpen,
    setFormOpen,
    selected: list.find((request) => request.id === selectedId) ?? null,
    select,
  };
}

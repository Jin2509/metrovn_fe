import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminAuditApi, apiErrorMessage, type AuthEventType } from "@/lib/api";
import { auditDayRange } from "@/pages/auditlogs/auditlogs.service";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

export function useAuditLogs() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<AuthEventType | "ALL">("ALL");
  const [day, setDay] = useState("");
  const [page, setPage] = useState(0);

  // Chờ người dùng gõ xong rồi mới gọi API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(0);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const logsQuery = useQuery({
    queryKey: ["admin", "audit-logs", { search, type, day, page }],
    queryFn: () =>
      adminAuditApi.list({
        q: search,
        type: type === "ALL" ? undefined : type,
        ...auditDayRange(day),
        page,
        size: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
    retry: false,
  });

  return {
    query,
    setQuery,
    type,
    setType: (next: AuthEventType | "ALL") => {
      setType(next);
      setPage(0);
    },
    day,
    setDay: (next: string) => {
      setDay(next);
      setPage(0);
    },
    page,
    setPage,
    pageSize: PAGE_SIZE,
    rows: logsQuery.data?.content ?? [],
    totalPages: logsQuery.data?.page.totalPages ?? 0,
    total: logsQuery.data?.page.totalElements ?? 0,
    loading: logsQuery.isPending,
    refreshing: logsQuery.isFetching,
    loadError: logsQuery.isError ? apiErrorMessage(logsQuery.error) : "",
    refresh: () => void logsQuery.refetch(),
  };
}

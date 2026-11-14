import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage, paymentsApi, transactionsApi, type PaymentView } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  REFUNDS_KEY,
  TRANSACTIONS_KEY,
  invalidRange,
  toTransactionQuery,
} from "@/pages/transactions/transactions.service";
import { DEFAULT_TRANSACTION_FILTERS } from "@/pages/transactions/transactions.constants";
import type { TransactionFilters } from "@/pages/transactions/transactions.types";

export const PAYMENT_MANAGE = "PAYMENT_MANAGE";

export function useTransactions() {
  const queryClient = useQueryClient();
  const canManage = useAuth().hasPermission(PAYMENT_MANAGE);
  const [filters, setFiltersState] = useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<PaymentView | null>(null);
  const [pending, setPending] = useState("");
  const badRange = invalidRange(filters);
  const query = useQuery({
    queryKey: [...TRANSACTIONS_KEY, filters, page],
    queryFn: () => transactionsApi.list(toTransactionQuery(filters, page)),
    enabled: canManage && !badRange,
    placeholderData: keepPreviousData,
    retry: false,
  });
  const refunds = useQuery({
    queryKey: REFUNDS_KEY,
    queryFn: () => paymentsApi.byStatus({ status: "REFUND_PENDING", size: 50 }),
    enabled: canManage,
    retry: false,
  });

  const setFilters = (next: TransactionFilters) => {
    setFiltersState(next);
    setPage(0);
  };

  const confirmRefunded = async (payment: PaymentView) => {
    if (pending) return;
    setPending(payment.id);
    try {
      await paymentsApi.confirmRefunded(payment.id);
      toast.success("Đã xác nhận hoàn tiền");
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      setSelected(null);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setPending("");
    }
  };

  const data = query.data;
  return {
    canManage,
    filters,
    setFilters,
    badRange,
    page,
    setPage,
    loading: query.isPending && !badRange,
    fetching: query.isFetching,
    loadError: query.error ? apiErrorMessage(query.error) : "",
    reload: () => void query.refetch(),
    rows: data?.transactions.content ?? [],
    pageInfo: data?.transactions.page,
    totalAmount: data?.totalAmountVnd ?? 0,
    refunds: refunds.data?.content ?? [],
    refundsError: refunds.error ? apiErrorMessage(refunds.error) : "",
    selected,
    select: setSelected,
    pending,
    confirmRefunded,
  };
}

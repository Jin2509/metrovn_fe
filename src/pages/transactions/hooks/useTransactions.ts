import { useState } from "react";
import { txnStore, type Txn } from "@/mocks/admin";
import { filterTransactions } from "@/pages/transactions/transactions.service";
import { DEFAULT_TRANSACTION_FILTERS } from "@/pages/transactions/transactions.constants";
import type { TransactionFilters } from "@/pages/transactions/transactions.types";

export function useTransactions() {
  const transactions = txnStore.use();
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_TRANSACTION_FILTERS);
  const [selectedTransaction, setSelectedTransaction] = useState<Txn | null>(null);
  const rows = filterTransactions(transactions, filters);

  return {
    filters,
    setFilters,
    rows,
    selectedTransaction,
    selectTransaction: setSelectedTransaction,
  };
}

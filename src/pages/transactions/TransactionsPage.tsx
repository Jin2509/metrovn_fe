import { AppShell } from "@/components/app-shell";
import { Section } from "@/components/shared";
import { TransactionDetailSheet } from "@/pages/transactions/components/TransactionDetailSheet";
import { TransactionFilters } from "@/pages/transactions/components/TransactionFilters";
import { TransactionsTable } from "@/pages/transactions/components/TransactionsTable";
import { useTransactions } from "@/pages/transactions/hooks/useTransactions";

export function TransactionsPage() {
  const { filters, setFilters, rows, selectedTransaction, selectTransaction } = useTransactions();

  return (
    <AppShell title="Giao dịch" roles={["ADMIN", "ACCOUNTANT"]}>
      <Section title="Tra cứu giao dịch">
        <TransactionFilters filters={filters} onFiltersChange={setFilters} />
        <TransactionsTable rows={rows} onSelect={selectTransaction} />
      </Section>
      <TransactionDetailSheet
        transaction={selectedTransaction}
        onClose={() => selectTransaction(null)}
      />
    </AppShell>
  );
}

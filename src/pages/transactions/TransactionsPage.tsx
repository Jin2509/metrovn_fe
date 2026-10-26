import { ListChecks, Receipt } from "lucide-react";
import { AppShell, PageTabs } from "@/components/app-shell";
import { ReconciliationPanel } from "@/pages/reconciliation";
import { Section } from "@/components/shared";
import { TransactionDetailSheet } from "@/pages/transactions/components/TransactionDetailSheet";
import { TransactionFilters } from "@/pages/transactions/components/TransactionFilters";
import { TransactionsTable } from "@/pages/transactions/components/TransactionsTable";
import { useTransactions } from "@/pages/transactions/hooks/useTransactions";

function TransactionLookupPanel() {
  const { filters, setFilters, rows, selectedTransaction, selectTransaction } = useTransactions();

  return (
    <>
      <Section title="Tra cứu giao dịch">
        <TransactionFilters filters={filters} onFiltersChange={setFilters} />
        <TransactionsTable rows={rows} onSelect={selectTransaction} />
      </Section>
      <TransactionDetailSheet
        transaction={selectedTransaction}
        onClose={() => selectTransaction(null)}
      />
    </>
  );
}

export function TransactionsPage() {
  return (
    <AppShell title="Giao dịch & đối soát">
      <PageTabs
        tabs={[
          {
            value: "lookup",
            label: "Tra cứu giao dịch",
            icon: Receipt,
            content: <TransactionLookupPanel />,
          },
          {
            value: "reconciliation",
            label: "Đối soát",
            icon: ListChecks,
            content: <ReconciliationPanel />,
          },
        ]}
      />
    </AppShell>
  );
}

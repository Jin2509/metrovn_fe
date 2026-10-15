import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ReconciliationDateFilters({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        className="h-9 w-40"
        value={from}
        onChange={(event) => onFromChange(event.target.value)}
      />
      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
      <Input
        type="date"
        className="h-9 w-40"
        value={to}
        onChange={(event) => onToChange(event.target.value)}
      />
    </div>
  );
}

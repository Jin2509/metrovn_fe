import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const decimal = (value: number, digits = 3) =>
  value.toLocaleString("vi-VN", { maximumFractionDigits: digits });

export function NumberField({
  id,
  label,
  hint,
  value,
  step = "any",
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  step?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TicketTypeChecks({
  name,
  ticketTypes,
  value,
  disabled,
  onChange,
}: {
  name: string;
  ticketTypes: { id: string; name: string }[];
  value: string[];
  disabled?: boolean;
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ticketTypes.map((type) => (
        <label
          key={type.id}
          htmlFor={`${name}-${type.id}`}
          className="flex items-center gap-2 text-sm"
        >
          <Checkbox
            id={`${name}-${type.id}`}
            checked={value.includes(type.id)}
            disabled={disabled}
            onCheckedChange={(checked) =>
              onChange(
                checked === true ? [...value, type.id] : value.filter((id) => id !== type.id),
              )
            }
          />
          {type.name}
        </label>
      ))}
    </div>
  );
}

export function RuleList({ rules }: { rules: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
      {rules.map((rule) => (
        <li key={rule}>{rule}</li>
      ))}
    </ul>
  );
}

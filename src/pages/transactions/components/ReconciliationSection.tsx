import { useState } from "react";
import { FieldError } from "@/components/form-field";
import { DataTable, money, Section, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReconcileMismatch } from "@/lib/api";
import { useReconciliation } from "@/pages/transactions/hooks/useReconciliation";
import { SEPAY_RESULT_LABEL } from "@/pages/transactions/transactions.constants";

/** Đối chiếu giao dịch nhận từ SePay với giao dịch của hệ thống trong một khoảng ngày. */
export function ReconciliationSection() {
  const r = useReconciliation();
  const result = r.result;
  return (
    <Section
      title="Đối soát với SePay"
      description="Chọn khoảng ngày rồi chạy đối soát. Các giao dịch lệch cần ghi chú cách xử lý để đánh dấu đã đối soát."
    >
      <form
        noValidate
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void r.run();
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="rec-from" className="text-xs">
            Từ ngày
          </Label>
          <Input
            id="rec-from"
            type="date"
            className="w-40"
            value={r.from}
            onChange={(e) => r.setFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rec-to" className="text-xs">
            Đến ngày
          </Label>
          <Input
            id="rec-to"
            type="date"
            className="w-40"
            value={r.to}
            onChange={(e) => r.setTo(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={r.running}>
          {r.running ? "Đang đối soát…" : "Chạy đối soát"}
        </Button>
      </form>
      <div role="alert" className="mt-2">
        <FieldError fieldId="rec">{r.error}</FieldError>
      </div>
      {result && (
        <div className="mt-4 space-y-3" role="status">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Giao dịch SePay</dt>
              <dd className="text-lg font-semibold">
                {result.gatewayCount} · {money(result.gatewayTotalVnd)}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Hệ thống ghi nhận</dt>
              <dd className="text-lg font-semibold">{money(result.systemTotalVnd)}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Khớp / lệch</dt>
              <dd className="text-lg font-semibold">
                {result.matchedCount} /{" "}
                <span className={result.mismatchedCount ? "text-destructive" : ""}>
                  {result.mismatchedCount}
                </span>
              </dd>
            </div>
          </dl>
          {result.mismatches.length > 0 ? (
            <DataTable
              rows={result.mismatches}
              label="Giao dịch lệch"
              rowKey={(m) => `${m.sepayId ?? ""}-${m.paymentId ?? ""}`}
              cols={[
                {
                  h: "Kết quả",
                  c: (m) => <StatusBadge s="REJECTED" label={SEPAY_RESULT_LABEL[m.result]} />,
                },
                { h: "Lý do", c: (m) => m.reason },
                { h: "Cổng", c: (m) => money(m.gatewayAmountVnd), className: "text-right" },
                {
                  h: "Hệ thống",
                  c: (m) => (m.systemAmountVnd == null ? "—" : money(m.systemAmountVnd)),
                  className: "text-right",
                },
                {
                  h: "Ghi chú xử lý",
                  c: (m) => (
                    <MismatchNote
                      mismatch={m}
                      saved={m.sepayId ? r.noted[m.sepayId] : undefined}
                      onSave={r.saveNote}
                    />
                  ),
                },
              ]}
            />
          ) : (
            <p className="text-sm text-success">Không có giao dịch lệch trong khoảng này.</p>
          )}
        </div>
      )}
    </Section>
  );
}

function MismatchNote({
  mismatch,
  saved,
  onSave,
}: {
  mismatch: ReconcileMismatch;
  saved?: string;
  onSave: (sepayId: number, note: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  if (!mismatch.sepayId) return <span className="text-xs text-muted-foreground">—</span>;
  if (saved) return <span className="text-xs">{saved}</span>;
  const id = `note-${mismatch.sepayId}`;
  return (
    <form
      className="flex gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!note.trim() || pending) return;
        setPending(true);
        void onSave(mismatch.sepayId!, note.trim()).finally(() => setPending(false));
      }}
    >
      <Label htmlFor={id} className="sr-only">
        Ghi chú xử lý giao dịch SePay {mismatch.sepayId}
      </Label>
      <Input
        id={id}
        className="h-8 w-48"
        value={note}
        maxLength={1000}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button size="sm" type="submit" disabled={pending || !note.trim()}>
        Lưu
      </Button>
    </form>
  );
}

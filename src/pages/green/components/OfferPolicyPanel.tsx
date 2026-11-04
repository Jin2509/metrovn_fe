import { useState } from "react";
import { money, Section } from "@/components/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STUDENT_ONLY_TICKET_ID } from "@/mocks/green";
import { NumberField, TicketTypeChecks } from "@/pages/green/components/fields";
import { previewFare } from "@/pages/green/green.service";
import type { GreenConfigForm } from "@/pages/green/hooks/useGreenConfig";

function FarePreviewCard({ form }: { form: GreenConfigForm }) {
  const { config, ticketTypes } = form;
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes[0]?.id ?? "");
  const [tierId, setTierId] = useState("TREE");
  const [isStudent, setIsStudent] = useState(true);

  const type = ticketTypes.find((t) => t.id === ticketTypeId) ?? ticketTypes[0];
  const base = type.price;
  const fare = previewFare(
    {
      ticketTypeId: type.id,
      base,
      tier: config.tiers.find((t) => t.id === tierId) ?? config.tiers[0],
      isStudent,
    },
    config.policy,
  );

  return (
    <Section title="Thử tính giá vé" description="Tính theo cấu hình đang chỉnh ở bên cạnh.">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Loại vé</Label>
            <Select value={type.id} onValueChange={setTicketTypeId}>
              <SelectTrigger aria-label="Loại vé">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ticketTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cấp thành viên</Label>
            <Select value={tierId} onValueChange={setTierId}>
              <SelectTrigger aria-label="Cấp thành viên">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.tiers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <label htmlFor="preview-student" className="flex items-center gap-2 text-sm">
          <Checkbox
            id="preview-student"
            checked={isStudent}
            onCheckedChange={(checked) => setIsStudent(checked === true)}
          />
          Đã xác nhận sinh viên
        </label>

        {fare.blocked ? (
          <p className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
            {fare.reason}
          </p>
        ) : (
          <dl className="divide-y rounded-lg border text-sm">
            <div className="flex justify-between gap-4 px-3 py-2">
              <dt className="text-muted-foreground">Giá gốc</dt>
              <dd>{money(base)}</dd>
            </div>
            {fare.lines.map((line) => (
              <div key={line.label} className="flex justify-between gap-4 px-3 py-2">
                <dt className="text-muted-foreground">
                  {line.label} (-{line.percent}%)
                </dt>
                <dd>-{money(line.amount)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 bg-muted/50 px-3 py-2 font-semibold">
              <dt>Khách trả</dt>
              <dd>{money(fare.total)}</dd>
            </div>
          </dl>
        )}
      </div>
    </Section>
  );
}

/** Tab "Chính sách ưu đãi": mức giảm áp dụng cho vé nào. Chính sách sinh viên giảm trước, cấp CPoint giảm tiếp. */
export function OfferPolicyPanel({ form }: { form: GreenConfigForm }) {
  const { config, locked, update, ticketTypes } = form;
  const { policy } = config;
  const setPolicy = (patch: Partial<typeof policy>) => update({ policy: { ...policy, ...patch } });

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="min-w-0 space-y-6">
        <Section
          title="Giảm theo cấp CPoint"
          description="Loại vé được giảm theo cấp của thành viên."
        >
          <TicketTypeChecks
            name="tier-scope"
            ticketTypes={ticketTypes}
            value={policy.tierTicketTypeIds}
            disabled={locked}
            onChange={(tierTicketTypeIds) => setPolicy({ tierTicketTypeIds })}
          />
        </Section>
        <Section
          title="Chính sách sinh viên"
          description="Chỉ dành cho tài khoản đang có xác nhận sinh viên còn hiệu lực. Giảm trước, cấp CPoint giảm tiếp trên phần còn lại."
        >
          <div className="space-y-4">
            <div className="max-w-xs">
              <NumberField
                id="student-percent"
                label="Mức giảm (%)"
                value={policy.studentPercent}
                disabled={locked}
                onChange={(studentPercent) => setPolicy({ studentPercent })}
              />
            </div>
            <TicketTypeChecks
              name="student-scope"
              ticketTypes={ticketTypes.filter((t) => t.id !== STUDENT_ONLY_TICKET_ID)}
              value={policy.studentTicketTypeIds}
              disabled={locked}
              onChange={(studentTicketTypeIds) => setPolicy({ studentTicketTypeIds })}
            />
            <p className="text-xs text-muted-foreground">
              Vé tháng HSSV luôn chỉ bán cho người đã xác nhận sinh viên, giá đặt ở trang Giá vé.
            </p>
          </div>
        </Section>
      </div>
      <FarePreviewCard form={form} />
    </div>
  );
}

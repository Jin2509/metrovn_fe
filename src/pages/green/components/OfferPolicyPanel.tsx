import { useState } from "react";
import { money, Section } from "@/components/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { distancePricesStore, promosStore } from "@/mocks/admin";
import { STUDENT_ONLY_TICKET_ID, type OfferCombineMode } from "@/mocks/green";
import { NumberField, TicketTypeChecks } from "@/pages/green/components/fields";
import { previewFare } from "@/pages/green/green.service";
import type { GreenConfigForm } from "@/pages/green/hooks/useGreenConfig";

const COMBINE_OPTIONS: { value: OfferCombineMode; label: string; hint: string }[] = [
  {
    value: "SEQUENTIAL",
    label: "Cộng dồn lần lượt",
    hint: "Sinh viên và chương trình giảm trước, cấp CPoint giảm trên phần còn lại. App đang tính theo cách này.",
  },
  {
    value: "BEST_ONLY",
    label: "Chỉ lấy mức cao nhất",
    hint: "Mỗi vé chỉ hưởng một ưu đãi có phần trăm lớn nhất.",
  },
];
const NO_CAMPAIGN = "NONE";

function FarePreviewCard({ form }: { form: GreenConfigForm }) {
  const { config, ticketTypes } = form;
  const prices = distancePricesStore.use();
  const campaigns = promosStore.use().filter((promo) => promo.status === "ACTIVE");
  const [ticketTypeId, setTicketTypeId] = useState("TT1");
  const [tierId, setTierId] = useState("TREE");
  const [isStudent, setIsStudent] = useState(true);
  const [campaignId, setCampaignId] = useState(NO_CAMPAIGN);

  const type = ticketTypes.find((t) => t.id === ticketTypeId)!;
  // Vé lượt tính theo cự ly: lấy thử bậc 5–10 km.
  const base = type.price || prices[1].price;
  const campaign = campaigns.find((promo) => promo.id === campaignId);
  const fare = previewFare(
    {
      ticketTypeId,
      base,
      tier: config.tiers.find((t) => t.id === tierId) ?? config.tiers[0],
      isStudent,
      campaign: campaign && { name: campaign.name, percent: campaign.discount },
    },
    config.policy,
  );

  return (
    <Section title="Thử tính giá vé" description="Tính theo cấu hình đang chỉnh ở bên cạnh.">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Loại vé</Label>
            <Select value={ticketTypeId} onValueChange={setTicketTypeId}>
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
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Chương trình ưu đãi</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger aria-label="Chương trình ưu đãi">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CAMPAIGN}>Không có</SelectItem>
                {campaigns.map((promo) => (
                  <SelectItem key={promo.id} value={promo.id}>
                    {promo.name} (-{promo.discount}%)
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
              <dt className="text-muted-foreground">Giá gốc{!type.price && " (bậc 5–10 km)"}</dt>
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
        {!fare.blocked && fare.capped && (
          <p className="text-xs text-muted-foreground">
            Đã chạm tổng mức giảm tối đa nên ưu đãi sau bị giới hạn.
          </p>
        )}
      </div>
    </Section>
  );
}

/** Tab "Chính sách ưu đãi": ưu đãi áp dụng cho vé nào và cộng với nhau ra sao. */
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
          title="Ưu đãi sinh viên"
          description="Chỉ dành cho tài khoản đang có xác nhận sinh viên còn hiệu lực."
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
        <Section title="Khi một vé có nhiều ưu đãi">
          <div className="space-y-4">
            <RadioGroup
              value={policy.combineMode}
              disabled={locked}
              onValueChange={(value) => setPolicy({ combineMode: value as OfferCombineMode })}
            >
              {COMBINE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`combine-${option.value}`}
                  className="flex items-start gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary"
                >
                  <RadioGroupItem
                    id={`combine-${option.value}`}
                    value={option.value}
                    className="mt-0.5"
                  />
                  <span className="text-sm">
                    <span className="block font-medium">{option.label}</span>
                    <span className="text-muted-foreground">{option.hint}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
            <div className="max-w-xs">
              <NumberField
                id="max-total"
                label="Tổng mức giảm tối đa (%)"
                hint="100 là không giới hạn."
                value={policy.maxTotalPercent}
                disabled={locked}
                onChange={(maxTotalPercent) => setPolicy({ maxTotalPercent })}
              />
            </div>
          </div>
        </Section>
      </div>
      <FarePreviewCard form={form} />
    </div>
  );
}

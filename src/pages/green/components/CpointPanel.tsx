import { useState } from "react";
import { DataTable, Section } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberField, RuleList } from "@/pages/green/components/fields";
import { cpointForCheckins, pointsPerCheckin } from "@/pages/green/green.service";
import type { GreenConfigForm } from "@/pages/green/hooks/useGreenConfig";

/** Tab "Điểm CPoint": mỗi loại vé có mức điểm riêng, cộng ở mỗi lần check-in tại ga. */
export function CpointPanel({ form }: { form: GreenConfigForm }) {
  const { config, locked, update, ticketTypes } = form;
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes[0]?.id ?? "");
  const [checkins, setCheckins] = useState(10);
  const type = ticketTypes.find((t) => t.id === ticketTypeId) ?? ticketTypes[0];
  const points = type ? pointsPerCheckin(type.id, config) : 0;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Section
        title="Điểm mỗi lần check-in"
        description="Hành khách đi Metro càng nhiều càng được nhiều điểm, nhờ đó giảm lượng CO₂ phát thải."
      >
        <div className="space-y-4">
          <p className="rounded-lg bg-muted/60 p-4 text-sm font-medium">
            CPoint nhận được = Điểm của loại vé × Số lần check-in
          </p>
          <DataTable
            rows={ticketTypes}
            cols={[
              { h: "Loại vé", c: (t) => <b>{t.name}</b> },
              {
                h: "Điểm mỗi lần check-in",
                c: (t) => (
                  <Input
                    type="number"
                    min={0}
                    aria-label={`Điểm mỗi lần check-in của ${t.name}`}
                    className="h-8 w-24"
                    value={pointsPerCheckin(t.id, config)}
                    disabled={locked}
                    onChange={(event) =>
                      update({
                        checkinPoints: {
                          ...config.checkinPoints,
                          [t.id]: Number(event.target.value),
                        },
                      })
                    }
                  />
                ),
              },
            ]}
          />
          <RuleList
            rules={[
              "Mỗi lần check-in hợp lệ tại ga được cộng đúng số điểm của loại vé đang dùng.",
              "Mua vé không được cộng điểm, phải đi Metro thật mới có điểm.",
              "Check-in bị từ chối hoặc vé đã hết hạn thì không cộng.",
              "Đổi mức điểm chỉ áp dụng cho các lần check-in sau.",
            ]}
          />
        </div>
      </Section>
      <Section title="Ví dụ tính điểm">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Loại vé</Label>
              <Select value={type?.id} onValueChange={setTicketTypeId}>
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
            <NumberField
              id="preview-checkins"
              label="Số lần check-in"
              value={checkins}
              onChange={setCheckins}
            />
          </div>
          <dl className="rounded-lg border text-sm">
            <div className="flex justify-between gap-4 bg-success/10 px-3 py-2">
              <dt className="font-medium">CPoint nhận được</dt>
              <dd className="font-semibold text-success">
                {points} × {checkins} = {type ? cpointForCheckins(type.id, checkins, config) : 0}{" "}
                CPoint
              </dd>
            </div>
          </dl>
        </div>
      </Section>
    </div>
  );
}

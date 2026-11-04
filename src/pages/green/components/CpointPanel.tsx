import { useState } from "react";
import { Section } from "@/components/shared";
import type { GreenFactors } from "@/mocks/green";
import { decimal, NumberField, RuleList } from "@/pages/green/components/fields";
import {
  carKgPerKm,
  cpointOf,
  metroKgPerKm,
  motorbikeKgPerKm,
  savedKg,
  treeDays,
} from "@/pages/green/green.service";
import type { GreenConfigForm } from "@/pages/green/hooks/useGreenConfig";

const FACTOR_FIELDS: { key: keyof GreenFactors; label: string; hint: string }[] = [
  { key: "gridKgPerKwh", label: "Lưới điện (kg CO₂/kWh)", hint: "Lưới điện Việt Nam 2024" },
  {
    key: "metroKwhPerKm",
    label: "Điện năng Metro (kWh/km/người)",
    hint: "Giả định, thay bằng số vận hành thật",
  },
  { key: "motorbikeLitrePer100Km", label: "Xe máy (lít/100 km)", hint: "Giả định" },
  { key: "petrolKgPerLitre", label: "Xăng (kg CO₂/lít)", hint: "Hệ số phát thải của xăng" },
  { key: "carKgPerKm", label: "Ô tô (kg CO₂/km/xe)", hint: "DEFRA, ô tô xăng" },
  { key: "peoplePerCar", label: "Số người trên ô tô", hint: "Chia đều phát thải cho mỗi người" },
  {
    key: "treeKgPerYear",
    label: "Cây xanh hấp thụ (kg CO₂/năm)",
    hint: "Dùng để quy đổi ngày cây hấp thụ",
  },
];

/** Tab "Điểm CPoint": cách quy đổi từ chuyến đi ra CO₂ đã bớt rồi ra CPoint. */
export function CpointPanel({ form }: { form: GreenConfigForm }) {
  const { config, locked, update } = form;
  const { factors } = config;
  const [km, setKm] = useState(10);
  const kg = savedKg(km, factors);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="min-w-0 space-y-6">
        <Section
          title="Quy đổi CPoint"
          description="CPoint = CO₂ đã bớt (kg) × tỉ lệ, làm tròn xuống."
        >
          <div className="max-w-xs">
            <NumberField
              id="cpoint-per-kg"
              label="CPoint cho mỗi kg CO₂"
              value={config.cpointPerKg}
              disabled={locked}
              onChange={(cpointPerKg) => update({ cpointPerKg })}
            />
          </div>
        </Section>
        <Section
          title="Hệ số phát thải"
          description="Điểm được tính từ tổng quãng đường đã đi, nên đổi hệ số sẽ tính lại điểm của mọi thành viên, kể cả các chuyến cũ."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {FACTOR_FIELDS.map((field) => (
              <NumberField
                key={field.key}
                id={`factor-${field.key}`}
                label={field.label}
                hint={field.hint}
                value={factors[field.key]}
                disabled={locked}
                onChange={(value) => update({ factors: { ...factors, [field.key]: value } })}
              />
            ))}
          </div>
        </Section>
      </div>

      <div className="min-w-0 space-y-6">
        <Section title="Thử tính một chuyến">
          <div className="space-y-4">
            <NumberField id="preview-km" label="Quãng đường (km)" value={km} onChange={setKm} />
            <dl className="divide-y rounded-lg border text-sm">
              {[
                ["Xe máy", `${decimal(km * motorbikeKgPerKm(factors))} kg CO₂`],
                ["Ô tô", `${decimal(km * carKgPerKm(factors))} kg CO₂`],
                ["Metro", `${decimal(km * metroKgPerKm(factors))} kg CO₂`],
                ["Bớt so với xe máy", `${decimal(kg)} kg CO₂`],
                ["Bằng số ngày cây hấp thụ", `${decimal(treeDays(kg, factors), 1)} ngày`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 px-3 py-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 bg-success/10 px-3 py-2">
                <dt className="font-medium">CPoint nhận được</dt>
                <dd className="font-semibold text-success">{cpointOf(kg, config)} CPoint</dd>
              </div>
            </dl>
          </div>
        </Section>
        <Section title="Quy tắc tích điểm">
          <RuleList
            rules={[
              "Chỉ cộng khi vé lượt đã đi xong, vì biết chắc ga đi và ga đến.",
              "Vé ngày và vé tháng chưa được tính, vì không có thông tin từng chuyến.",
              "So sánh với xe máy: phương tiện phổ biến nhất và cho kết quả thận trọng hơn ô tô.",
              "Quãng đường là tổng đường thẳng nối các ga liên tiếp trên lộ trình.",
            ]}
          />
        </Section>
      </div>
    </div>
  );
}

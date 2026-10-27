import { LazyMap } from "@/components/lazy-map";
import { Section } from "@/components/shared";
import { FareTable } from "@/pages/lines/components/FareTable";
import { LineSelector } from "@/pages/lines/components/LineSelector";
import { LineStationEditor } from "@/pages/lines/components/LineStationEditor";
import { useLines } from "@/pages/lines/hooks/useLines";

const fmtKm = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 2 });

/** Tab "Tuyến & thứ tự ga" (UC4-01) trong trang Ga & tuyến. */
export function LinesPanel() {
  const l = useLines();
  const last = l.withChainage.at(-1);
  return (
    <>
      <LineSelector lines={l.lines} value={l.lineId} onValueChange={l.selectLine} />
      <div className="grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
        <LineStationEditor l={l} />
        <div className="min-w-0 space-y-6">
          <Section title="Tổng hợp tuyến">
            <dl className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Số ga</dt>
                <dd className="text-lg font-semibold">{l.rows.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Chiều dài</dt>
                <dd className="text-lg font-semibold">{last ? fmtKm(last.km) : 0} km</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Chạy một chiều</dt>
                <dd className="text-lg font-semibold">
                  {last ? Math.round(last.sec / 60) : 0} phút
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">
              Thời gian chạy một chiều = Σ thời gian chạy giữa các ga + Σ thời gian dừng ở ga giữa;
              dùng làm giá trị gợi ý khi tạo cấu hình vận hành.
            </p>
          </Section>
          {l.line.status === "ACTIVE" && (
            <FareTable key={l.lineId} points={l.withChainage} nameOf={l.stationName} />
          )}
          <Section title="Bản đồ tuyến">
            <LazyMap height={360} visibleLines={[l.lineId]} showBus={false} />
          </Section>
        </div>
      </div>
    </>
  );
}

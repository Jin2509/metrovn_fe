import {
  coastalDots,
  hoangSa,
  islands,
  mainland,
  truongSa,
} from "@/components/brand/vietnam-map-data";
import { cn } from "@/lib/utils";

const WEST = 101.8;
const EAST = 116.4;
const NORTH = 23.6;
const SOUTH = 7.5;
const HEIGHT = 1000;
// Một độ kinh tuyến ngắn lại theo cos của vĩ độ giữa (phép chiếu trụ đều, giống bản mobile).
const WIDTH =
  ((EAST - WEST) * Math.cos((((NORTH + SOUTH) / 2) * Math.PI) / 180) * HEIGHT) / (NORTH - SOUTH);

type Point = [number, number];
const at = (lng: number, lat: number): Point => [
  ((lng - WEST) / (EAST - WEST)) * WIDTH,
  ((NORTH - lat) / (NORTH - SOUTH)) * HEIGHT,
];
const parse = (data: string): Point[] =>
  data.split(" ").map((pair) => {
    const [lng, lat] = pair.split(",").map(Number);
    return at(lng, lat);
  });
const toPath = (points: Point[]) =>
  `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}Z`;

const LAND = [mainland, ...islands].map((ring) => toPath(parse(ring))).join("");
const DOTS = [...parse(coastalDots), ...parse(hoangSa), ...parse(truongSa)];
const HCMC = at(106.7, 10.78);
const HOANG_SA = at(112, 17.35);
const TRUONG_SA = at(113.6, 11.85);

const VIEW_BOX = `0 0 ${WIDTH.toFixed(0)} ${HEIGHT}`;
const OVERLAY = "pointer-events-none absolute inset-0 h-full w-full";

/**
 * Bản đồ Việt Nam chìm làm nền, luôn có quần đảo Hoàng Sa và Trường Sa (cùng dữ liệu với app mobile).
 * Viền sáng nhấp nháy lặp lại; `intro` thêm hiệu ứng mở màn. Mỗi hiệu ứng là một lớp riêng chỉ đổi transform/opacity để GPU tự chạy,
 * nên không bị khựng khi luồng chính đang bận hydrate (xem phần auth-intro trong styles.css).
 */
export function VietnamMap({ className, intro = false }: { className?: string; intro?: boolean }) {
  const label = "fill-sidebar-foreground/90 text-[17px] font-medium";
  return (
    <div className={className}>
      <div className="auth-map-clip h-full">
        <div className="auth-map-slide relative h-full">
          <svg
            viewBox={VIEW_BOX}
            role="img"
            aria-label="Bản đồ Việt Nam, gồm quần đảo Hoàng Sa và quần đảo Trường Sa"
            className="block h-full w-full text-sidebar-foreground"
          >
            <path
              d={LAND}
              fill="currentColor"
              fillOpacity={0.07}
              stroke="currentColor"
              strokeOpacity={0.26}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <g fill="currentColor" fillOpacity={0.75}>
              {DOTS.map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={2.6} />
              ))}
            </g>
            <text x={HOANG_SA[0]} y={HOANG_SA[1]} textAnchor="middle" className={label}>
              Hoàng Sa
            </text>
            <text x={TRUONG_SA[0]} y={TRUONG_SA[1]} textAnchor="middle" className={label}>
              Trường Sa
            </text>
            <g className="text-sidebar-primary" fill="currentColor">
              <circle cx={HCMC[0]} cy={HCMC[1]} r={15} fillOpacity={0.25} />
              <circle cx={HCMC[0]} cy={HCMC[1]} r={6} />
              <text
                x={HCMC[0]}
                y={HCMC[1] - 20}
                textAnchor="middle"
                className="text-[17px] font-semibold"
              >
                TP.HCM
              </text>
            </g>
          </svg>
          <svg viewBox={VIEW_BOX} aria-hidden className={cn("auth-map-glow", OVERLAY)}>
            <path d={LAND} vectorEffect="non-scaling-stroke" />
            {DOTS.map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={4.5} />
            ))}
          </svg>
          {intro && (
            <svg viewBox={VIEW_BOX} aria-hidden className={OVERLAY}>
              <circle className="auth-map-ping" cx={HCMC[0]} cy={HCMC[1]} r={15} />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

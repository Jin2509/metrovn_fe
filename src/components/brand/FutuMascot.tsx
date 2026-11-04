import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const BLINK_EVERY_MS = 4200;
const BLINK_FOR_MS = 140;

/** Linh vật Futu của HopOn (vẽ cùng tỉ lệ với bản mobile): đầu tàu có mặt, thỉnh thoảng chớp mắt. */
export function FutuMascot({ className }: { className?: string }) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let open: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setBlink(true);
      open = setTimeout(() => setBlink(false), BLINK_FOR_MS);
    }, BLINK_EVERY_MS);
    return () => {
      clearInterval(timer);
      clearTimeout(open);
    };
  }, []);

  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("shrink-0", className)}>
      <circle cx={32} cy={90} r={7} fill="#00767E" />
      <circle cx={68} cy={90} r={7} fill="#00767E" />
      <line
        x1={50}
        y1={16}
        x2={62}
        y2={4}
        stroke="#00767E"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <circle cx={63} cy={4} r={3.5} fill="#FFD27A" />
      <rect x={14} y={14} width={72} height={74} rx={22} fill="#00BEC7" />
      <path d="M14 70h72v4a14 14 0 0 1-14 14H28a14 14 0 0 1-14-14z" fill="#00767E" />
      <rect x={23} y={25} width={54} height={37} rx={15} fill="#06192C" />
      {[39, 61].map((x) =>
        blink ? (
          <rect key={x} x={x - 6} y={40} width={12} height={3} rx={1.5} fill="#fff" />
        ) : (
          <g key={x}>
            <circle cx={x} cy={41} r={6.5} fill="#fff" />
            <circle cx={x + 1.2} cy={42} r={3.2} fill="#06192C" />
            <circle cx={x + 2.4} cy={40} r={1.1} fill="#fff" />
          </g>
        ),
      )}
      <circle cx={30} cy={52} r={3.6} fill="#FF8A80" fillOpacity={0.4} />
      <circle cx={70} cy={52} r={3.6} fill="#FF8A80" fillOpacity={0.4} />
      <path
        d="M44.5 52.5a7 5 0 0 0 11 0"
        fill="none"
        stroke="#fff"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <circle cx={29} cy={79} r={4.2} fill="#FFD27A" />
      <circle cx={71} cy={79} r={4.2} fill="#FFD27A" />
    </svg>
  );
}

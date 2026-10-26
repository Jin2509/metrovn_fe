import { Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { STRUCTURE_LABEL, STRUCTURE_LEVEL_M } from "@/mocks/line-structure";
import { LINE_3D_PRESETS, SEGMENT_STRUCTURE_LABEL } from "@/pages/lines/lines.constants";
import type { Line3DModel, Line3DNode, Line3DSegment } from "@/pages/lines/lines.types";

// Mô hình 3D dựng bằng SVG + phép chiếu tự viết: không thêm thư viện WebGL, nhẹ khi tải trang và
// chi phí vẽ tỉ lệ thuận với số ga (mỗi đoạn ray chỉ lấy vài điểm mẫu).
const VIEW_W = 800;
const VIEW_H = 460;
const SAMPLES_PER_SEGMENT = 8;
const PILLAR_EVERY = 2;

type Camera = { yaw: number; pitch: number; zoom: number };
type Projected = [number, number];
type Point3D = { x: number; y: number; z: number };

const DEFAULT_CAMERA: Camera = { ...LINE_3D_PRESETS.perspective, zoom: 1 };
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const toPath = (points: Projected[]) =>
  points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");

function createProjector(camera: Camera, radius: number) {
  const scale = ((Math.min(VIEW_W, VIEW_H) / 2) * 0.9 * camera.zoom) / radius;
  // Phóng đại cao độ để chênh lệch ngầm/trên cao (~30 m) nhìn rõ trên tuyến dài hàng chục km.
  const zScale = (radius * 0.12) / (STRUCTURE_LEVEL_M.ELEVATED - STRUCTURE_LEVEL_M.UNDERGROUND);
  const yaw = (camera.yaw * Math.PI) / 180;
  const pitch = (camera.pitch * Math.PI) / 180;
  const [cosYaw, sinYaw, cosPitch, sinPitch] = [
    Math.cos(yaw),
    Math.sin(yaw),
    Math.cos(pitch),
    Math.sin(pitch),
  ];
  return ({ x, y, z }: Point3D): Projected => {
    const rx = x * cosYaw - y * sinYaw;
    const ry = x * sinYaw + y * cosYaw;
    return [VIEW_W / 2 + rx * scale, VIEW_H / 2 + (-ry * cosPitch - z * zScale * sinPitch) * scale];
  };
}

function sampleSegment(segment: Pick<Line3DSegment, "from" | "to" | "structure">): Point3D[] {
  const { from, to } = segment;
  return Array.from({ length: SAMPLES_PER_SEGMENT + 1 }, (_, i) => {
    const t = i / SAMPLES_PER_SEGMENT;
    const zt = segment.structure === "TRANSITION" ? smoothstep(t) : t;
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      z: from.z + (to.z - from.z) * zt,
    };
  });
}

export function Line3DView({ model, color }: { model: Line3DModel; color: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Lấy mẫu hình học chỉ khi mô hình đổi (đổi thứ tự ga / tuyến), không phải mỗi lần xoay.
  const geometry = useMemo(() => {
    const segments = model.segments.map((segment) => ({
      ...segment,
      points: sampleSegment(segment),
    }));
    const last = model.nodes.at(-1);
    const depotSpur =
      model.depot && last
        ? sampleSegment({ from: last, to: model.depot, structure: "TRANSITION" })
        : null;
    return { segments, depotSpur };
  }, [model]);

  const scene = useMemo(() => {
    const project = createProjector(camera, model.radius);
    const ground = (p: Point3D) => project({ ...p, z: 0 });
    const r = model.radius * 1.1;
    const gridLines = Array.from({ length: 11 }, (_, i) => -r + (i * 2 * r) / 10).flatMap((v) => [
      toPath([ground({ x: v, y: -r, z: 0 }), ground({ x: v, y: r, z: 0 })]),
      toPath([ground({ x: -r, y: v, z: 0 }), ground({ x: r, y: v, z: 0 })]),
    ]);
    const plane = toPath(
      [
        { x: -r, y: -r, z: 0 },
        { x: r, y: -r, z: 0 },
        { x: r, y: r, z: 0 },
        { x: -r, y: r, z: 0 },
      ].map(ground),
    );
    const segments = geometry.segments.map((segment) => ({
      key: `${segment.from.id}-${segment.to.id}`,
      structure: segment.structure,
      track: toPath(segment.points.map(project)),
      shadow: toPath(segment.points.map(ground)),
      underground: segment.points.some((p) => p.z < 0),
      pillars: segment.points
        .filter((p, i) => p.z > 0 && i % PILLAR_EVERY === 0)
        .map((p) => [project(p), ground(p)] as const),
    }));
    const nodes = [...model.nodes, ...(model.depot ? [model.depot] : [])].map((node) => ({
      node,
      at: project(node),
      foot: ground(node),
    }));
    const compass = [project({ x: 0, y: r * 0.95, z: 0 }), ground({ x: 0, y: r * 0.8, z: 0 })];
    return {
      gridLines,
      plane,
      segments,
      nodes,
      compass,
      depotSpur: geometry.depotSpur && toPath(geometry.depotSpur.map(project)),
    };
  }, [camera, geometry, model]);

  // Lăn chuột để phóng to — cần listener non-passive mới chặn được cuộn trang.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setCamera((c) => ({ ...c, zoom: clampZoom(c.zoom * (event.deltaY > 0 ? 0.9 : 1.1)) }));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if ((event.target as Element).closest("[data-node]")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const start = dragRef.current;
    if (!start) return;
    const [dx, dy] = [event.clientX - start.x, event.clientY - start.y];
    dragRef.current = { x: event.clientX, y: event.clientY };
    setCamera((c) => ({
      ...c,
      yaw: (c.yaw + dx * 0.4) % 360,
      pitch: Math.min(85, Math.max(0, c.pitch - dy * 0.3)),
    }));
  };
  const endDrag = () => (dragRef.current = null);

  const selected = [...model.nodes, ...(model.depot ? [model.depot] : [])].find(
    (node) => node.id === selectedId,
  );
  const presetValue =
    (Object.keys(LINE_3D_PRESETS) as (keyof typeof LINE_3D_PRESETS)[]).find(
      (key) =>
        LINE_3D_PRESETS[key].yaw === camera.yaw && LINE_3D_PRESETS[key].pitch === camera.pitch,
    ) ?? "";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={presetValue}
          onValueChange={(value) =>
            value &&
            setCamera((c) => ({ ...c, ...LINE_3D_PRESETS[value as keyof typeof LINE_3D_PRESETS] }))
          }
        >
          <ToggleGroupItem value="perspective" className="px-3">
            Phối cảnh
          </ToggleGroupItem>
          <ToggleGroupItem value="top" className="px-3">
            Từ trên
          </ToggleGroupItem>
          <ToggleGroupItem value="side" className="px-3">
            Ngang
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          aria-label="Thu nhỏ"
          onClick={() => setCamera((c) => ({ ...c, zoom: clampZoom(c.zoom / 1.2) }))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          aria-label="Phóng to"
          onClick={() => setCamera((c) => ({ ...c, zoom: clampZoom(c.zoom * 1.2) }))}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8"
          aria-label="Đặt lại góc nhìn"
          onClick={() => setCamera(DEFAULT_CAMERA)}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={showLabels} onCheckedChange={setShowLabels} />
          Tên ga
        </label>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="Mô hình 3D tuyến metro"
        className="w-full cursor-grab touch-none select-none rounded-xl border bg-muted/30 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* Ray ngầm vẽ trước mặt đất để bị mặt đất phủ mờ lên */}
        {scene.segments
          .filter((segment) => segment.underground)
          .map((segment) => (
            <g key={`u-${segment.key}`}>
              <path
                d={segment.track}
                stroke={color}
                strokeOpacity={0.18}
                strokeWidth={12}
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={segment.track}
                stroke={color}
                strokeWidth={3}
                strokeDasharray="6 4"
                fill="none"
              />
            </g>
          ))}
        <path d={scene.plane} fill="var(--background)" fillOpacity={0.55} stroke="var(--border)" />
        <g stroke="var(--border)" strokeWidth={0.6}>
          {scene.gridLines.map((d, i) => (
            <path key={i} d={d} fill="none" />
          ))}
        </g>
        <path
          d={toPath(scene.compass as Projected[])}
          stroke="var(--muted-foreground)"
          strokeWidth={1}
        />
        <text
          x={scene.compass[0][0]}
          y={scene.compass[0][1] - 4}
          textAnchor="middle"
          fontSize={11}
          fill="var(--muted-foreground)"
        >
          B
        </text>

        {scene.segments.map((segment) => (
          <path
            key={`s-${segment.key}`}
            d={segment.shadow}
            stroke="var(--muted-foreground)"
            strokeOpacity={0.25}
            strokeWidth={3}
            fill="none"
          />
        ))}
        {scene.depotSpur && (
          <path
            d={scene.depotSpur}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="2 4"
            fill="none"
          />
        )}
        <g stroke="var(--muted-foreground)" strokeOpacity={0.55} strokeWidth={1.5}>
          {scene.segments.flatMap((segment) =>
            segment.pillars.map(([top, foot], i) => (
              <line key={`${segment.key}-${i}`} x1={top[0]} y1={top[1]} x2={foot[0]} y2={foot[1]} />
            )),
          )}
        </g>
        {scene.segments
          .filter((segment) => !segment.underground)
          .map((segment) => (
            <path
              key={`e-${segment.key}`}
              d={segment.track}
              stroke={color}
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
            />
          ))}

        {scene.nodes.map(({ node, at, foot }) => {
          const active = node.id === selectedId;
          const isDepot = node.kind === "DEPOT";
          return (
            <g
              key={node.id}
              data-node
              className="cursor-pointer"
              onClick={() => setSelectedId(active ? null : node.id)}
            >
              <title>{`${node.name} · ${STRUCTURE_LABEL[node.structure]} · Km ${node.chainageKm.toFixed(2)}`}</title>
              {node.z !== 0 && (
                <line
                  x1={at[0]}
                  y1={at[1]}
                  x2={foot[0]}
                  y2={foot[1]}
                  stroke={color}
                  strokeOpacity={0.5}
                  strokeDasharray={node.z < 0 ? "2 2" : undefined}
                />
              )}
              {isDepot ? (
                <rect
                  x={at[0] - 7}
                  y={at[1] - 5}
                  width={14}
                  height={10}
                  rx={2}
                  fill="var(--background)"
                  stroke={color}
                  strokeWidth={2}
                />
              ) : (
                <circle
                  cx={at[0]}
                  cy={at[1]}
                  r={(node.interchange ? 7 : 5) + (active ? 2 : 0)}
                  fill={active ? color : "var(--background)"}
                  stroke={color}
                  strokeWidth={node.interchange ? 3 : 2}
                />
              )}
              {(showLabels || active) && (
                <text
                  x={at[0] + 9}
                  y={at[1] - 8}
                  fontSize={active ? 13 : 11}
                  fontWeight={active || node.interchange ? 600 : 400}
                  fill="var(--foreground)"
                  stroke="var(--background)"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {isDepot ? node.name : `${node.no}. ${node.name}`}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <p className="text-xs text-muted-foreground">
        Kéo để xoay · lăn chuột để phóng to · bấm vào ga để xem chi tiết. Cao độ được phóng đại để
        dễ quan sát.
      </p>
      {selected && <NodeDetails node={selected} model={model} />}
      <LineProfile model={model} color={color} selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}

function clampZoom(zoom: number) {
  return Math.min(6, Math.max(0.5, zoom));
}

function NodeDetails({ node, model }: { node: Line3DNode; model: Line3DModel }) {
  const index = model.nodes.findIndex((n) => n.id === node.id);
  const prev = index > 0 ? model.nodes[index - 1] : null;
  const next = index >= 0 ? model.nodes[index + 1] : null;
  const items = [
    ["Kết cấu", STRUCTURE_LABEL[node.structure]],
    ["Cao độ ray", `${node.z > 0 ? "+" : ""}${node.z} m`],
    ["Lý trình", `Km ${node.chainageKm.toFixed(2)}`],
    [
      "Ga trước",
      prev ? `${prev.name} (${(node.chainageKm - prev.chainageKm).toFixed(2)} km)` : "—",
    ],
    ["Ga sau", next ? `${next.name} (${(next.chainageKm - node.chainageKm).toFixed(2)} km)` : "—"],
  ];
  return (
    <div className="rounded-lg border bg-card p-3 text-sm">
      <p className="mb-2 font-semibold">
        {node.kind === "DEPOT" ? node.name : `Ga ${node.name}`}
        {node.interchange && (
          <span className="ml-2 text-xs text-muted-foreground">ga chuyển tuyến</span>
        )}
      </p>
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="text-muted-foreground">{label}:</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const PROFILE_W = 800;
const PROFILE_H = 130;
const PROFILE_PAD = 24;

/** Trắc dọc tuyến: trục ngang = lý trình (km), trục dọc = cao độ ray. */
function LineProfile({
  model,
  color,
  selectedId,
  onSelect,
}: {
  model: Line3DModel;
  color: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const nodes = model.depot ? [...model.nodes, model.depot] : model.nodes;
  const maxKm = nodes.at(-1)?.chainageKm || 1;
  const x = (km: number) => PROFILE_PAD + (km / maxKm) * (PROFILE_W - PROFILE_PAD * 2);
  const levelSpan = STRUCTURE_LEVEL_M.ELEVATED - STRUCTURE_LEVEL_M.UNDERGROUND;
  const y = (z: number) =>
    PROFILE_PAD + ((STRUCTURE_LEVEL_M.ELEVATED - z) / levelSpan) * (PROFILE_H - PROFILE_PAD * 2);

  return (
    <div>
      <div className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          Trắc dọc · {model.totalKm.toFixed(2)} km
        </span>
        {(Object.keys(model.lengthByStructure) as (keyof typeof model.lengthByStructure)[])
          .filter((key) => model.lengthByStructure[key] > 0)
          .map((key) => (
            <span key={key}>
              {SEGMENT_STRUCTURE_LABEL[key]}: {model.lengthByStructure[key].toFixed(2)} km
            </span>
          ))}
      </div>
      <svg
        viewBox={`0 0 ${PROFILE_W} ${PROFILE_H}`}
        className="w-full rounded-lg border bg-muted/30"
      >
        <line
          x1={0}
          x2={PROFILE_W}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 3"
        />
        <text x={4} y={y(0) - 4} fontSize={10} fill="var(--muted-foreground)">
          Mặt đất
        </text>
        <path
          d={toPath(nodes.map((node) => [x(node.chainageKm), y(node.z)]))}
          stroke={color}
          strokeWidth={3}
          fill="none"
        />
        {nodes.map((node) => (
          <circle
            key={node.id}
            cx={x(node.chainageKm)}
            cy={y(node.z)}
            r={node.id === selectedId ? 6 : 4}
            fill={node.id === selectedId ? color : "var(--background)"}
            stroke={color}
            strokeWidth={2}
            className="cursor-pointer"
            onClick={() => onSelect(node.id)}
          >
            <title>{`${node.name} · Km ${node.chainageKm.toFixed(2)}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

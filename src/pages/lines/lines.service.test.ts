import { describe, expect, it } from "vitest";
import { lineStations, stations } from "@/mocks/metro";
import { buildLine3DModel } from "@/pages/lines/lines.service";

const orderOf = (lineId: string) =>
  lineStations(lineId).map((station, index) => ({
    id: station.id,
    name: station.name,
    no: index + 1,
  }));

describe("buildLine3DModel", () => {
  it("Tuyến 1: lý trình tăng dần, kết cấu ngầm → chuyển tiếp → trên cao, có depot", () => {
    const model = buildLine3DModel(orderOf("L1"), stations, "L1");
    expect(model.nodes).toHaveLength(14);
    expect(model.segments).toHaveLength(13);
    expect(model.nodes[0]).toMatchObject({
      name: "Bến Thành",
      structure: "UNDERGROUND",
      chainageKm: 0,
    });
    expect(model.nodes.at(-1)).toMatchObject({ name: "Suối Tiên", structure: "ELEVATED" });
    expect(model.segments[2].structure).toBe("TRANSITION");
    expect(model.depot?.kind).toBe("DEPOT");
    for (let i = 1; i < model.nodes.length; i++) {
      expect(model.nodes[i].chainageKm).toBeGreaterThan(model.nodes[i - 1].chainageKm);
    }
    // Tuyến 1 thực tế dài ~19,7 km — đo theo đường chim bay giữa các ga phải gần con số này.
    expect(model.totalKm).toBeGreaterThan(17);
    expect(model.totalKm).toBeLessThan(21);
    const sum = Object.values(model.lengthByStructure).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(model.totalKm, 6);
  });

  it("dựng lại theo thứ tự đang chỉnh và bỏ qua mã ga không tồn tại", () => {
    const order = orderOf("L1").reverse();
    const model = buildLine3DModel([...order, { id: "NOPE", name: "?", no: 99 }], stations, "L1");
    expect(model.nodes[0].name).toBe("Suối Tiên");
    expect(model.nodes).toHaveLength(14);
  });
});

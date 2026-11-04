import { Section } from "@/components/shared";
import { LazyMap } from "@/components/lazy-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MetroLine } from "@/mocks/metro";
import { Line3DView } from "@/pages/lines/components/Line3DView";
import type { Line3DModel } from "@/pages/lines/lines.types";

export function LineMapPreview({ line, model }: { line: MetroLine; model: Line3DModel }) {
  return (
    <Section title="Xem trước tuyến">
      <Tabs defaultValue="3d">
        <TabsList className="mb-3">
          <TabsTrigger value="3d">Mô hình 3D</TabsTrigger>
          <TabsTrigger value="map">Bản đồ 2D</TabsTrigger>
        </TabsList>
        <TabsContent value="3d">
          <Line3DView key={line.id} model={model} color={line.colorHex} />
        </TabsContent>
        <TabsContent value="map">
          <LazyMap height={560} visibleLines={[line.id]} showBus={false} />
        </TabsContent>
      </Tabs>
    </Section>
  );
}

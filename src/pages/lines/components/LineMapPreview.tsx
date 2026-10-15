import { Section } from "@/components/shared";
import { LazyMap } from "@/components/lazy-map";

export function LineMapPreview({ lineId }: { lineId: string }) {
  return (
    <Section title="Xem trước trên bản đồ">
      <LazyMap height={560} visibleLines={[lineId]} showBus={false} />
    </Section>
  );
}

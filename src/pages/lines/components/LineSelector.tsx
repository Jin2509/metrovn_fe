import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MetroLine } from "@/mocks/metro";

export function LineSelector({
  lines,
  value,
  onValueChange,
}: {
  lines: MetroLine[];
  value: string;
  onValueChange: (lineId: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList>
        {lines.map((line) => (
          <TabsTrigger key={line.id} value={line.id}>
            <span className="mr-2 h-2.5 w-2.5 rounded-full" style={{ background: line.colorHex }} />
            {line.code}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

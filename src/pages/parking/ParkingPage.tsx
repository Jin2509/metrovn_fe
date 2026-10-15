import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParkingCapacityTable } from "@/pages/parking/components/ParkingCapacityTable";
import { ParkingLotsTable } from "@/pages/parking/components/ParkingLotsTable";
import { ParkingPriceTable } from "@/pages/parking/components/ParkingPriceTable";
import { useParking } from "@/pages/parking/hooks/useParking";

export function ParkingPage() {
  const { lots, stations, prices, edits, setEdit, submit } = useParking();

  return (
    <AppShell title="Gửi xe" roles={["ADMIN"]}>
      <Tabs defaultValue="lots">
        <TabsList>
          <TabsTrigger value="lots">Bãi xe</TabsTrigger>
          <TabsTrigger value="cap">Sức chứa theo loại xe</TabsTrigger>
          <TabsTrigger value="price">Bảng giá</TabsTrigger>
        </TabsList>
        <TabsContent value="lots">
          <ParkingLotsTable lots={lots} stations={stations} />
        </TabsContent>
        <TabsContent value="cap">
          <ParkingCapacityTable lots={lots} />
        </TabsContent>
        <TabsContent value="price">
          <ParkingPriceTable prices={prices} edits={edits} onEdit={setEdit} onSubmit={submit} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

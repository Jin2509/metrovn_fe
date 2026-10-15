import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StationListRow } from "@/pages/stations/stations.types";

export function StationList({
  query,
  onQueryChange,
  rows,
  selectedStationId,
  onSelectStation,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  rows: StationListRow[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <Input
          placeholder="Tìm ga…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="mb-3 max-w-xs"
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ga</TableHead>
              <TableHead>Tuyến</TableHead>
              <TableHead>Tọa độ</TableHead>
              <TableHead>Buýt</TableHead>
              <TableHead>Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((station) => (
              <TableRow
                key={station.id}
                onClick={() => onSelectStation(station.id)}
                className={`cursor-pointer ${selectedStationId === station.id ? "bg-muted" : ""}`}
              >
                <TableCell className="font-medium">
                  {station.name}
                  {station.interchange && (
                    <Badge className="ml-2" variant="secondary">
                      Chuyển tuyến
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {station.lines.map((line) => (
                      <span
                        key={line.id}
                        className="h-3 w-3 rounded-full"
                        style={{ background: line.colorHex }}
                        title={line.code}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                </TableCell>
                <TableCell>{station.connectedBusStopCount}</TableCell>
                <TableCell>
                  <Badge variant={station.status === "ACTIVE" ? "default" : "outline"}>
                    {station.status === "ACTIVE" ? "Hoạt động" : "Quy hoạch"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

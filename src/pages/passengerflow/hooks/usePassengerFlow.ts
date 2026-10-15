import { useState } from "react";
import { getPassengerFlowView } from "@/pages/passengerflow/passengerflow.service";
import type { PassengerFlowTimeSlot } from "@/pages/passengerflow/passengerflow.types";

export function usePassengerFlow() {
  const [stationId, setStationId] = useState("ALL");
  const [timeSlot, setTimeSlot] = useState<PassengerFlowTimeSlot>("ALL");
  const view = getPassengerFlowView(stationId, timeSlot);

  return { stationId, setStationId, timeSlot, setTimeSlot, ...view };
}

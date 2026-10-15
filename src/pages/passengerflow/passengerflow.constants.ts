import type { PassengerFlowTimeSlot } from "@/pages/passengerflow/passengerflow.types";

export const PASSENGER_FLOW_TIME_SLOTS: {
  value: PassengerFlowTimeSlot;
  label: string;
}[] = [
  { value: "ALL", label: "Cả ngày" },
  { value: "AM", label: "Buổi sáng" },
  { value: "PM", label: "Chiều – tối" },
];

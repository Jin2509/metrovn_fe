export type MembershipTier = {
  id: string;
  name: string;
  threshold: number;
  multiplier: number;
  benefits: string;
};

export type MembershipTierChange =
  | { id: string; field: "threshold"; value: number }
  | { id: string; field: "multiplier"; value: number }
  | { id: string; field: "benefits"; value: string };

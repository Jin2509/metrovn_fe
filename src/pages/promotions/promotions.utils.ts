export function formatPromotionDate(value: string) {
  return value.split("-").reverse().join("/");
}

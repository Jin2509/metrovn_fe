/** Mã trên đường dẫn: luôn encode để id/mã lạ không phá URL. */
export const seg = (value: number | string) => encodeURIComponent(String(value));

export const V1 = "/api/v1";

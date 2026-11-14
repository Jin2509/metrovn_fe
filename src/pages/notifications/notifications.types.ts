import type { Announcement } from "@/stores/announcements";

export type AnnouncementDraft = Pick<
  Announcement,
  "title" | "content" | "severity" | "scope" | "lineId" | "stationId" | "targetRole"
> & {
  /** Dạng `YYYY-MM-DDTHH:mm` của ô datetime-local, theo giờ máy. */
  startsAt: string;
  endsAt: string;
};

export type DraftErrors = Partial<
  Record<"title" | "content" | "line" | "station" | "role" | "period", string>
>;

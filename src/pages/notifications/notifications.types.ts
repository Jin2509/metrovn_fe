import type { Announcement } from "@/mocks/announcements";

export type AnnouncementDraft = Pick<
  Announcement,
  "title" | "content" | "severity" | "audience" | "channels" | "lineId" | "stationId"
> & {
  /** Dạng `YYYY-MM-DDTHH:mm` của ô datetime-local. */
  startsAt: string;
  endsAt: string;
};

export type DraftErrors = Partial<
  Record<"title" | "content" | "channels" | "period" | "recipients", string>
>;

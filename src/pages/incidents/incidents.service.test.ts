import { afterEach, describe, expect, it } from "vitest";
import { announcementsStore } from "@/mocks/announcements";
import { incidentsStore, type StationIncident } from "@/mocks/incidents";
import {
  declinePublication,
  filterIncidents,
  incidentStats,
  isOpen,
  publicNotice,
  publishIncident,
  sortIncidents,
  updateIncidentStatus,
} from "@/pages/incidents/incidents.service";
import { activeForPassengers } from "@/pages/notifications/notifications.service";

const seedIncidents = [...incidentsStore.get()];
const seedAnnouncements = [...announcementsStore.get()];
afterEach(() => {
  incidentsStore.set(() => seedIncidents);
  announcementsStore.set(() => seedAnnouncements);
});

const get = (id: string) => incidentsStore.get().find((i) => i.id === id)!;
const emergency = "SC-1006"; // đang đề xuất báo hành khách
const minor = "SC-1003";

describe("danh sách", () => {
  it("nặng lên trước, cùng mức thì báo sớm lên trước", () => {
    const sorted = sortIncidents(incidentsStore.get().filter(isOpen));
    expect(sorted[0].severity).toBe("EMERGENCY");
    expect(sorted.at(-1)!.severity).toBe("MINOR");
    const minors = sorted.filter((i) => i.severity === "MINOR");
    expect(minors.map((i) => i.id)).toEqual(["SC-1002", "SC-1003"]);
  });

  it("lọc theo tab, mức độ, ga và từ khóa", () => {
    const all = incidentsStore.get();
    const base = { tab: "OPEN", severity: "ALL", stationId: "ALL", search: "" } as const;
    expect(filterIncidents(all, base)).toHaveLength(5);
    expect(filterIncidents(all, { ...base, tab: "RESOLVED" }).map((i) => i.id)).toEqual([
      "SC-1001",
    ]);
    expect(filterIncidents(all, { ...base, severity: "EMERGENCY" })).toHaveLength(1);
    expect(filterIncidents(all, { ...base, stationId: "S1-3" }).map((i) => i.id)).toEqual([
      "SC-1002",
    ]);
    expect(filterIncidents(all, { ...base, search: "barie" }).map((i) => i.id)).toEqual([
      "SC-1003",
    ]);
  });

  it("đếm các chỉ số đang mở", () => {
    expect(incidentStats(incidentsStore.get())).toEqual({
      open: 5,
      emergency: 1,
      pendingPublication: 2,
      published: 0,
    });
  });
});

describe("trạng thái", () => {
  it("đi tới, ghi lịch sử có người thực hiện", () => {
    expect(updateIncidentStatus(minor, "IN_PROGRESS")).toBeNull();
    expect(get(minor).status).toBe("IN_PROGRESS");
    expect(get(minor).history.at(-1)).toMatchObject({ kind: "STATUS", status: "IN_PROGRESS" });
  });

  it("được bỏ qua bước giữa như app, nhưng không đi lùi", () => {
    expect(updateIncidentStatus(minor, "RESOLVED")).toBeNull();
    expect(updateIncidentStatus(minor, "IN_PROGRESS")).toMatch(/đã qua bước/);
    expect(get(minor).status).toBe("RESOLVED");
  });
});

describe("báo cho hành khách", () => {
  const passengerSees = (incident: StationIncident) =>
    activeForPassengers(announcementsStore.get()).filter((a) => a.id === incident.announcementId);

  it("duyệt đề xuất thì hiện cho hành khách, chỉ có nội dung công khai", () => {
    expect(publishIncident(emergency)).toBeNull();
    const incident = get(emergency);
    expect(incident.publication).toBe("PUBLISHED");
    const [notice] = passengerSees(incident);
    expect(notice).toMatchObject({
      severity: "CRITICAL",
      stationId: "S1-1",
      audience: "PASSENGER",
    });
    expect(notice.title).toBe(publicNotice(incident).title);
    expect(notice.content).not.toContain(incident.description);
  });

  it("không đăng trùng", () => {
    publishIncident(emergency);
    expect(publishIncident(emergency)).toMatch(/đã được đăng/);
  });

  it("xử lý xong thì gỡ thông báo", () => {
    publishIncident(emergency);
    const announcementId = get(emergency).announcementId!;
    updateIncidentStatus(emergency, "RESOLVED");
    expect(get(emergency).announcementId).toBeUndefined();
    const ended = announcementsStore.get().find((a) => a.id === announcementId)!;
    expect(ended.endsAt).toBeTruthy();
  });

  it("từ chối đề xuất thì giữ lý do trong lịch sử và không đăng gì", () => {
    const before = announcementsStore.get().length;
    declinePublication(emergency, "Đã xử lý tại chỗ");
    expect(get(emergency).publication).toBe("NONE");
    expect(get(emergency).history.at(-1)).toMatchObject({
      kind: "PUBLISH_DECLINED",
      note: "Đã xử lý tại chỗ",
    });
    expect(announcementsStore.get()).toHaveLength(before);
  });

  it("đóng sự cố còn đề xuất treo thì đề xuất cũng đóng", () => {
    updateIncidentStatus(emergency, "RESOLVED");
    expect(get(emergency).publication).toBe("NONE");
  });
});

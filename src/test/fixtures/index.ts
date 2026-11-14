// Dữ liệu cố định CHỈ dùng cho test (không đóng gói vào app). Nạp vào các store thật trước mỗi
// file test (xem `src/test/setup.ts`). Chỉ còn các kho mà app vẫn tính toán ở client
// (mạng lưới, vận hành, yêu cầu công việc, chatbot); phần còn lại test qua API giả.
import * as chatbot from "@/stores/chatbot";
import * as lineStructure from "@/stores/line-structure";
import * as metro from "@/stores/metro";
import * as operations from "@/stores/operations";
import * as requests from "@/stores/requests";
import * as F_chatbot from "./chatbot";
import * as F_lineStructure from "./line-structure";
import * as F_metro from "./metro";
import * as F_operations from "./operations";
import * as F_requests from "./requests";

export { F_chatbot, F_lineStructure, F_metro, F_operations, F_requests };

const fill = <T>(target: T[], source: readonly T[]) => target.splice(0, target.length, ...source);

export function seedStores() {
  metro.replaceLines(F_metro.lines);
  metro.replaceStations(F_metro.stations);
  metro.lineStationsStore.set(() => F_metro.lineStationsStore.get());
  fill(
    metro.busRoutes,
    F_metro.busRoutes.map((r) => ({ code: r.code, name: r.name, description: r.operator })),
  );
  fill(metro.busStops, F_metro.busStops);

  for (const station of F_metro.stations)
    lineStructure.stationStructures[station.id] = F_lineStructure.stationStructure(station.id);
  Object.assign(lineStructure.lineDepots, F_lineStructure.lineDepots);

  operations.trainsStore.set(() => F_operations.trainsStore.get());
  operations.operationConfigsStore.set(() => F_operations.operationConfigsStore.get());

  requests.workRequestsStore.set(() => F_requests.workRequestsStore.get());
  requests.threadsStore.set(() => F_requests.threadsStore.get());

  chatbot.faqStore.set(() => F_chatbot.faqStore.get());
  chatbot.sessionsStore.set(() => F_chatbot.sessionsStore.get());
  chatbot.messagesStore.set(() => F_chatbot.messagesStore.get());
}

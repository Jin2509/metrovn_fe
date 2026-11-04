import { usersStore } from "./admin";

// Tài khoản tích điểm (GIẢ LẬP, bảng `loyalty_account`). CPoint là số đã cộng dồn từ các lần check-in,
// không tính lại khi đổi mức điểm: mức mới chỉ áp dụng cho các lần check-in sau.

export type LoyaltyMember = {
  id: string;
  name: string;
  email: string;
  cpoint: number;
  checkins: number;
};

export const loyaltyMembers: LoyaltyMember[] = usersStore
  .get()
  .filter((user) => user.role === "PASSENGER")
  .map((user, index) => {
    // Số tất định để dữ liệu ổn định giữa các lần tải.
    const [cpoint, checkins] = (
      [
        [2600, 26],
        [2100, 21],
        [1720, 40],
        [1300, 13],
        [960, 32],
        [880, 28],
        [640, 22],
        [540, 18],
        [410, 11],
        [270, 9],
        [130, 13],
        [40, 4],
      ] as const
    )[index % 12];
    return { id: user.id, name: user.name, email: user.email, cpoint, checkins };
  });

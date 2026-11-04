import { createStore } from "@/lib/store";

// Xác nhận sinh viên (GIẢ LẬP): backend chưa có API. Hợp đồng với app mobile là
// `/api/student-verifications`; việc gọi AI đọc thẻ nằm ở backend, ở đây dùng sẵn kết quả đọc mẫu.

/**
 * Trạng thái phía quản trị. NEEDS_REVIEW là nội bộ: app mobile chỉ biết PENDING
 * (xem `toPassengerStatus`), nên không cần đổi app để có luồng xem xét ngoại lệ.
 */
export type StudentStatus = "NEEDS_REVIEW" | "VERIFIED" | "REJECTED" | "EXPIRED";

export type StudentCardData = {
  fullName: string | null;
  school: string | null;
  studentCode: string | null;
  /** Hạn thẻ in trên thẻ, dạng YYYY-MM-DD. */
  cardExpiry: string | null;
};

/** Một lần hành khách gửi ảnh thẻ, kèm kết quả AI đọc. Ảnh thẻ xóa ngay khi có kết quả. */
export type StudentSubmission = {
  id: string;
  accountName: string;
  accountEmail: string;
  submittedAt: string;
  card: StudentCardData;
  /** Độ tin cậy AI đọc thẻ, 0..1. */
  confidence: number;
};

export type StudentVerification = StudentSubmission & {
  status: StudentStatus;
  /** Lý do được đưa ra cho người xem xét hoặc hành khách. */
  reasons: string[];
  /** `null` khi hệ thống tự quyết định. */
  decidedBy: string | null;
  decidedAt: string | null;
  /** Ưu đãi dùng được tới mốc này, dạng YYYY-MM-DD. */
  expiresAt: string | null;
};

export type StudentRules = {
  /** Độ tin cậy từ mức này trở lên và mọi điều kiện đạt thì tự duyệt. */
  autoApproveConfidence: number;
  /** Dưới mức này coi như không đọc được, tự từ chối để hành khách chụp lại. */
  minReadableConfidence: number;
  validityMonths: number;
  /** Báo trước khi hết hạn để hành khách kịp gửi lại. */
  renewWithinDays: number;
  schools: string[];
};

export const DEFAULT_STUDENT_RULES: StudentRules = {
  autoApproveConfidence: 0.9,
  minReadableConfidence: 0.5,
  validityMonths: 12,
  renewWithinDays: 30,
  schools: [
    "Đại học Quốc gia TP.HCM",
    "Trường ĐH Công nghệ Thông tin",
    "Trường ĐH Bách khoa TP.HCM",
    "Trường ĐH Khoa học Tự nhiên",
    "Trường ĐH Kinh tế TP.HCM",
    "Trường ĐH Sư phạm Kỹ thuật TP.HCM",
  ],
};

export type StudentSchool = { id: string; name: string };

export const studentSchoolsStore = createStore<StudentSchool[]>(
  DEFAULT_STUDENT_RULES.schools.map((name, index) => ({ id: `SCH${index + 1}`, name })),
);

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const yearFromNow = (years: number) =>
  new Date(Date.now() + years * 365 * 86_400_000).toISOString().slice(0, 10);

const school = DEFAULT_STUDENT_RULES.schools;

export const SEED_SUBMISSIONS: StudentSubmission[] = [
  {
    id: "SV-1008",
    accountName: "Nguyễn Minh Anh",
    accountEmail: "minhanh@gmail.com",
    submittedAt: hoursAgo(1),
    card: {
      fullName: "Nguyễn Minh Anh",
      school: school[0],
      studentCode: "22520001",
      cardExpiry: yearFromNow(2),
    },
    confidence: 0.97,
  },
  {
    id: "SV-1007",
    accountName: "Trần Quốc Bảo",
    accountEmail: "quocbao@gmail.com",
    submittedAt: hoursAgo(3),
    card: {
      fullName: "Trần Quốc Bảo",
      school: "Trường CĐ Kỹ thuật Cao Thắng",
      studentCode: "0306211",
      cardExpiry: yearFromNow(1),
    },
    confidence: 0.94,
  },
  {
    id: "SV-1006",
    accountName: "Lê Thu Hà",
    accountEmail: "thuha@gmail.com",
    submittedAt: hoursAgo(5),
    card: {
      fullName: "Lê Thu Hà",
      school: school[2],
      studentCode: "2110345",
      cardExpiry: yearFromNow(1),
    },
    confidence: 0.72,
  },
  {
    id: "SV-1005",
    accountName: "Phạm Gia Huy",
    accountEmail: "giahuy@gmail.com",
    submittedAt: hoursAgo(26),
    card: {
      fullName: "Phạm Văn Hùng",
      school: school[4],
      studentCode: "31211020",
      cardExpiry: yearFromNow(1),
    },
    confidence: 0.95,
  },
  {
    id: "SV-1004",
    accountName: "Võ Hoàng Nam",
    accountEmail: "hoangnam@gmail.com",
    submittedAt: hoursAgo(8),
    // Trùng mã với SV-1008: một thẻ dùng cho hai tài khoản.
    card: {
      fullName: "Võ Hoàng Nam",
      school: school[0],
      studentCode: "22520001",
      cardExpiry: yearFromNow(2),
    },
    confidence: 0.96,
  },
  {
    id: "SV-1003",
    accountName: "Đỗ Khánh Linh",
    accountEmail: "khanhlinh@gmail.com",
    submittedAt: hoursAgo(12),
    card: { fullName: null, school: null, studentCode: null, cardExpiry: null },
    confidence: 0.31,
  },
  {
    id: "SV-1002",
    accountName: "Bùi Thanh Tâm",
    accountEmail: "thanhtam@gmail.com",
    submittedAt: hoursAgo(30),
    card: {
      fullName: "Bùi Thanh Tâm",
      school: school[1],
      studentCode: "20520777",
      cardExpiry: "2025-06-30",
    },
    confidence: 0.93,
  },
  {
    id: "SV-1001",
    accountName: "Hoàng Mỹ Duyên",
    accountEmail: "myduyen@gmail.com",
    submittedAt: hoursAgo(48),
    // Hạn thẻ gần hơn 1 năm: ưu đãi chỉ tới hạn thẻ.
    card: {
      fullName: "Hoàng Mỹ Duyên",
      school: school[5],
      studentCode: "21110123",
      cardExpiry: yearFromNow(0.3),
    },
    confidence: 0.98,
  },
];

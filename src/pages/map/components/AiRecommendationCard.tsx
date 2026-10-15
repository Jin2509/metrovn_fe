import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AiRecommendationCard() {
  return (
    <Card className="border-accent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-accent" />
          Gợi ý AI
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Ga Thủ Đức và Đại học Quốc gia đạt ngưỡng cao điểm 7–9h. Đề xuất tăng tần suất buýt 19 và 50
        lên 6 phút/chuyến trong khung giờ này.
      </CardContent>
    </Card>
  );
}

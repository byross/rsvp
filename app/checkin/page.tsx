import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckinPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center">簽到系統</CardTitle>
          <CardDescription className="text-center">
            掃描嘉賓的 QR Code 進行簽到
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-square w-full max-w-md mx-auto bg-muted rounded-lg flex items-center justify-center mb-6">
            <p className="text-muted-foreground">QR Code 掃描器</p>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">嘉賓資訊</h3>
              <p className="text-sm text-muted-foreground">掃描後將顯示嘉賓資料</p>
            </div>
            <Button className="w-full" disabled>確認簽到</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}



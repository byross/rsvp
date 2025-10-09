import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ConfirmedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center">感謝您的確認！</CardTitle>
          <CardDescription className="text-center">
            確認郵件已發送至您的電子郵箱
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="w-full p-8 bg-muted rounded-lg text-center">
            <p className="text-muted-foreground">您的 QR Code 將顯示在此</p>
          </div>
          <Button>返回首頁</Button>
        </CardContent>
      </Card>
    </main>
  );
}



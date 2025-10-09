import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RSVPPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">活動邀請</CardTitle>
          <CardDescription>
            請填寫以下資料確認您的出席
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">RSVP 表單將在此顯示</p>
          {/* RSVP Form will be implemented here */}
        </CardContent>
      </Card>
    </main>
  );
}



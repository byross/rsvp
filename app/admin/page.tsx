import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">管理面板</h1>
          <p className="text-muted-foreground">RSVP 系統管理</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>嘉賓管理</CardTitle>
              <CardDescription>查看和管理嘉賓名單</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">查看嘉賓</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>導入名單</CardTitle>
              <CardDescription>上傳 CSV 文件批量導入</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">導入 CSV</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>統計數據</CardTitle>
              <CardDescription>查看 RSVP 統計資訊</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">總邀請數：</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">已確認：</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">待回覆：</span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}



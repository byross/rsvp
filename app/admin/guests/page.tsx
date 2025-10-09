import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GuestsPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">嘉賓名單</h1>
            <p className="text-muted-foreground">查看和管理所有嘉賓</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">導出 CSV</Button>
            <Button>發送邀請</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>嘉賓列表</CardTitle>
            <CardDescription>
              共 0 位嘉賓
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              尚未導入嘉賓資料
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}



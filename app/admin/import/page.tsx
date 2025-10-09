import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImportPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">導入嘉賓名單</h1>
          <p className="text-muted-foreground">上傳 CSV 文件批量導入嘉賓資料</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>上傳 CSV 檔案</CardTitle>
            <CardDescription>
              請確保 CSV 包含以下欄位：name, company, email, invite_type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <p className="text-muted-foreground mb-4">
                拖放 CSV 文件至此，或點擊上傳
              </p>
              <Button>選擇文件</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}



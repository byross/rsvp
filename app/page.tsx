import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Mail, QrCode, UserCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="z-10 w-full max-w-6xl space-y-8">
        {/* Hero Section */}
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              RSVP 電子邀請系統
            </CardTitle>
            <CardDescription className="text-lg text-slate-600">
              byRoss Design & Tech
            </CardDescription>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              專業的活動邀請與簽到管理系統，支援電子邀請、QR Code 簽到、工作坊預約等功能
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 pb-8">
            <div className="flex gap-4">
              <Link href="/admin">
                <Button variant="outline" size="lg" className="gap-2">
                  <UserCheck className="w-4 h-4" />
                  管理面板
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Mail className="w-10 h-10 text-blue-600 mb-2" />
              <CardTitle className="text-lg">電子邀請</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                支援具名邀請與公司邀請兩種模式
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Calendar className="w-10 h-10 text-green-600 mb-2" />
              <CardTitle className="text-lg">活動預約</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                晚宴、雞尾酒會及工作坊時段選擇
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <QrCode className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle className="text-lg">QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                自動生成個人專屬 QR Code 簽到碼
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <UserCheck className="w-10 h-10 text-orange-600 mb-2" />
              <CardTitle className="text-lg">簽到管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                現場掃描簽到，即時顯示嘉賓資訊
              </p>
            </CardContent>
          </Card>
        </div>

      </div>
    </main>
  );
}

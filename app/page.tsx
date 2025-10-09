import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-4xl text-center">
              RSVP 電子邀請系統
            </CardTitle>
            <CardDescription className="text-center text-lg">
              byRoss Design & Tech
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-center text-muted-foreground mb-4">
              Next.js 15 + Tailwind CSS + shadcn UI 已準備就緒
            </p>
            <div className="flex gap-4">
              <Button variant="default">開始使用</Button>
              <Button variant="outline">了解更多</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


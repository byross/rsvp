'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface ConfirmationData {
  name: string;
  dinner: boolean;
  cocktail: boolean;
  workshop_type: string | null;
  workshop_time: string | null;
}

export default function ConfirmedPage() {
  const router = useRouter();
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);

  useEffect(() => {
    // In a real implementation, this would come from the URL params or session
    // For now, we'll show a generic confirmation
    const data = sessionStorage.getItem('rsvp_confirmation');
    if (data) {
      setConfirmationData(JSON.parse(data));
    }
  }, []);

  const formatWorkshopType = (type: string | null) => {
    if (!type) return null;
    return type === 'leather' ? '皮革工作坊' : '香水工作坊';
  };

  const formatWorkshopTime = (time: string | null) => {
    if (!time) return null;
    const hour = time.slice(0, 2);
    const minute = time.slice(2);
    return `${hour}:${minute}`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 to-emerald-50">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-green-900">
            感謝您的確認！
          </CardTitle>
          <CardDescription className="text-base text-green-800">
            您的 RSVP 已成功提交
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confirmation Summary */}
          {confirmationData && (
            <div className="p-6 bg-white border border-green-200 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg text-green-900">您的確認資料：</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">姓名：</span>
                  <span className="font-medium">{confirmationData.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">晚宴：</span>
                  <span className="font-medium">
                    {confirmationData.dinner ? '✓ 出席' : '✗ 不出席'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">雞尾酒會：</span>
                  <span className="font-medium">
                    {confirmationData.cocktail ? '✓ 出席' : '✗ 不出席'}
                  </span>
                </div>
                {confirmationData.workshop_type && (
                  <>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">工作坊：</span>
                      <span className="font-medium">
                        {formatWorkshopType(confirmationData.workshop_type)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">時段：</span>
                      <span className="font-medium">
                        {formatWorkshopTime(confirmationData.workshop_time)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* QR Code Section */}
          <div className="p-8 bg-white border-2 border-dashed border-green-300 rounded-lg">
            <div className="space-y-4 text-center">
              <div className="w-48 h-48 mx-auto bg-slate-100 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground text-sm">QR Code 將透過郵件發送</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-green-900">
                  確認郵件已發送
                </p>
                <p className="text-sm text-muted-foreground">
                  請查看您的郵箱，我們已發送確認郵件及活動 QR Code
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2">重要提示：</h4>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>請保存確認郵件中的 QR Code</li>
              <li>活動當日請出示 QR Code 以便簽到</li>
              <li>如需修改資料，請聯絡活動負責人</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/')}
            >
              返回首頁
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => window.print()}
            >
              列印確認頁
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface ConfirmationData {
  name: string;
  dinner: boolean;
  cocktail: boolean;
  vegetarian?: boolean;
  workshop_type: string | null;
  workshop_time: string | null;
}

export default function ConfirmedPage() {
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
    return type === 'leather' ? '皮革工作坊' : '調香工作坊';
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
          {/* Logo */}
          <div className="w-full mb-4">
            <img 
              src="/images/logo.jpeg" 
              alt="活動 Logo" 
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
          
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

          {/* Parking Information */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-slate-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <div>
                <h4 className="font-semibold text-slate-700 mb-1">停車資訊</h4>
                <p className="text-sm text-slate-600">
                澳門銀河安達仕酒店設有自助地下停車場(P4)，賓客可向在場職員查詢延長免費泊車時間。
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
              <li>如需修改資料或查詢，可致電+853 6309 0853 , +853 6290 8186或電郵至 celebrate30@netcraft.com.mo</li>
            </ul>
          </div>

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
                {confirmationData.dinner && confirmationData.vegetarian && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">飲食需求：</span>
                    <span className="font-medium">素食</span>
                  </div>
                )}
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

          {/* Event Details */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-lg text-slate-700 mb-4">活動詳情</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <span className="font-semibold text-slate-700 min-w-[60px]">日期：</span>
                <span className="text-slate-600">2025年12月17日（星期三）</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold text-slate-700 min-w-[60px]">地點：</span>
                <span className="text-slate-600">澳門銀河國際會議中心地下宴會廳</span>
              </div>
              <div className="flex items-start">
                <span className="font-semibold text-slate-700 min-w-[60px]">時間：</span>
                <div className="text-slate-600">
                <div>16:15 接待處開放</div>
                  <div>16:30 歡迎酒會及工作坊</div>
                  <div>18:30 晚宴正式開始</div>
                  <div>21:00 晚宴結束</div>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </main>
  );
}


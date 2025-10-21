'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import QRScanner from "@/components/QRScanner";

interface Guest {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  invite_type: 'named' | 'company';
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  dinner: boolean;
  cocktail: boolean;
  workshop_type?: string;
  workshop_time?: string;
  checked_in: boolean;
}

export default function CheckinPage() {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleScanSuccess = async (qrData: string) => {
    setError(null);
    setSuccess(null);
    
    try {
      // 解析 QR Code 數據
      const qrPayload = JSON.parse(qrData);
      const token = qrPayload.token;
      
      if (!token) {
        throw new Error('無效的 QR Code');
      }

      // 調用簽到 API
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (response.ok) {
        setGuest(result.guest);
        setSuccess('簽到成功！');
        
        // 顯示工作坊券提示
        if (result.guest.workshop_type && result.guest.workshop_time) {
          setTimeout(() => {
            setSuccess(`簽到成功！請發放：${getWorkshopName(result.guest.workshop_type)} 工作坊券 - ${result.guest.workshop_time}`);
          }, 1000);
        }
      } else {
        if (result.status === 'duplicate') {
          setGuest(result.guest);
          setError('該嘉賓已經簽到過了');
        } else {
          setError(result.error || '簽到失敗');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '掃描失敗');
    }
  };

  const handleScanError = (error: string) => {
    setError(error);
  };

  const getWorkshopName = (type: string) => {
    switch (type) {
      case 'leather': return '皮革';
      case 'perfume': return '香水';
      default: return type;
    }
  };

  const getWorkshopTime = (time: string) => {
    return time ? `${time.slice(0, 2)}:${time.slice(2)}` : '';
  };

  const resetForm = () => {
    setGuest(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center">簽到系統</CardTitle>
          <CardDescription className="text-center">
            掃描嘉賓的 QR Code 進行簽到
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code 掃描器 */}
          <QRScanner 
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
            className="mb-6"
          />

          {/* 嘉賓資訊顯示 */}
          {guest && (
            <div className="p-6 bg-gray-50 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-center">嘉賓資訊</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">姓名</p>
                  <p className="font-medium">{guest.name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">公司</p>
                  <p className="font-medium">{guest.company || '未填寫'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">邀請類型</p>
                  <Badge variant={guest.invite_type === 'named' ? 'default' : 'secondary'}>
                    {guest.invite_type === 'named' ? '個人邀請' : '公司邀請'}
                  </Badge>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">RSVP 狀態</p>
                  <Badge 
                    variant={
                      guest.rsvp_status === 'confirmed' ? 'default' : 
                      guest.rsvp_status === 'declined' ? 'destructive' : 'secondary'
                    }
                  >
                    {guest.rsvp_status === 'confirmed' ? '已確認' : 
                     guest.rsvp_status === 'declined' ? '已拒絕' : '待回覆'}
                  </Badge>
                </div>
                
                {guest.rsvp_status === 'confirmed' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">晚宴</p>
                      <Badge variant={guest.dinner ? 'default' : 'outline'}>
                        {guest.dinner ? '參加' : '不參加'}
                      </Badge>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">雞尾酒會</p>
                      <Badge variant={guest.cocktail ? 'default' : 'outline'}>
                        {guest.cocktail ? '參加' : '不參加'}
                      </Badge>
                    </div>
                    
                    {guest.workshop_type && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">工作坊</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default">
                            {getWorkshopName(guest.workshop_type)} 工作坊
                          </Badge>
                          <Badge variant="outline">
                            {getWorkshopTime(guest.workshop_time || '')}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 工作坊券提示 */}
              {guest.rsvp_status === 'confirmed' && guest.workshop_type && guest.workshop_time && (
                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-yellow-800 font-medium">
                      請發放：{getWorkshopName(guest.workshop_type)} 工作坊券 - {getWorkshopTime(guest.workshop_time)}
                    </p>
                  </div>
                </div>
              )}

              {guest.rsvp_status === 'confirmed' && !guest.workshop_type && (
                <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-gray-700">無需發放工作坊券</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 狀態訊息 */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex justify-center space-x-4">
            {guest && (
              <Button 
                onClick={resetForm}
                variant="outline"
                className="px-6"
              >
                掃描下一位
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}



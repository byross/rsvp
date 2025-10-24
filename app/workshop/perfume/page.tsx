'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest, API_ENDPOINTS } from "@/lib/config";

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
  vegetarian?: boolean;
  workshop_type?: string;
  workshop_time?: string;
  checked_in: boolean;
}

export default function PerfumeWorkshopCheckinPage() {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自動聚焦到輸入框
  useEffect(() => {
    inputRef.current?.focus();
  }, [guest]);

  const handleCheckIn = async (tokenValue: string) => {
    if (!tokenValue.trim() || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 調用調香工作坊簽到 API
      const response = await apiRequest(API_ENDPOINTS.WORKSHOP_PERFUME_CHECKIN, {
        method: 'POST',
        body: JSON.stringify({ token: tokenValue.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.status === 'success') {
          setGuest(result.guest);
          setSuccess('調香工作坊簽到成功！');
          
          // 顯示工作坊券提示
          setTimeout(() => {
            setSuccess(`調香工作坊簽到成功！請發放：調香工作坊券 - ${getWorkshopTime(result.guest.workshop_time)}`);
          }, 1000);
        } else if (result.status === 'duplicate') {
          setGuest(result.guest);
          setError('該嘉賓已經簽到調香工作坊了');
        }
      } else {
        if (result.error === '該嘉賓未選擇調香工作坊') {
          setGuest(result.guest);
          setError('該嘉賓未選擇調香工作坊');
        } else {
          setError(result.error || '簽到失敗');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '簽到失敗');
    } finally {
      setIsProcessing(false);
    }
  };

  // 監聽輸入變化，當輸入完成時自動簽到
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToken(value);
  };

  // 監聽 Enter 鍵自動簽到
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && token.trim() && !isProcessing) {
      handleCheckIn(token);
    }
  };

  const getWorkshopTime = (time: string) => {
    return time ? `${time.slice(0, 2)}:${time.slice(2)}` : '';
  };

  const resetForm = () => {
    setGuest(null);
    setError(null);
    setSuccess(null);
    setToken('');
    // 重新聚焦到輸入框
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-4xl">
        <CardHeader className="space-y-4">
          {/* Logo */}
          <div className="w-full mb-4">
            <img 
              src="/images/logo.jpeg" 
              alt="活動 Logo" 
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
          
          <CardTitle className="text-3xl text-center">調香工作坊簽到</CardTitle>
          <CardDescription className="text-center">
            掃描嘉賓的 QR Code 完成調香工作坊簽到
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token 輸入 */}
          <div className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Token（掃描後自動簽到）
              </label>
              <Input
                ref={inputRef}
                id="token"
                type="text"
                value={token}
                onChange={handleTokenChange}
                onKeyPress={handleKeyPress}
                placeholder="請掃描 QR Code 或輸入 token 後按 Enter"
                className="w-full text-lg"
                disabled={isProcessing}
                autoFocus
              />
            </div>
            {isProcessing && (
              <div className="flex justify-center items-center space-x-2 text-blue-600">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>處理中...</span>
              </div>
            )}
          </div>

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
                
                {guest.workshop_type && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">工作坊</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">
                        調香工作坊
                      </Badge>
                      <Badge variant="outline">
                        {getWorkshopTime(guest.workshop_time || '')}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* 工作坊券提示 */}
              {guest.rsvp_status === 'confirmed' && guest.workshop_type === 'perfume' && guest.workshop_time && (
                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-yellow-800 font-medium">
                      請發放：調香工作坊券 - {getWorkshopTime(guest.workshop_time)}
                    </p>
                  </div>
                </div>
              )}

              {guest.rsvp_status === 'confirmed' && guest.workshop_type !== 'perfume' && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-800 font-medium">
                      該嘉賓未選擇調香工作坊
                    </p>
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

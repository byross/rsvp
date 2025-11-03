'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, API_ENDPOINTS } from "@/lib/config";

interface Guest {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  invite_type: 'named' | 'company';
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  workshop_type?: 'leather' | 'perfume';
  workshop_time?: string;
}

interface WorkshopGuest {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  invite_type: 'named' | 'company';
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  checked_in: number; // 0 or 1
  checked_in_at?: string;
}

interface WorkshopGuestsResponse {
  workshop_type: string;
  workshop_time: string;
  guests: WorkshopGuest[];
}

function PerfumeWorkshopCheckinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [guests, setGuests] = useState<{[key: string]: WorkshopGuest[]}>({});
  const [loadingCheckins, setLoadingCheckins] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const times = ['1630', '1700', '1730', '1800'];
  
  // 從 URL 參數獲取默認時段，如果沒有則使用第一個時段
  const getDefaultTime = () => {
    const p = searchParams.get('p');
    if (p) {
      const index = parseInt(p) - 1;
      if (index >= 0 && index < times.length) {
        return times[index];
      }
    }
    return times[0];
  };
  
  const [activeTime, setActiveTime] = useState(getDefaultTime());

  // 處理 Tab 切換，同時更新 URL
  const handleTabChange = (value: string) => {
    setActiveTime(value);
    const index = times.indexOf(value) + 1;
    router.push(`/workshop/perfume?p=${index}`);
  };

  // 自動聚焦到輸入框
  useEffect(() => {
    inputRef.current?.focus();
  }, [guest]);

  // 卸載時清理計時器
  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
        blurTimerRef.current = null;
      }
    };
  }, []);

  // 載入所有時段的嘉賓列表（只在需要時調用）
  const loadCheckins = useCallback(async () => {
    setLoadingCheckins(true);
    const newGuests: {[key: string]: WorkshopGuest[]} = {};
    
    try {
      for (const time of times) {
        // 載入嘉賓列表（選擇了該時段的所有嘉賓，包含簽到狀態）
        const guestsResponse = await apiRequest(API_ENDPOINTS.WORKSHOP_GUESTS('perfume', time), {
          method: 'GET',
        });
        
        if (guestsResponse.ok) {
          const guestsData: WorkshopGuestsResponse = await guestsResponse.json();
          newGuests[time] = guestsData.guests;
        } else {
          newGuests[time] = [];
        }
      }
      setGuests(newGuests);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoadingCheckins(false);
    }
  }, []);

  // 頁面載入時獲取簽到列表（只執行一次）
  useEffect(() => {
    loadCheckins();
  }, []);

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
          
          // 重新載入簽到列表
          loadCheckins();
          
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
          const guestWorkshop = result.guest?.workshop_type;
          if (guestWorkshop === 'leather') {
            setError('❌ 該嘉賓選擇了皮革工作坊，請前往皮革工作坊簽到');
          } else if (!guestWorkshop) {
            setError('❌ 該嘉賓未選擇任何工作坊');
          } else {
            setError('❌ 該嘉賓未選擇調香工作坊');
          }
        } else {
          setError(result.error || '簽到失敗');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '簽到失敗');
    } finally {
      setIsProcessing(false);
      // 連續簽到：清空並回焦
      setToken('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setToken(raw);

    if (isProcessing) return;

    const extracted = (() => {
      if (!raw) return null;
      const s = raw.trim();
      // 優先嘗試 JSON 解析
      if (s.startsWith('{') && s.includes('"token"')) {
        try {
          const obj = JSON.parse(s);
          if (obj && typeof obj.token === 'string' && obj.token.trim()) {
            return obj.token.trim();
          }
        } catch {
          // ignore
        }
      }
      // 從任意字串中用正則抽取 token
      const m = s.match(/"token"\s*:\s*"?([A-Za-z0-9_\-]+)"?/);
      if (m && m[1]) return m[1];
      // 純 token 字串（同時支援下劃線與連字號兩種格式）
      if (s.startsWith('token_') || s.startsWith('token-')) return s;
      return null;
    })();

    if (extracted) {
      handleCheckIn(extracted);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
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
    <main className="flex min-h-screen flex-col items-center justify-start p-8 pt-16">
      <Card className="w-full max-w-6xl">
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
                onBlur={() => {
                  if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                  blurTimerRef.current = setTimeout(() => {
                    inputRef.current?.focus();
                  }, 2000);
                }}
                onFocus={() => {
                  if (blurTimerRef.current) {
                    clearTimeout(blurTimerRef.current);
                    blurTimerRef.current = null;
                  }
                }}
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
                <div className="mt-4 p-4 bg-purple-100 border border-purple-400 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-purple-800 font-medium">
                      請發放：調香工作坊券 - {getWorkshopTime(guest.workshop_time)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 錯誤和成功訊息 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-center font-medium">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-center font-medium">{success}</p>
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
                繼續簽到
              </Button>
            )}
          </div>

          {/* 簽到列表 */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">簽到列表</h3>
              <Button 
                onClick={loadCheckins}
                disabled={loadingCheckins}
                variant="outline"
                size="sm"
              >
                {loadingCheckins ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    載入中...
                  </>
                ) : (
                  '刷新'
                )}
              </Button>
            </div>

            <Tabs value={activeTime} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {times.map((time) => (
                  <TabsTrigger key={time} value={time}>
                    {time.slice(0, 2)}:{time.slice(2)}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {times.map((time) => (
                <TabsContent key={time} value={time} className="space-y-4">
                  <div className="flex items-center justify-end space-x-2">
                    <Badge variant="outline">
                      總人數: {guests[time]?.length || 0} 人
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      已簽到: {guests[time]?.filter(g => g.checked_in).length || 0} 人
                    </Badge>
                  </div>
                  
                  {guests[time] && guests[time].length > 0 ? (
                    <div className="space-y-2">
                      {guests[time].map((guest, index) => (
                        <div key={guest.id} className={`flex items-center justify-between p-3 rounded-lg ${
                          guest.checked_in ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              guest.checked_in 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-purple-100 text-purple-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className={`font-medium ${guest.checked_in ? 'text-green-800' : 'text-gray-800'}`}>
                                {guest.name}
                              </p>
                              {guest.company && (
                                <p className="text-sm text-gray-600">{guest.company}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {guest.checked_in ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                已簽到
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                未簽到
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      該時段暫無嘉賓報名
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function PerfumeWorkshopCheckinPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-start p-8 pt-16">
        <Card className="w-full max-w-6xl">
          <CardHeader>
            <CardTitle>調香工作坊簽到</CardTitle>
            <CardDescription>載入中...</CardDescription>
          </CardHeader>
        </Card>
      </main>
    }>
      <PerfumeWorkshopCheckinContent />
    </Suspense>
  );
}
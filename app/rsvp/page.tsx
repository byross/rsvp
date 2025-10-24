'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest, API_ENDPOINTS } from '@/lib/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type InviteType = 'named' | 'company';

interface Guest {
  id: string;
  name: string;
  company: string | null;
  email: string;
  invite_type: InviteType;
}

interface FormData {
  name: string;
  company: string;
  dinner: boolean | null;
  cocktail: boolean | null;
  vegetarian: boolean;
  workshop: boolean;
  workshop_type: string;
  workshop_time: string;
}

interface WorkshopAvailability {
  total: number;
  booked: number;
  available: number;
}

interface WorkshopAvailabilityResponse {
  leather: {
    [time: string]: WorkshopAvailability;
  };
  perfume: {
    [time: string]: WorkshopAvailability;
  };
}

function RSVPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [workshopAvailability, setWorkshopAvailability] = useState<WorkshopAvailabilityResponse | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    dinner: null,
    cocktail: null,
    vegetarian: false,
    workshop: false,
    workshop_type: '',
    workshop_time: '',
  });

  // Fetch guest data and workshop availability by token
  useEffect(() => {
    if (!token) {
      setError('無效的邀請連結');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!token) {
        setError('無效的邀請連結');
        return;
      }

      try {
        // Fetch guest data
        const guestResponse = await apiRequest(API_ENDPOINTS.RSVP_GET(token));
        
        if (!guestResponse.ok) {
          throw new Error('無法獲取邀請資料');
        }

        const guestData = await guestResponse.json();
        setGuest(guestData.guest);
        
        // Pre-fill name for named guests (情況一)
        if (guestData.guest.invite_type === 'named') {
          setFormData(prev => ({
            ...prev,
            name: guestData.guest.name,
            company: guestData.guest.company || '',
          }));
        }

        // Fetch workshop availability
        const availabilityResponse = await apiRequest(API_ENDPOINTS.WORKSHOP_AVAILABILITY);
        
        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json();
          setWorkshopAvailability(availabilityData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Token validation
    if (!token) {
      setError('無效的邀請連結');
      return;
    }
    
    // Form validation
    if (!formData.name.trim()) {
      setError('請輸入姓名');
      return;
    }

    if (formData.dinner === null) {
      setError('請選擇是否出席晚宴');
      return;
    }

    if (formData.cocktail === null) {
      setError('請選擇是否出席雞尾酒會');
      return;
    }

    if (formData.workshop && (!formData.workshop_type || !formData.workshop_time)) {
      setError('請選擇工作坊類型和時段');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await apiRequest(API_ENDPOINTS.RSVP_SUBMIT(token), {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          company: formData.company,
          dinner: formData.dinner,
          cocktail: formData.cocktail,
          vegetarian: formData.vegetarian,
          workshop_type: formData.workshop ? formData.workshop_type : null,
          workshop_time: formData.workshop ? formData.workshop_time : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'WORKSHOP_FULL') {
          setError(errorData.error);
          return;
        }
        throw new Error(errorData.error || '提交失敗');
      }

      // Store confirmation data for display
      sessionStorage.setItem('rsvp_confirmation', JSON.stringify({
        name: formData.name,
        dinner: formData.dinner,
        cocktail: formData.cocktail,
        vegetarian: formData.vegetarian,
        workshop_type: formData.workshop ? formData.workshop_type : null,
        workshop_time: formData.workshop ? formData.workshop_time : null,
      }));

      // Redirect to confirmation page
      router.push('/rsvp/confirmed');
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失敗，請重試');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">載入中...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error && !guest) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-4">
          {/* Logo */}
          <div className="w-full mb-4">
            <img 
              src="/images/logo.jpeg" 
              alt="活動 Logo" 
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
          
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            活動邀請
          </CardTitle>
          <CardDescription className="text-center text-base">
            {guest?.invite_type === 'named' 
              ? `親愛的 ${guest.name}，誠摯邀請您出席` 
              : '請填寫實際出席者資料'}
          </CardDescription>
          
          {/* Event Details */}
          <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
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
                  <div>16:30 歡迎酒會及工作坊</div>
                  <div>18:30 晚宴正式開始</div>
                  <div>21:00 晚宴結束</div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input - Editable only for company invitations */}
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={guest?.invite_type === 'named'}
                placeholder="請輸入姓名"
                required
              />
            </div>

            {/* Company Input - Optional */}
            {guest?.invite_type === 'company' && (
              <div className="space-y-2">
                <Label htmlFor="company">公司名稱</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="請輸入公司名稱（選填）"
                />
              </div>
            )}

            {/* Dinner Attendance */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
              <Label className="text-base font-semibold">出席晚宴 *</Label>
              <RadioGroup
                value={formData.dinner === null ? '' : formData.dinner.toString()}
                onValueChange={(value) => {
                  const willAttend = value === 'true';
                  setFormData({ 
                    ...formData, 
                    dinner: willAttend,
                    // 如果選擇不出席，重置其他選項
                    cocktail: willAttend ? formData.cocktail : false,
                    vegetarian: willAttend ? formData.vegetarian : false,
                    workshop: willAttend ? formData.workshop : false,
                    workshop_type: willAttend ? formData.workshop_type : '',
                    workshop_time: willAttend ? formData.workshop_time : '',
                  });
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="dinner-yes" />
                  <Label htmlFor="dinner-yes" className="font-normal cursor-pointer">是，我會出席</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="dinner-no" />
                  <Label htmlFor="dinner-no" className="font-normal cursor-pointer">否，我無法出席</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 只有選擇出席晚宴時才顯示以下選項 */}
            {formData.dinner === true && (
              <>
                {/* Cocktail Party Attendance */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                  <Label className="text-base font-semibold">出席雞尾酒會 *</Label>
                  <RadioGroup
                    value={formData.cocktail === null ? '' : formData.cocktail.toString()}
                    onValueChange={(value) => setFormData({ ...formData, cocktail: value === 'true' })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="cocktail-yes" />
                      <Label htmlFor="cocktail-yes" className="font-normal cursor-pointer">是，我會出席</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="cocktail-no" />
                      <Label htmlFor="cocktail-no" className="font-normal cursor-pointer">否，我無法出席</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Vegetarian Option */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vegetarian"
                      checked={formData.vegetarian}
                      onCheckedChange={(checked) => setFormData({ ...formData, vegetarian: checked as boolean })}
                    />
                    <Label htmlFor="vegetarian" className="text-base font-semibold cursor-pointer">
                      素食餐點
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    請勾選此選項，我們將為您準備素食餐點
                  </p>
                </div>

                {/* Workshop Selection */}
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="workshop"
                  checked={formData.workshop}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      workshop: checked as boolean,
                      workshop_type: checked ? formData.workshop_type : '',
                      workshop_time: checked ? formData.workshop_time : '',
                    });
                  }}
                />
                <Label htmlFor="workshop" className="text-base font-semibold cursor-pointer">
                  參加工作坊
                </Label>
              </div>

              {formData.workshop && (
                <div className="space-y-4 ml-6">
                  {/* Workshop Type */}
                  <div className="space-y-2">
                    <Label htmlFor="workshop-type">工作坊類型 *</Label>
                    <Select
                      value={formData.workshop_type}
                      onValueChange={(value) => setFormData({ ...formData, workshop_type: value })}
                    >
                      <SelectTrigger id="workshop-type">
                        <SelectValue placeholder="請選擇工作坊類型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leather">皮革工作坊</SelectItem>
                        <SelectItem value="perfume">香水工作坊</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Workshop Time */}
                  <div className="space-y-2">
                    <Label htmlFor="workshop-time">時段 *</Label>
                    <Select
                      value={formData.workshop_time}
                      onValueChange={(value) => setFormData({ ...formData, workshop_time: value })}
                    >
                      <SelectTrigger id="workshop-time">
                        <SelectValue placeholder="請選擇時段" />
                      </SelectTrigger>
                      <SelectContent>
                        {['1630', '1700', '1730', '1800'].map((time) => {
                          const timeDisplay = `${time.slice(0, 2)}:${time.slice(2)}`;
                          const availability = workshopAvailability?.[formData.workshop_type as keyof WorkshopAvailabilityResponse]?.[time];
                          const isFull = availability?.available === 0;
                          const displayText = availability 
                            ? `${timeDisplay} (剩餘 ${availability.available} 位)`
                            : timeDisplay;
                          
                          return (
                            <SelectItem 
                              key={time} 
                              value={time}
                              disabled={isFull}
                            >
                              {isFull ? `${timeDisplay} (已滿)` : displayText}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
              size="lg"
              disabled={submitting}
            >
              {submitting ? '提交中...' : '確認提交'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function RSVPPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">載入中...</p>
          </CardContent>
        </Card>
      </main>
    }>
      <RSVPContent />
    </Suspense>
  );
}

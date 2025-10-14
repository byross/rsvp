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
  workshop: boolean;
  workshop_type: string;
  workshop_time: string;
}

function RSVPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [guest, setGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    dinner: null,
    cocktail: null,
    workshop: false,
    workshop_type: '',
    workshop_time: '',
  });

  // Fetch guest data by token
  useEffect(() => {
    if (!token) {
      setError('無效的邀請連結');
      setLoading(false);
      return;
    }

    const fetchGuest = async () => {
      if (!token) {
        setError('無效的邀請連結');
        return;
      }

      try {
        const response = await apiRequest(API_ENDPOINTS.RSVP_GET(token));
        
        if (!response.ok) {
          throw new Error('無法獲取邀請資料');
        }

        const data = await response.json();
        setGuest(data.guest);
        
        // Pre-fill name for named guests (情況一)
        if (data.guest.invite_type === 'named') {
          setFormData(prev => ({
            ...prev,
            name: data.guest.name,
            company: data.guest.company || '',
          }));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchGuest();
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
          workshop_type: formData.workshop ? formData.workshop_type : null,
          workshop_time: formData.workshop ? formData.workshop_time : null,
        }),
      });

      if (!response.ok) {
        throw new Error('提交失敗');
      }

      // Store confirmation data for display
      sessionStorage.setItem('rsvp_confirmation', JSON.stringify({
        name: formData.name,
        dinner: formData.dinner,
        cocktail: formData.cocktail,
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
        <CardHeader className="space-y-3">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            活動邀請
          </CardTitle>
          <CardDescription className="text-center text-base">
            {guest?.invite_type === 'named' 
              ? `親愛的 ${guest.name}，誠摯邀請您出席` 
              : '請填寫實際出席者資料'}
          </CardDescription>
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
                onValueChange={(value) => setFormData({ ...formData, dinner: value === 'true' })}
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
                        <SelectItem value="1630">16:30</SelectItem>
                        <SelectItem value="1700">17:00</SelectItem>
                        <SelectItem value="1730">17:30</SelectItem>
                        <SelectItem value="1800">18:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
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

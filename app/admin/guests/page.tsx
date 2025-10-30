'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, RefreshCw, Plus, Edit, Trash2, Save, Mail, MailCheck, ExternalLink, Copy, Eye, EyeOff, CheckCircle } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Guest {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  invite_type: 'named' | 'company';
  guest_category: 'netcraft' | 'vip' | 'regular';
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  dinner: number;
  cocktail: number;
  vegetarian: number;
  workshop_type: string | null;
  workshop_time: string | null;
  checked_in: number;
  invitation_sent?: number;
  invitation_sent_at?: string | null;
  invitation_message_id?: string | null;
  token: string;
  created_at: string;
}

interface GuestFormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  invite_type: 'named' | 'company';
  guest_category: 'netcraft' | 'vip' | 'regular';
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  dinner: boolean;
  cocktail: boolean;
  vegetarian: boolean;
  workshop_type: string;
  workshop_time: string;
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [formData, setFormData] = useState<GuestFormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    invite_type: 'named',
    guest_category: 'netcraft',
    rsvp_status: 'pending',
    dinner: false,
    cocktail: false,
    vegetarian: false,
    workshop_type: 'none',
    workshop_time: 'none'
  });

  // Check-in related states
  const [searchQuery, setSearchQuery] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState<{type: 'success' | 'error' | 'warning' | null, message: string}>({type: null, message: ''});
  const [autoFocusQR, setAutoFocusQR] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Email preview related states
  const [previewType, setPreviewType] = useState<'invitation' | 'confirmation' | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const response = await apiGet('/api/admin/guests');
      if (response.ok) {
        const data = await response.json();
        setGuests(data);
      }
    } catch (error) {
      console.error('Failed to fetch guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const response = await apiGet('/api/admin/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guests-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleAddGuest = async () => {
    try {
      const response = await apiPost('/api/admin/guests', {
        name: formData.name,
        email: formData.email,
        company: formData.company || null,
        phone: formData.phone || null,
        invite_type: formData.invite_type,
        guest_category: formData.guest_category
      });

      if (response.ok) {
        setShowAddDialog(false);
        resetForm();
        fetchGuests();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add guest');
      }
    } catch (error) {
      console.error('Failed to add guest:', error);
      alert('Failed to add guest');
    }
  };

  const handleEditGuest = (guest: Guest) => {
    setFormData({
      name: guest.name,
      email: guest.email,
      company: guest.company || '',
      phone: guest.phone || '',
      invite_type: guest.invite_type,
      guest_category: guest.guest_category,
      rsvp_status: guest.rsvp_status,
      dinner: guest.dinner === 1,
      cocktail: guest.cocktail === 1,
      vegetarian: guest.vegetarian === 1,
      workshop_type: guest.workshop_type || 'none',
      workshop_time: guest.workshop_time || 'none'
    });
    setEditingGuest(guest.id);
  };

  const handleUpdateGuest = async () => {
    if (!editingGuest) return;

    try {
      const response = await apiPut(`/api/admin/guests/${editingGuest}`, {
        name: formData.name,
        email: formData.email,
        company: formData.company || null,
        phone: formData.phone || null,
        invite_type: formData.invite_type,
        guest_category: formData.guest_category,
        rsvp_status: formData.rsvp_status,
        dinner: formData.dinner,
        cocktail: formData.cocktail,
        vegetarian: formData.vegetarian,
        workshop_type: formData.workshop_type === 'none' ? null : formData.workshop_type,
        workshop_time: formData.workshop_time === 'none' ? null : formData.workshop_time
      });

      if (response.ok) {
        setEditingGuest(null);
        resetForm();
        fetchGuests();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update guest');
      }
    } catch (error) {
      console.error('Failed to update guest:', error);
      alert('Failed to update guest');
    }
  };

  const handleDeleteGuest = async (guestId: string, guestName: string) => {
    if (!confirm(`確定要刪除嘉賓 "${guestName}" 嗎？此操作無法復原。`)) {
      return;
    }

    try {
      const response = await apiDelete(`/api/admin/guests/${guestId}`);

      if (response.ok) {
        fetchGuests();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete guest');
      }
    } catch (error) {
      console.error('Failed to delete guest:', error);
      alert('Failed to delete guest');
    }
  };

  const handleSendInvitation = async (guestId: string, isResend: boolean = false) => {
    const confirmMessage = isResend 
      ? '確定要重新發送邀請郵件嗎？' 
      : '確定要發送邀請郵件嗎？';
    
    if (!confirm(confirmMessage)) return;

    try {
      const response = await apiPost(`/api/admin/send-invitation/${guestId}`, {});
      if (response.ok) {
        // Refresh the guest list to update invitation status
        fetchGuests();
        alert(isResend ? '邀請郵件重新發送成功！' : '邀請郵件發送成功！');
      } else {
        const error = await response.json();
        alert(`發送失敗：${error.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('Send invitation failed:', error);
      alert('發送失敗，請重試');
    }
  };

  const handlePreviewInvitation = async (guestId: string) => {
    try {
      setPreviewType('invitation');
      setPreviewLoading(true);
      setPreviewHtml('');

      const response = await apiGet(`/api/admin/preview-invitation/${guestId}`);
      
      if (response.ok) {
        const htmlContent = await response.text();
        setPreviewHtml(htmlContent);
      } else {
        const errorText = await response.text();
        console.error('Preview invitation failed:', response.status, response.statusText, errorText);
        alert(`預覽失敗：${response.status} ${response.statusText}\n${errorText}`);
      }
    } catch (error) {
      console.error('Preview invitation error:', error);
      alert('預覽載入失敗，請重試');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewConfirmation = async (guestId: string) => {
    try {
      setPreviewType('confirmation');
      setPreviewLoading(true);
      setPreviewHtml('');

      const response = await apiGet(`/api/admin/preview-confirmation/${guestId}`);
      
      if (response.ok) {
        const htmlContent = await response.text();
        setPreviewHtml(htmlContent);
      } else {
        const errorText = await response.text();
        console.error('Preview confirmation failed:', response.status, response.statusText, errorText);
        alert(`預覽失敗：${response.status} ${response.statusText}\n${errorText}`);
      }
    } catch (error) {
      console.error('Preview confirmation error:', error);
      alert('預覽載入失敗，請重試');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSendConfirmation = async (guestId: string, guestName: string, rsvpStatus: string) => {
    if (rsvpStatus !== 'confirmed') {
      alert('只能為已確認的嘉賓發送確認郵件');
      return;
    }
    
    if (!confirm(`確定要發送確認郵件給 ${guestName} 嗎？`)) return;
    
    try {
      const response = await apiPost(`/api/admin/send-confirmation/${guestId}`, {});
      if (response.ok) {
        alert('確認郵件發送成功！');
      } else {
        const error = await response.json();
        alert(`發送失敗：${error.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('Send confirmation failed:', error);
      alert('發送失敗，請重試');
    }
  };

  const handleCopyRSVPLink = async (token: string) => {
    const rsvpUrl = `${window.location.origin}/rsvp?token=${token}`;
    try {
      await navigator.clipboard.writeText(rsvpUrl);
      alert('RSVP 連結已複製到剪貼板！');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = rsvpUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('RSVP 連結已複製到剪貼板！');
    }
  };

  const handleOpenRSVP = (token: string) => {
    const rsvpUrl = `${window.location.origin}/rsvp?token=${token}`;
    window.open(rsvpUrl, '_blank');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      invite_type: 'named',
      guest_category: 'netcraft',
      rsvp_status: 'pending',
      dinner: false,
      cocktail: false,
      vegetarian: false,
      workshop_type: 'none',
      workshop_time: 'none'
    });
  };

  // Search guests for check-in
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await apiGet(`/api/admin/guests/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        if (results.length === 1) {
          setSelectedGuest(results[0]);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      setCheckinStatus({type: 'error', message: '搜尋失敗'});
    }
  };


  // Auto process QR input when content changes
  const handleQRInputChange = async (value: string) => {
    setQrInput(value);
    
    // Auto process if content looks like QR code (has token pattern or JSON)
    if (value.trim()) {
      console.log('QR Input detected:', value);
      
      // Check if it looks like a QR code
      const isQRCode = (
        value.includes('token_') || 
        value.includes('"token"') || 
        (value.includes('{') && value.includes('}'))
      );
      
      if (isQRCode) {
        console.log('QR Code detected, processing...');
        // Small delay to allow for complete paste
        setTimeout(() => {
          console.log('Executing handleQRInput with value:', value);
          processQRCode(value);
        }, 300);
      }
    }
  };

  // Process QR code with the actual value
  const processQRCode = async (value: string) => {
    console.log('processQRCode called with:', value);
    if (!value.trim()) {
      console.log('QR input is empty, returning');
      return;
    }

    try {
      let token = '';
      
      // Try to parse as JSON first
      try {
        const qrData = JSON.parse(value);
        if (qrData.token) {
          token = qrData.token;
        } else {
          setCheckinStatus({type: 'error', message: 'QR Code 格式錯誤：缺少 token'});
          return;
        }
      } catch (error) {
        // If not JSON, assume it's just a token
        token = value.trim();
      }

      console.log('Extracted token:', token);

      // Find guest by token
      const guest = guests.find(g => g.token === token);
      if (!guest) {
        console.log('Guest not found for token:', token);
        setCheckinStatus({type: 'error', message: '找不到對應的客人'});
        return;
      }

      console.log('Found guest:', guest.name);

      // Set selected guest
      setSelectedGuest(guest);
      setCheckinStatus({type: null, message: ''});

      // Auto check-in if not already checked in
      if (guest.checked_in !== 1) {
        console.log('Guest not checked in, performing check-in');
        await performCheckin(guest);
        if (autoFocusQR) {
          setTimeout(() => {
            qrInputRef.current?.focus();
          }, 50);
        }
      } else {
        console.log('Guest already checked in');
        // Show that guest is already checked in
        setCheckinStatus({type: 'success', message: `${guest.name} 已經簽到過了`});
        if (autoFocusQR) {
          setTimeout(() => {
            qrInputRef.current?.focus();
          }, 50);
        }
        // Auto clear after 3 seconds
        setTimeout(() => {
          resetCheckinForm();
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setCheckinStatus({type: 'error', message: 'QR Code 格式錯誤或找不到客人'});
    }
  };

  // Perform check-in
  const performCheckin = async (guest: Guest) => {
    setCheckingIn(true);
    try {
      const response = await apiPost('/api/scan', { token: guest.token });
      const data = await response.json();

      if (response.ok) {
        setCheckinStatus({type: 'success', message: `${guest.name} 簽到成功！`});
        // Refresh guest list
        fetchGuests();
        // Clear form after 2 seconds
        setTimeout(() => {
          resetCheckinForm();
        }, 2000);
      } else if (data.status === 'duplicate') {
        setCheckinStatus({type: 'success', message: `${guest.name} 已經簽到過了`});
        // Auto clear after 3 seconds
        setTimeout(() => {
          resetCheckinForm();
        }, 3000);
      } else {
        setCheckinStatus({type: 'error', message: data.error || '簽到失敗'});
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      setCheckinStatus({type: 'error', message: '簽到失敗，請重試'});
    } finally {
      setCheckingIn(false);
      if (autoFocusQR) {
        setTimeout(() => {
          qrInputRef.current?.focus();
        }, 50);
      }
    }
  };

  // Check-in guest
  const handleCheckin = async () => {
    if (!selectedGuest) return;
    await performCheckin(selectedGuest);
  };

  // Reset check-in form
  const resetCheckinForm = () => {
    setSearchQuery('');
    setQrInput('');
    setSearchResults([]);
    setSelectedGuest(null);
    setCheckinStatus({type: null, message: ''});
    if (autoFocusQR) {
      setTimeout(() => {
        qrInputRef.current?.focus();
      }, 50);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-600">已確認</Badge>;
      case 'declined':
        return <Badge variant="secondary">已婉拒</Badge>;
      case 'pending':
        return <Badge variant="outline">待回覆</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'netcraft':
        return <Badge className="bg-blue-600">NetCraft 同事</Badge>;
      case 'vip':
        return <Badge className="bg-orange-600">VIP</Badge>;
      case 'regular':
        return <Badge className="bg-green-600">普通嘉賓</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const formatWorkshop = (type: string | null, time: string | null) => {
    if (!type) return '-';
    const typeName = type === 'leather' ? '皮革' : '香水';
    const timeFormatted = time ? `${time.slice(0, 2)}:${time.slice(2)}` : '';
    return `${typeName} ${timeFormatted}`;
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Link href="/admin">
              <Button variant="ghost" className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回管理面板
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-slate-900">嘉賓管理</h1>
            <p className="text-slate-600 mt-2">共 {guests.length} 位嘉賓</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDetailedView(!showDetailedView)}
              className="flex items-center gap-2"
            >
              {showDetailedView ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  簡潔檢視
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  詳細檢視
                </>
              )}
            </Button>
            <Button variant="outline" onClick={fetchGuests} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              重新整理
            </Button>
            <Button onClick={exportCSV} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              {exporting ? '匯出中...' : '匯出 CSV'}
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新增嘉賓
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>新增嘉賓</DialogTitle>
                  <DialogDescription>
                    填寫嘉賓基本資訊，系統會自動生成邀請 token。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">姓名 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="col-span-3"
                      placeholder="嘉賓姓名"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">郵箱 *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="col-span-3"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company" className="text-right">公司</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="col-span-3"
                      placeholder="公司名稱（可選）"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">電話</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="col-span-3"
                      placeholder="電話號碼（可選）"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="invite_type" className="text-right">邀請類型 *</Label>
                    <Select value={formData.invite_type} onValueChange={(value: 'named' | 'company') => setFormData({...formData, invite_type: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="named">具名嘉賓</SelectItem>
                        <SelectItem value="company">公司邀請</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="guest_category" className="text-right">嘉賓分類 *</Label>
                    <Select value={formData.guest_category} onValueChange={(value: 'netcraft' | 'vip' | 'regular') => setFormData({...formData, guest_category: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="netcraft">NetCraft 同事</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="regular">普通嘉賓</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
                  <Button onClick={handleAddGuest} disabled={!formData.name || !formData.email}>新增</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Check-in Section */}
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-2xl text-blue-900">現場簽到</CardTitle>
            <CardDescription>
              使用搜尋或 QR Code 快速簽到
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Search Method */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">方法一：搜尋客人</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="輸入姓名、電話、Email 或公司..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} variant="outline">
                    搜尋
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto border rounded-md p-2">
                    {searchResults.map((guest) => (
                      <div
                        key={guest.id}
                        onClick={() => setSelectedGuest(guest)}
                        className={`p-2 rounded cursor-pointer hover:bg-blue-100 ${
                          selectedGuest?.id === guest.id ? 'bg-blue-200' : 'bg-white'
                        }`}
                      >
                        <div className="font-medium">{guest.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {guest.phone} • {guest.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* QR Code Method */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">方法二：QR Code（一貼上就自動簽到）</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-focus-qr" checked={autoFocusQR} onCheckedChange={(v) => setAutoFocusQR(!!v)} />
                    <Label htmlFor="auto-focus-qr" className="text-sm text-slate-700">簽到後自動回到 QR 輸入</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="貼上 QR Code 內容立即自動簽到..."
                    ref={qrInputRef}
                    value={qrInput}
                    onChange={(e) => handleQRInputChange(e.target.value)}
                    onBlur={() => {
                      if (!autoFocusQR) return;
                      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                      blurTimerRef.current = setTimeout(() => {
                        qrInputRef.current?.focus();
                      }, 2000);
                    }}
                    onFocus={() => {
                      if (blurTimerRef.current) {
                        clearTimeout(blurTimerRef.current);
                        blurTimerRef.current = null;
                      }
                    }}
                    className="flex-1 font-mono text-sm"
                    disabled={checkingIn}
                  />
                  {checkingIn && (
                    <div className="flex items-center px-3 text-blue-600">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      處理中...
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  範例：{`{"id":"xxx","token":"xxx","name":"xxx",...}`} 或直接貼上 token
                </p>
              </div>
            </div>

            {/* Selected Guest Card */}
            {selectedGuest && (
              <div className="border-2 border-blue-300 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-blue-900">{selectedGuest.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedGuest.company || '無公司資料'} • {selectedGuest.phone || '無電話'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetCheckinForm}>
                    ✕
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">RSVP 狀態</p>
                    <div className="font-medium">{getStatusBadge(selectedGuest.rsvp_status)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">晚宴</p>
                    <p className="font-medium">{selectedGuest.dinner ? '✓ 參加' : '✗ 不參加'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">雞尾酒會</p>
                    <p className="font-medium">{selectedGuest.cocktail ? '✓ 參加' : '✗ 不參加'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">素食</p>
                    <p className="font-medium">{selectedGuest.vegetarian ? '✓ 需要' : '✗ 不需要'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">工作坊</p>
                    <p className="font-medium">
                      {selectedGuest.workshop_type ? (
                        <span className="text-orange-600 font-semibold">
                          ⚠️ {formatWorkshop(selectedGuest.workshop_type, selectedGuest.workshop_time)}
                        </span>
                      ) : (
                        '✓ 無需發放'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleCheckin}
                    disabled={checkingIn || selectedGuest.checked_in === 1}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {checkingIn ? '處理中...' : selectedGuest.checked_in ? '已簽到 ✓' : '確認簽到'}
                  </Button>
                  <Button onClick={resetCheckinForm} variant="outline" size="lg">
                    清除
                  </Button>
                </div>
              </div>
            )}

            {/* Status Message */}
            {checkinStatus.type && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  checkinStatus.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : checkinStatus.type === 'warning'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {checkinStatus.message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>所有嘉賓</CardTitle>
            <CardDescription>
              查看和管理所有邀請嘉賓的 RSVP 狀態，支援編輯和刪除操作
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">載入中...</p>
              </div>
            ) : guests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">尚無嘉賓資料</p>
                <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  立即新增
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      {showDetailedView && <TableHead>公司</TableHead>}
                      {showDetailedView && <TableHead>郵箱</TableHead>}
                      {showDetailedView && <TableHead>電話</TableHead>}
                      <TableHead>分類</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>邀請狀態</TableHead>
                      <TableHead>晚宴</TableHead>
                      <TableHead>雞尾酒</TableHead>
                      {showDetailedView && <TableHead>素食</TableHead>}
                      <TableHead>工作坊</TableHead>
                      <TableHead>簽到</TableHead>
                      <TableHead className="w-[140px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell className="font-medium">{guest.name}</TableCell>
                        {showDetailedView && (
                          <TableCell>{guest.company || '-'}</TableCell>
                        )}
                        {showDetailedView && (
                          <TableCell className="text-sm text-muted-foreground">
                            {guest.email}
                          </TableCell>
                        )}
                        {showDetailedView && (
                          <TableCell className="text-sm">
                            {guest.phone || '-'}
                          </TableCell>
                        )}
                        <TableCell>{getCategoryBadge(guest.guest_category)}</TableCell>
                        <TableCell>{getStatusBadge(guest.rsvp_status)}</TableCell>
                        <TableCell>
                          {guest.invitation_sent ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              已發送
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              未發送
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {guest.dinner ? '✓' : '-'}
                        </TableCell>
                        <TableCell>
                          {guest.cocktail ? '✓' : '-'}
                        </TableCell>
                        {showDetailedView && (
                          <TableCell>
                            {guest.vegetarian ? '✓' : '-'}
                          </TableCell>
                        )}
                        <TableCell className="text-sm">
                          {formatWorkshop(guest.workshop_type, guest.workshop_time)}
                        </TableCell>
                        <TableCell>
                          {guest.checked_in ? (
                            <Badge className="bg-blue-600">已簽到</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyRSVPLink(guest.token)}
                              className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                              title="複製 RSVP 連結"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRSVP(guest.token)}
                              className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700"
                              title="開啟 RSVP 頁面"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {guest.invitation_sent ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendInvitation(guest.id, true)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                title="重新發送邀請郵件"
                              >
                                <MailCheck className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendInvitation(guest.id, false)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                title="發送邀請郵件"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreviewInvitation(guest.id)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                              title="預覽邀請郵件"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendConfirmation(guest.id, guest.name, guest.rsvp_status)}
                              disabled={guest.rsvp_status !== 'confirmed'}
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 disabled:opacity-30"
                              title="發送確認郵件（含 QR Code）"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreviewConfirmation(guest.id)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              title="預覽確認郵件"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditGuest(guest)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGuest(guest.id, guest.name)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editingGuest !== null} onOpenChange={(open) => !open && setEditingGuest(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>編輯嘉賓</DialogTitle>
              <DialogDescription>
                修改嘉賓資訊和 RSVP 狀態
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">姓名 *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">郵箱 *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-company">公司</Label>
                  <Input
                    id="edit-company"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">電話</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="電話號碼"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-invite-type">邀請類型 *</Label>
                <Select value={formData.invite_type} onValueChange={(value: 'named' | 'company') => setFormData({...formData, invite_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="named">具名嘉賓</SelectItem>
                    <SelectItem value="company">公司邀請</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-guest-category">嘉賓分類 *</Label>
                <Select value={formData.guest_category} onValueChange={(value: 'netcraft' | 'vip' | 'regular') => setFormData({...formData, guest_category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="netcraft">NetCraft 同事</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="regular">普通嘉賓</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">RSVP 狀態</Label>
                <Select value={formData.rsvp_status} onValueChange={(value: 'pending' | 'confirmed' | 'declined') => setFormData({...formData, rsvp_status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待回覆</SelectItem>
                    <SelectItem value="confirmed">已確認</SelectItem>
                    <SelectItem value="declined">已婉拒</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-dinner"
                      checked={formData.dinner}
                      onCheckedChange={(checked) => setFormData({...formData, dinner: checked as boolean})}
                    />
                    <Label htmlFor="edit-dinner">參加晚宴</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-cocktail"
                      checked={formData.cocktail}
                      onCheckedChange={(checked) => setFormData({...formData, cocktail: checked as boolean})}
                    />
                    <Label htmlFor="edit-cocktail">參加雞尾酒會</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-vegetarian"
                      checked={formData.vegetarian}
                      onCheckedChange={(checked) => setFormData({...formData, vegetarian: checked as boolean})}
                    />
                    <Label htmlFor="edit-vegetarian">素食</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-workshop-type">工作坊類型</Label>
                    <Select value={formData.workshop_type} onValueChange={(value) => setFormData({...formData, workshop_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇工作坊" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">無</SelectItem>
                        <SelectItem value="leather">皮革工作坊</SelectItem>
                        <SelectItem value="perfume">香水工作坊</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-workshop-time">工作坊時段</Label>
                    <Select value={formData.workshop_time} onValueChange={(value) => setFormData({...formData, workshop_time: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇時段" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">無</SelectItem>
                        <SelectItem value="1630">16:30</SelectItem>
                        <SelectItem value="1700">17:00</SelectItem>
                        <SelectItem value="1730">17:30</SelectItem>
                        <SelectItem value="1800">18:00</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingGuest(null)}>取消</Button>
              <Button onClick={handleUpdateGuest} disabled={!formData.name || !formData.email}>
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Preview Dialog */}
        <Dialog open={previewType !== null} onOpenChange={(open) => !open && setPreviewType(null)}>
          <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                {previewType === 'invitation' ? '邀請郵件預覽' : '確認郵件預覽'}
              </DialogTitle>
              <DialogDescription>
                預覽郵件樣式和內容
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto max-h-[70vh]">
              {previewLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-400" />
                    <p className="text-muted-foreground">載入郵件預覽中...</p>
                  </div>
                </div>
              ) : previewHtml ? (
                <div
                  className="border rounded-lg p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <div className="flex items-center justify-center h-96">
                  <p className="text-muted-foreground">預覽載入失敗</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewType(null)}>
                關閉
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}

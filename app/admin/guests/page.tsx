'use client';

import { useEffect, useState } from 'react';
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
import { ArrowLeft, Download, RefreshCw, Plus, Edit, Trash2, Save, X, Mail, MailCheck, ExternalLink, Copy } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Guest {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  invite_type: 'named' | 'company';
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  dinner: number;
  cocktail: number;
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
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  dinner: boolean;
  cocktail: boolean;
  workshop_type: string;
  workshop_time: string;
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState<string | null>(null);
  const [formData, setFormData] = useState<GuestFormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    invite_type: 'named',
    rsvp_status: 'pending',
    dinner: false,
    cocktail: false,
    workshop_type: 'none',
    workshop_time: 'none'
  });

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
        invite_type: formData.invite_type
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
      rsvp_status: guest.rsvp_status,
      dinner: guest.dinner === 1,
      cocktail: guest.cocktail === 1,
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
        rsvp_status: formData.rsvp_status,
        dinner: formData.dinner,
        cocktail: formData.cocktail,
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

  const handleCopyRSVPLink = async (token: string) => {
    const rsvpUrl = `${window.location.origin}/rsvp/${token}`;
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
    const rsvpUrl = `${window.location.origin}/rsvp/${token}`;
    window.open(rsvpUrl, '_blank');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      invite_type: 'named',
      rsvp_status: 'pending',
      dinner: false,
      cocktail: false,
      workshop_type: 'none',
      workshop_time: 'none'
    });
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
                  <Button onClick={handleAddGuest} disabled={!formData.name || !formData.email}>新增</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

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
                      <TableHead>公司</TableHead>
                      <TableHead>郵箱</TableHead>
                      <TableHead>電話</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>邀請狀態</TableHead>
                      <TableHead>晚宴</TableHead>
                      <TableHead>雞尾酒</TableHead>
                      <TableHead>工作坊</TableHead>
                      <TableHead>簽到</TableHead>
                      <TableHead className="w-[140px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell className="font-medium">{guest.name}</TableCell>
                        <TableCell>{guest.company || '-'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {guest.email}
                        </TableCell>
                        <TableCell className="text-sm">
                          {guest.phone || '-'}
                        </TableCell>
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
      </div>
    </main>
  );
}
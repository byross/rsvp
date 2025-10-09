'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";

interface Guest {
  id: string;
  name: string;
  company: string | null;
  email: string;
  invite_type: 'named' | 'company';
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  dinner: number;
  cocktail: number;
  workshop_type: string | null;
  workshop_time: string | null;
  checked_in: number;
  created_at: string;
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/guests');
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
      const response = await fetch('/api/admin/export');
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
            <h1 className="text-4xl font-bold text-slate-900">嘉賓列表</h1>
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
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>所有嘉賓</CardTitle>
            <CardDescription>
              查看和管理所有邀請嘉賓的 RSVP 狀態
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
                <Link href="/admin/import">
                  <Button className="mt-4">立即導入</Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>公司</TableHead>
                      <TableHead>郵箱</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>晚宴</TableHead>
                      <TableHead>雞尾酒</TableHead>
                      <TableHead>工作坊</TableHead>
                      <TableHead>簽到</TableHead>
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
                        <TableCell>{getStatusBadge(guest.rsvp_status)}</TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

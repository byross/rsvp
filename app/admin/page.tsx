'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  List,
  Mail,
  TrendingUp,
  LogOut,
  PieChart as PieChartIcon
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import AdminAuthGuard from "@/components/AdminAuthGuard";
import { logout } from "@/lib/auth";
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  declined: number;
  dinner: number;
  cocktail: number;
  workshopLeather: number;
  workshopPerfume: number;
  workshopByTime: {
    [key: string]: number;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiGet('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  // Prepare data for pie charts
  const rsvpData = [
    { name: '已確認', value: stats?.confirmed || 0, color: '#10b981' },
    { name: '待回覆', value: stats?.pending || 0, color: '#f97316' },
    { name: '已婉拒', value: stats?.declined || 0, color: '#64748b' },
  ];

  const eventData = [
    { name: '晚宴', value: stats?.dinner || 0, color: '#3b82f6' },
    { name: '雞尾酒會', value: stats?.cocktail || 0, color: '#8b5cf6' },
  ];

  const workshopData = [
    { name: '皮革工作坊', value: stats?.workshopLeather || 0, color: '#d97706' },
    { name: '香水工作坊', value: stats?.workshopPerfume || 0, color: '#9333ea' },
    { name: '未報名', value: (stats?.confirmed || 0) - (stats?.workshopLeather || 0) - (stats?.workshopPerfume || 0), color: '#e5e7eb' },
  ];

  if (loading) {
    return (
      <AdminAuthGuard>
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
          <p>載入中...</p>
        </main>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <main className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">管理面板</h1>
              <p className="text-slate-600 mt-2">活動邀請與 RSVP 管理系統</p>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline">返回首頁</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                登出
              </Button>
            </div>
          </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/guests">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <List className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">嘉賓列表</h3>
                    <p className="text-sm text-muted-foreground">查看和管理所有嘉賓</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/import">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Upload className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">CSV 導入</h3>
                    <p className="text-sm text-muted-foreground">批量導入嘉賓名單</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Mail className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">發送邀請</h3>
                  <p className="text-sm text-muted-foreground">批量發送邀請郵件</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                總邀請數
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats?.total || 0}</div>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                已確認
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-green-600">{stats?.confirmed || 0}</div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              {stats?.total && stats.total > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {((stats.confirmed / stats.total) * 100).toFixed(1)}% 確認率
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                待回覆
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-orange-600">{stats?.pending || 0}</div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                已婉拒
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-600">{stats?.declined || 0}</div>
                <XCircle className="w-8 h-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RSVP Status Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                RSVP 狀態分布
              </CardTitle>
              <CardDescription>回覆狀態統計</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={rsvpData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    fontSize={10}
                  >
                    {rsvpData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Event Attendance Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                活動參與分布
              </CardTitle>
              <CardDescription>已確認嘉賓的活動出席統計</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={eventData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    fontSize={10}
                  >
                    {eventData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Workshop Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                工作坊報名分布
              </CardTitle>
              <CardDescription>已確認嘉賓的工作坊參與統計</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={workshopData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    fontSize={10}
                  >
                    {workshopData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Event Attendance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                活動出席統計
              </CardTitle>
              <CardDescription>已確認嘉賓的各項活動參與人數</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="font-medium">晚宴</span>
                <Badge variant="secondary" className="text-lg">
                  {stats?.dinner || 0} 人
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="font-medium">雞尾酒會</span>
                <Badge variant="secondary" className="text-lg">
                  {stats?.cocktail || 0} 人
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Workshop Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>工作坊統計</CardTitle>
              <CardDescription>已確認嘉賓的工作坊報名人數</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">皮革工作坊</span>
                  <Badge className="bg-amber-600 text-lg">
                    {stats?.workshopLeather || 0} 人
                  </Badge>
                </div>
                <div className="space-y-1 ml-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">16:30</span>
                    <span>{stats?.workshopByTime?.['leather-1630'] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">17:00</span>
                    <span>{stats?.workshopByTime?.['leather-1700'] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">17:30</span>
                    <span>{stats?.workshopByTime?.['leather-1730'] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">18:00</span>
                    <span>{stats?.workshopByTime?.['leather-1800'] || 0}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">香水工作坊</span>
                  <Badge className="bg-purple-600 text-lg">
                    {stats?.workshopPerfume || 0} 人
                  </Badge>
                </div>
                <div className="space-y-1 ml-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">16:30</span>
                    <span>{stats?.workshopByTime?.['perfume-1630'] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">17:00</span>
                    <span>{stats?.workshopByTime?.['perfume-1700'] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">17:30</span>
                    <span>{stats?.workshopByTime?.['perfume-1730'] || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">18:00</span>
                    <span>{stats?.workshopByTime?.['perfume-1800'] || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
    </AdminAuthGuard>
  );
}

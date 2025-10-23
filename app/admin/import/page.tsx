'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiPost } from '@/lib/api';

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: string[];
}

export default function ImportPage() {
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      alert('請輸入或上傳 CSV 資料');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const response = await apiPost('/api/admin/import', { csvData: csvText });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Import failed:', error);
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: ['導入失敗，請檢查網絡連接'],
      });
    } finally {
      setImporting(false);
    }
  };

  const exampleCSV = `name,email,company,phone,invite_type,guest_category
張三,zhang@example.com,ABC公司,0912345678,named,netcraft
李四,li@example.com,XYZ公司,0987654321,company,vip
王五,wang@example.com,,,named,regular`;

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/admin">
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回管理面板
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900">CSV 導入</h1>
          <p className="text-slate-600 mt-2">批量導入嘉賓名單</p>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              CSV 格式說明
            </CardTitle>
            <CardDescription>
              請按照以下格式準備您的 CSV 文件
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">必要欄位：</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code>name</code> - 嘉賓姓名</li>
                <li><code>email</code> - 電子郵箱</li>
                <li><code>invite_type</code> - 邀請類型（<code>named</code> 或 <code>company</code>）</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">選填欄位：</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code>company</code> - 公司名稱</li>
                <li><code>phone</code> - 電話號碼</li>
                <li><code>guest_category</code> - 嘉賓分類（<code>netcraft</code>、<code>vip</code>、<code>regular</code>，預設：<code>netcraft</code>）</li>
              </ul>
            </div>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{exampleCSV}</pre>
            </div>
            <div className="flex gap-2 text-sm">
              <Badge variant="outline">UTF-8 編碼</Badge>
              <Badge variant="outline">逗號分隔</Badge>
              <Badge variant="outline">包含標題行</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>上傳 CSV 文件</CardTitle>
            <CardDescription>
              選擇文件或直接貼上 CSV 內容
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    選擇 CSV 文件
                  </span>
                </Button>
              </label>
              <span className="text-sm text-muted-foreground">
                或直接在下方貼上 CSV 內容
              </span>
            </div>

            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="name,email,company,phone,invite_type,guest_category&#10;張三,zhang@example.com,ABC公司,0912345678,named,netcraft"
              className="font-mono text-sm min-h-[300px]"
            />

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {csvText.trim() ? `${csvText.split('\n').length} 行` : '尚未輸入資料'}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCsvText('')}
                  disabled={!csvText.trim()}
                >
                  清除
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!csvText.trim() || importing}
                >
                  {importing ? '導入中...' : '開始導入'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-600">導入完成</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-600">導入失敗</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">成功導入</p>
                  <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">失敗</p>
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600">錯誤訊息：</h4>
                  <ul className="space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                        <span>•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.success && result.imported > 0 && (
                <div className="flex gap-2">
                  <Link href="/admin/guests">
                    <Button>查看嘉賓列表</Button>
                  </Link>
                  <Button variant="outline" onClick={() => setResult(null)}>
                    繼續導入
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

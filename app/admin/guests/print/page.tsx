'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getApiUrl } from '@/lib/config';
import { apiGet } from '@/lib/api';

// Client-only component for date to avoid hydration mismatch
function PrintTime() {
  const [time, setTime] = useState<string>('');
  
  useEffect(() => {
    setTime(new Date().toLocaleString('zh-TW'));
  }, []);
  
  return <>{time || '載入中...'}</>;
}

interface Guest {
  id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  guest_category: 'netcraft' | 'vip' | 'guest' | 'regular';
  dinner: number;
  cocktail: number;
  vegetarian: number;
  workshop_type: string | null;
  workshop_time: string | null;
}

function PrintPageContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const company = searchParams.get('company');
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (company) params.append('company', company);
        
        const url = `/api/admin/guests${params.toString() ? '?' + params.toString() : ''}`;
        const response = await apiGet(url);
        
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

    fetchGuests();
  }, [category, company]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      netcraft: 'NetCraft',
      vip: 'VIP',
      guest: '嘉賓',
      regular: '普通'
    };
    return labels[category] || category;
  };

  const formatWorkshop = (type: string | null, time: string | null) => {
    if (!type) return '-';
    const typeName = type === 'leather' ? '皮革' : type === 'perfume' ? '調香' : type;
    const timeFormatted = time ? `${time.slice(0, 2)}:${time.slice(2)}` : '';
    return `${typeName} ${timeFormatted}`.trim();
  };

  const getFilterText = () => {
    const filters: string[] = [];
    if (category) filters.push(`分類: ${getCategoryLabel(category)}`);
    if (company) filters.push(`公司: ${company}`);
    return filters.length > 0 ? filters.join(' | ') : '全部嘉賓';
  };

  const apiBase = getApiUrl();

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <>
      {/* Print Controls - Hidden when printing */}
      <div className="no-print p-4 bg-gray-100 border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">批量打印嘉賓資料</h2>
            <p className="text-sm text-gray-600">共 {guests.length} 位嘉賓 | {getFilterText()}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            打印
          </button>
        </div>
      </div>

      {/* Print Content */}
      <div className="p-4 print:p-2">
        <div className="max-w-full">
          {/* Header */}
          <div className="mb-4 print:mb-2">
            <h1 className="text-xl font-bold print:text-lg">嘉賓資料表</h1>
            <p className="text-sm text-gray-600 print:text-xs">{getFilterText()}</p>
            <p className="text-xs text-gray-500 print:text-xs">打印時間: <PrintTime /></p>
          </div>

          {/* Table */}
          <table className="w-full border-collapse text-xs print:text-[10px]">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-200">
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold w-[80px]">姓名</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold w-[100px]">公司</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold w-[150px]">郵箱</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold w-[100px]">電話</th>
                <th className="border border-gray-300 px-2 py-1 text-center font-semibold w-[60px]">分類</th>
                <th className="border border-gray-300 px-2 py-1 text-center font-semibold w-[40px]">晚宴</th>
                <th className="border border-gray-300 px-2 py-1 text-center font-semibold w-[40px]">酒會</th>
                <th className="border border-gray-300 px-2 py-1 text-center font-semibold w-[40px]">素食</th>
                <th className="border border-gray-300 px-2 py-1 text-left font-semibold w-[80px]">工作坊</th>
                <th className="border border-gray-300 px-2 py-1 text-center font-semibold w-[80px]">QR Code</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest, index) => (
                <tr key={guest.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                  <td className="border border-gray-300 px-2 py-1">{guest.name}</td>
                  <td className="border border-gray-300 px-2 py-1">{guest.company || '-'}</td>
                  <td className="border border-gray-300 px-2 py-1 text-[9px] print:text-[8px]">{guest.email}</td>
                  <td className="border border-gray-300 px-2 py-1">{guest.phone || '-'}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{getCategoryLabel(guest.guest_category)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{guest.dinner ? '✓' : '✗'}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{guest.cocktail ? '✓' : '✗'}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">{guest.vegetarian ? '✓' : '✗'}</td>
                  <td className="border border-gray-300 px-2 py-1">{formatWorkshop(guest.workshop_type, guest.workshop_time)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-center">
                    <img 
                      src={`${apiBase}/qr/qr-${guest.id}.png`}
                      alt={`QR Code for ${guest.name}`}
                      className="w-12 h-12 mx-auto print:w-10 print:h-10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="mt-4 print:mt-2 text-xs text-gray-500 text-center">
            共 {guests.length} 位嘉賓
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 1cm;
            size: A4;
          }
          
          .no-print {
            display: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tfoot {
            display: table-footer-group;
          }
          
          /* Ensure at least 20 rows per page */
          tr {
            height: 30px;
          }
        }
        
        @media screen {
          table {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center">
        <p>載入中...</p>
      </div>
    }>
      <PrintPageContent />
    </Suspense>
  );
}


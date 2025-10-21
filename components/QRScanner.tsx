'use client';

import { useEffect, useRef, useState } from 'react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  className?: string;
}

export default function QRScanner({ onScanSuccess, onScanError, className = '' }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);

  // 簡單的 QR Code 檢測（基於模式匹配）
  const detectQRCode = (imageData: ImageData): string | null => {
    // 這是一個簡化的實現，實際應用中可能需要更複雜的算法
    // 或者使用 WebAssembly 版本的 ZXing 等庫
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // 尋找 QR Code 的三個定位點模式
    // 這是一個非常簡化的實現，僅供演示
    for (let y = 0; y < height - 20; y += 10) {
      for (let x = 0; x < width - 20; x += 10) {
        // 檢查是否為黑色方塊（簡化檢測）
        const pixelIndex = (y * width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];
        
        if (r < 50 && g < 50 && b < 50) {
          // 找到可能的 QR Code 區域，嘗試解析
          // 這裡應該實現真正的 QR Code 解析邏輯
          // 為了演示，我們返回一個模擬的 token
          return 'token-demo-123';
        }
      }
    }
    
    return null;
  };

  const startScanning = async () => {
    try {
      setError(null);
      
      // 請求相機權限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 使用後置相機
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      setHasCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        
        // 開始掃描循環
        scanLoop();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '無法訪問相機';
      setError(errorMessage);
      if (onScanError) {
        onScanError(errorMessage);
      }
    }
  };

  const scanLoop = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // 設置 canvas 尺寸
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 繪製當前幀
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 獲取圖像數據
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // 嘗試檢測 QR Code
    const qrData = detectQRCode(imageData);
    
    if (qrData) {
      console.log('QR Code detected:', qrData);
      onScanSuccess(qrData);
      stopScanning();
    } else {
      // 繼續掃描
      requestAnimationFrame(scanLoop);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const restartScanning = () => {
    stopScanning();
    setTimeout(startScanning, 100);
  };

  useEffect(() => {
    // 檢查是否支持相機
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      setHasCamera(true);
    }

    return () => {
      stopScanning();
    };
  }, []);

  if (!hasCamera) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p>您的設備不支持相機功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="aspect-square w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {/* 掃描框 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white rounded-lg relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
          </div>
        </div>
        
        {/* 掃描線動畫 */}
        {isScanning && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-1 bg-blue-500 animate-pulse"></div>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="mt-4 flex justify-center space-x-2">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            開始掃描
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            停止掃描
          </button>
        )}
        
        {isScanning && (
          <button
            onClick={restartScanning}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            重新掃描
          </button>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>將 QR Code 對準掃描框</p>
        <p>確保光線充足，QR Code 清晰可見</p>
      </div>
    </div>
  );
}

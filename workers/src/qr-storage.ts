// QR Code storage utilities for R2

import { GuestCategory } from './types';

/**
 * Get border color for QR code based on guest category
 */
export function getQRCodeBorderColor(category: GuestCategory): string {
  switch (category) {
    case 'netcraft':
      return '#0A599C'; // NetCraft Blue
    case 'vip':
      return '#d97706'; // Gold/Orange
    case 'regular':
      return '#16a34a'; // Green
    default:
      return '#0A599C'; // Default to NetCraft blue
  }
}

/**
 * Save QR code image to R2 and return public URL
 */
export async function saveQRCodeToR2(
  bucket: any, // R2Bucket
  guestId: string,
  imageBuffer: ArrayBuffer,
  workerUrl: string
): Promise<string> {
  const filename = `qr-${guestId}.png`;
  
  // Save to R2
  await bucket.put(filename, imageBuffer, {
    httpMetadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
    },
  });

  // Return Worker URL for the QR code
  return `${workerUrl}/qr/${filename}`;
}

/**
 * Generate QR code and save to R2
 */
export async function generateAndSaveQRCode(
  bucket: any, // R2Bucket
  guestId: string,
  qrData: string,
  category: GuestCategory,
  workerUrl: string
): Promise<string> {
  try {
    // Use QR Server API to generate QR code
    const encodedData = encodeURIComponent(qrData);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&format=png`;
    
    // Fetch the QR code image
    const response = await fetch(qrUrl);
    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }

    const imageBuffer = await response.arrayBuffer();
    
    // Save to R2 and get Worker URL
    const imageUrl = await saveQRCodeToR2(bucket, guestId, imageBuffer, workerUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('QR code generation and storage error:', error);
    throw error;
  }
}


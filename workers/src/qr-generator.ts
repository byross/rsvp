// QR Code generation and validation utilities

import { GuestCategory } from './types';

interface QRCodePayload {
  id: string;
  token: string;
  name: string;
  category: GuestCategory;
  timestamp: number;
}

/**
 * Generate a checksum for QR code validation
 */
export async function generateChecksum(
  payload: QRCodePayload,
  secret: string
): Promise<string> {
  const data = `${payload.id}:${payload.token}:${payload.timestamp}:${secret}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16); // Use first 16 chars
}

/**
 * Verify QR code checksum
 */
export async function verifyChecksum(
  payload: QRCodePayload,
  checksum: string,
  secret: string
): Promise<boolean> {
  const expectedChecksum = await generateChecksum(payload, secret);
  return expectedChecksum === checksum;
}

/**
 * Generate QR code data string (to be encoded as QR image)
 */
export async function generateQRCodeData(
  guestId: string,
  token: string,
  name: string,
  category: GuestCategory,
  secret: string
): Promise<string> {
  const timestamp = Date.now();
  
  const payload: QRCodePayload = {
    id: guestId,
    token,
    name,
    category,
    timestamp,
  };

  const checksum = await generateChecksum(payload, secret);

  // Create QR code data
  const qrData = JSON.stringify({
    ...payload,
    checksum,
  });

  return qrData;
}

/**
 * Generate QR code data URL (base64) - Legacy method for backward compatibility
 * Using external API for Cloudflare Workers compatibility
 */
export async function generateQRCodeDataURL(
  guestId: string,
  token: string,
  name: string,
  category: GuestCategory,
  secret: string
): Promise<string> {
  const qrData = await generateQRCodeData(guestId, token, name, category, secret);

  try {
    // Use QR Server API (free and reliable)
    const encodedData = encodeURIComponent(qrData);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&format=png`;
    
    // Fetch the QR code image
    const response = await fetch(qrUrl);
    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }

    // Convert to base64 data URL
    const blob = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
    const dataURL = `data:image/png;base64,${base64}`;

    return dataURL;
  } catch (error) {
    console.error('QR code generation error:', error);
    // Fallback: return a placeholder
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
}

/**
 * Parse and validate QR code data
 */
export async function parseAndValidateQRCode(
  qrDataString: string,
  secret: string
): Promise<{ valid: boolean; payload?: QRCodePayload; error?: string }> {
  try {
    const data = JSON.parse(qrDataString);
    
    if (!data.id || !data.token || !data.checksum || !data.timestamp) {
      return { valid: false, error: 'Invalid QR code format' };
    }

    const payload: QRCodePayload = {
      id: data.id,
      token: data.token,
      name: data.name,
      category: data.category || 'netcraft', // Default to netcraft for backward compatibility
      timestamp: data.timestamp,
    };

    // Verify checksum
    const isValid = await verifyChecksum(payload, data.checksum, secret);

    if (!isValid) {
      return { valid: false, error: 'Invalid checksum' };
    }

    // Check if QR code is not too old (optional: 30 days)
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.timestamp > thirtyDaysInMs) {
      return { valid: false, error: 'QR code expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Failed to parse QR code' };
  }
}


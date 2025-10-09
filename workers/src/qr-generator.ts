// QR Code generation and validation utilities

import QRCode from 'qrcode';

interface QRCodePayload {
  id: string;
  token: string;
  name: string;
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
 * Generate QR code data URL (base64)
 */
export async function generateQRCodeDataURL(
  guestId: string,
  token: string,
  name: string,
  secret: string
): Promise<string> {
  const timestamp = Date.now();
  
  const payload: QRCodePayload = {
    id: guestId,
    token,
    name,
    timestamp,
  };

  const checksum = await generateChecksum(payload, secret);

  // Create QR code data
  const qrData = JSON.stringify({
    ...payload,
    checksum,
  });

  // Generate QR code as data URL
  const dataURL = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  return dataURL;
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


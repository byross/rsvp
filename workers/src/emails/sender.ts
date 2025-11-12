// Email sending utilities using Resend REST API

import { 
  generateNamedGuestInvitationEmail, 
  generateCompanyInvitationEmail,
  generateConfirmationEmail 
} from './templates';
import { GuestCategory } from '../types';

interface EmailConfig {
  resendApiKey: string;
  fromEmail: string;
  fromName: string;
}

interface SendInvitationEmailParams {
  to: string;
  guestName: string;
  inviteType: 'named' | 'company';
  inviteUrl: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
}

interface SendConfirmationEmailParams {
  to: string;
  guestName: string;
  dinner: boolean;
  cocktail: boolean;
  vegetarian?: boolean;
  workshopType?: string | null;
  workshopTime?: string | null;
  qrCodeDataURL: string;
  guestCategory: GuestCategory;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  rsvpUrl: string;
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Send invitation email
 */
export async function sendInvitationEmail(
  config: EmailConfig,
  params: SendInvitationEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const htmlContent = params.inviteType === 'named'
      ? generateNamedGuestInvitationEmail({
          guestName: params.guestName,
          inviteUrl: params.inviteUrl,
          eventName: params.eventName,
          eventDate: params.eventDate,
          eventVenue: params.eventVenue,
        })
      : generateCompanyInvitationEmail({
          guestName: params.guestName,
          inviteUrl: params.inviteUrl,
          eventName: params.eventName,
          eventDate: params.eventDate,
          eventVenue: params.eventVenue,
        });

    let invitationLetterBase64: string | null = null;

    try {
      const inviteUrlObject = new URL(params.inviteUrl);
      const letterUrl = inviteUrlObject.hostname === 'localhost'
        ? 'https://rsvp.momini.app/images/letter.pdf'
        : new URL('/images/letter.pdf', inviteUrlObject.origin).toString();

      const letterResponse = await fetch(letterUrl);
      if (letterResponse.ok) {
        const letterBuffer = await letterResponse.arrayBuffer();
        invitationLetterBase64 = arrayBufferToBase64(letterBuffer);
      } else {
        console.warn('Failed to fetch invitation letter PDF:', letterResponse.status, letterResponse.statusText);
      }
    } catch (error) {
      console.warn('Invitation letter fetch error:', error);
    }

    const emailPayload: Record<string, unknown> = {
      from: `${config.fromName} <${config.fromEmail}>`,
      to: [params.to],
      subject: `【邀請】${params.eventName}`,
      html: htmlContent,
    };

    if (invitationLetterBase64) {
      emailPayload.attachments = [
        {
          filename: 'NetCraft-Invitation-Letter.pdf',
          content: invitationLetterBase64,
        },
      ];
    }

    // Use Fetch API instead of Resend SDK for better Cloudflare Workers compatibility
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return { success: false, error: result.message || 'Failed to send email' };
    }

    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Send invitation email error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send confirmation email with QR code
 */
export async function sendConfirmationEmail(
  config: EmailConfig,
  params: SendConfirmationEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const htmlContent = generateConfirmationEmail({
      guestName: params.guestName,
      dinner: params.dinner,
      cocktail: params.cocktail,
      vegetarian: params.vegetarian ?? false,
      workshopType: params.workshopType ?? null,
      workshopTime: params.workshopTime ?? null,
      qrCodeDataURL: params.qrCodeDataURL,
      guestCategory: params.guestCategory,
      eventName: params.eventName,
      eventDate: params.eventDate,
      eventVenue: params.eventVenue,
      rsvpUrl: params.rsvpUrl,
    });

    // Use Fetch API instead of Resend SDK for better Cloudflare Workers compatibility
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: [params.to],
        subject: `【確認】${params.eventName} - 您的 QR Code 入場券`,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', result);
      return { success: false, error: result.message || 'Failed to send email' };
    }

    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('Send confirmation email error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}


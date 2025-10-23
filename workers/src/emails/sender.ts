// Email sending utilities using Resend REST API

import { 
  generateNamedGuestInvitationEmail, 
  generateCompanyInvitationEmail,
  generateConfirmationEmail 
} from './templates';

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
  eventName: string;
  eventDate: string;
  eventVenue: string;
}

/**
 * Send invitation email
 */
export async function sendInvitationEmail(
  config: EmailConfig,
  params: SendInvitationEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // 臨時限制：Resend 免費帳戶只能發送到自己的郵箱
    if (params.to !== 'ross@byross.net') {
      return { 
        success: false, 
        error: 'Resend 免費帳戶限制：只能發送到 ross@byross.net。請升級帳戶或驗證域名。' 
      };
    }
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
        subject: `【邀請】${params.eventName}`,
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
    // 臨時限制：Resend 免費帳戶只能發送到自己的郵箱
    if (params.to !== 'ross@byross.net') {
      return { 
        success: false, 
        error: 'Resend 免費帳戶限制：只能發送到 ross@byross.net。請升級帳戶或驗證域名。' 
      };
    }
    const htmlContent = generateConfirmationEmail({
      guestName: params.guestName,
      dinner: params.dinner,
      cocktail: params.cocktail,
      vegetarian: params.vegetarian ?? false,
      workshopType: params.workshopType ?? null,
      workshopTime: params.workshopTime ?? null,
      qrCodeDataURL: params.qrCodeDataURL,
      eventName: params.eventName,
      eventDate: params.eventDate,
      eventVenue: params.eventVenue,
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


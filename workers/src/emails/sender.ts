// Email sending utilities using Resend

import { Resend } from 'resend';
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
    const resend = new Resend(config.resendApiKey);

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

    const result = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: params.to,
      subject: `【邀請】${params.eventName}`,
      html: htmlContent,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
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
    const resend = new Resend(config.resendApiKey);

    const htmlContent = generateConfirmationEmail({
      guestName: params.guestName,
      dinner: params.dinner,
      cocktail: params.cocktail,
      workshopType: params.workshopType,
      workshopTime: params.workshopTime,
      qrCodeDataURL: params.qrCodeDataURL,
      eventName: params.eventName,
      eventDate: params.eventDate,
      eventVenue: params.eventVenue,
    });

    const result = await resend.emails.send({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: params.to,
      subject: `【確認】${params.eventName} - 您的 QR Code 入場券`,
      html: htmlContent,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Send confirmation email error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}


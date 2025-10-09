// Type definitions for the RSVP system

export type InviteType = 'named' | 'company';
export type RsvpStatus = 'pending' | 'confirmed' | 'declined';
export type WorkshopType = 'leather' | 'perfume' | null;
export type WorkshopTime = '1630' | '1700' | '1730' | '1800' | null;
export type ScanStatus = 'success' | 'duplicate' | 'error';

export interface Guest {
  id: string;
  name: string;
  company?: string;
  email: string;
  token: string;
  invite_type: InviteType;
  rsvp_status: RsvpStatus;
  dinner: boolean;
  cocktail: boolean;
  workshop_type?: WorkshopType;
  workshop_time?: WorkshopTime;
  seat_no?: string;
  checked_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScanLog {
  id: string;
  guest_id: string;
  scan_time: string;
  staff_id?: string;
  status: ScanStatus;
}

export interface RsvpSubmission {
  name?: string;
  dinner: boolean;
  cocktail: boolean;
  workshop_type?: WorkshopType;
  workshop_time?: WorkshopTime;
}

export interface QRCodeData {
  id: string;
  token: string;
  checksum: string;
}


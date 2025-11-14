// Type definitions for the RSVP system

export type InviteType = 'named' | 'company';
export type RsvpStatus = 'pending' | 'confirmed' | 'declined';
export type WorkshopType = 'leather' | 'perfume' | null;
export type WorkshopTime = '1630' | '1700' | '1730' | '1800' | null;
export type ScanStatus = 'success' | 'duplicate' | 'error';
export type GuestCategory = 'netcraft' | 'vip' | 'guest' | 'regular';

export interface Guest {
  id: string;
  name: string;
  company?: string;
  email: string;
  token: string;
  invite_type: InviteType;
  rsvp_status: RsvpStatus;
  guest_category: GuestCategory;
  dinner: boolean;
  cocktail: boolean;
  vegetarian?: boolean;
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
  vegetarian?: boolean;
  workshop_type?: WorkshopType;
  workshop_time?: WorkshopTime;
}

export interface QRCodeData {
  id: string;
  token: string;
  checksum: string;
  category: GuestCategory;
}

export interface WorkshopCheckin {
  id: string;
  guest_id: string;
  workshop_type: 'leather' | 'perfume';
  workshop_time: string;
  checked_in_at: string;
  staff_id?: string;
}

export interface WorkshopAvailability {
  total: number;
  booked: number;
  available: number;
}

export interface WorkshopAvailabilityResponse {
  leather: {
    [time: string]: WorkshopAvailability;
  };
  perfume: {
    [time: string]: WorkshopAvailability;
  };
}

export interface WorkshopCheckinGuest {
  id: string;
  checked_in_at: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  invite_type: 'named' | 'company';
  rsvp_status: 'pending' | 'confirmed' | 'declined';
}

export interface WorkshopCheckinsResponse {
  workshop_type: string;
  workshop_time: string;
  checkins: WorkshopCheckinGuest[];
}

export interface WorkshopGuest {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  invite_type: 'named' | 'company';
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  checked_in: number; // 0 or 1
  checked_in_at?: string;
}

export interface WorkshopGuestsResponse {
  workshop_type: string;
  workshop_time: string;
  guests: WorkshopGuest[];
}







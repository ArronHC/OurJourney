export type TicketType = 'flight' | 'train' | 'hotel';
export type Traveler = 'a' | 'b';

export interface AuthUser {
  id: number;
  email: string;
  display_name: string;
  invited_by_user_id: number | null;
  created_at: string;
}

export interface InviteCode {
  id: number;
  code: string;
  created_by_user_id: number;
  created_at: string;
  used_at: string | null;
  used_by_user_id: number | null;
  used_by_name?: string | null;
}

export interface AuthStatus {
  authenticated: boolean;
  user: AuthUser | null;
  user_count: number;
  can_register_without_invite: boolean;
}

export interface Meeting {
  id: number;
  title: string;
  city: string;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tickets?: Ticket[];
  total_cost?: number;
}

export interface Ticket {
  id: number;
  meeting_id: number;
  type: TicketType;
  traveler: Traveler;
  departure: string | null;
  arrival: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  carrier: string | null;
  trip_number: string | null;
  seat_class: string | null;
  hotel_name: string | null;
  check_in: string | null;
  check_out: string | null;
  price_per_night: number | null;
  price: number | null;
  screenshot_path: string | null;
  raw_ocr_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  relationship_start_date?: string;
  next_meeting_date?: string;
  next_meeting_city?: string;
  partner_a_name?: string;
  partner_b_name?: string;
  partner_city_a?: string;
  partner_city_b?: string;
  [key: string]: string | undefined;
}

export interface RecognizeResponse {
  success: boolean;
  partial?: boolean;
  data?: Partial<
    Omit<
      Ticket,
      | 'id'
      | 'meeting_id'
      | 'type'
      | 'traveler'
      | 'screenshot_path'
      | 'raw_ocr_data'
      | 'created_at'
      | 'updated_at'
    >
  >;
  error?: string;
  message?: string;
  screenshot_path?: string;
}

export interface Stats {
  meeting_count: number;
  total_cost: number;
  total_distance_km: number;
  total_days_together: number;
  avg_cost_per_meeting: number;
  avg_monthly_frequency: number;
  avg_days_per_meeting: number;
  distance_fun_fact: string;
  cost_per_meeting: { meeting_id: number; title: string; cost: number }[];
}

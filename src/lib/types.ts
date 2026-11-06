export type Role = "admin" | "manager" | "agent";

export interface Base { id: string; created_at: string }

export interface Profile extends Base {
  full_name: string; email: string; role: Role; phone: string;
  specialization_areas: string; // comma separated areas
  specialization_types: string; // comma separated property types
  active: boolean;
}

export interface Lead extends Base {
  name: string; phone: string; email: string;
  source: string; client_type: string; // buyer | seller | tenant | landlord
  budget: number; preferred_area: string; property_type: string;
  purpose: string; timeline: string;
  temperature: "hot" | "warm" | "cold";
  stage: string;
  assigned_to: string | null;
  follow_up_at: string | null;
  first_contact_at: string | null;
  lost_reason: string; lost_followup_at: string | null;
  consent_marketing: boolean;
  notes: string; closed_at: string | null;
}

export interface Property extends Base {
  ref: string; title: string; type: string; listing_type: "sale" | "rent";
  area: string; building: string; bedrooms: number; size_sqft: number;
  price: number; status: "available" | "reserved" | "sold" | "rented";
  owner_name: string; owner_phone: string;
  permit_no: string; photos_url: string; video_url: string;
  agent_id: string | null;
}

export interface Viewing extends Base {
  lead_id: string; property_id: string | null; agent_id: string | null;
  scheduled_at: string; status: "scheduled" | "completed" | "cancelled";
  feedback: string; next_action: string; reminder_sent: boolean;
}

export interface Offer extends Base {
  lead_id: string; property_id: string | null;
  amount: number; kind: "offer" | "counter"; from_party: string;
  status: "pending" | "accepted" | "rejected"; notes: string;
}

export interface Deal extends Base {
  lead_id: string; property_id: string | null; agent_id: string | null;
  agreed_price: number; commission_pct: number; commission_amount: number;
  status: "open" | "won" | "lost";
  checklist: Record<string, boolean>;
  notes: string; closed_at: string | null;
}

export interface Task extends Base {
  lead_id: string | null; assigned_to: string | null;
  title: string; kind: string; due_at: string; done: boolean;
}

export interface Activity extends Base {
  lead_id: string; user_id: string | null; type: string; text: string;
}

export interface Tables {
  profiles: Profile; leads: Lead; properties: Property; viewings: Viewing;
  offers: Offer; deals: Deal; tasks: Task; activities: Activity;
}
export type TableName = keyof Tables;
export const TABLES: TableName[] = [
  "profiles", "leads", "properties", "viewings", "offers", "deals", "tasks", "activities",
];

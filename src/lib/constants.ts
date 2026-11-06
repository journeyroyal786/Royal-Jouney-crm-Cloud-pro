export const COMPANY = "Royal Journey";
export const CURRENCY = "AED";

export const SOURCES = [
  "Property Finder", "Bayut", "Dubizzle", "Website", "Instagram", "Facebook",
  "TikTok", "WhatsApp", "Referral", "Walk-in", "Cold Call", "Other",
];
export const CLIENT_TYPES = [
  { value: "buyer", label: "Buyer" }, { value: "seller", label: "Seller" },
  { value: "tenant", label: "Tenant" }, { value: "landlord", label: "Landlord" },
];
export const PROPERTY_TYPES = [
  "Apartment", "Villa", "Townhouse", "Penthouse", "Studio", "Office", "Shop", "Land",
];
export const PURPOSES = ["End-use", "Investment", "Rental income"];
export const AREAS = [
  "Downtown Dubai", "Dubai Marina", "Palm Jumeirah", "Business Bay", "JVC",
  "Dubai Hills Estate", "Arabian Ranches", "JLT", "Creek Harbour", "MBR City",
  "Damac Hills", "Dubai South", "Al Barsha", "Jumeirah", "Other",
];

export interface StageDef { key: string; label: string; color: string }
export const STAGES: StageDef[] = [
  { key: "new", label: "New Lead", color: "#64748b" },
  { key: "contacted", label: "Contacted", color: "#0ea5e9" },
  { key: "qualified", label: "Qualified", color: "#6366f1" },
  { key: "property_matched", label: "Property Matched", color: "#8b5cf6" },
  { key: "viewing_scheduled", label: "Viewing Scheduled", color: "#d946ef" },
  { key: "negotiation", label: "Offer / Negotiation", color: "#f59e0b" },
  { key: "documentation", label: "Documentation", color: "#e8a317" },
  { key: "closed_won", label: "Closed Won", color: "#16a34a" },
  { key: "post_sale", label: "Post-Sale Follow-up", color: "#0d9488" },
  { key: "closed_lost", label: "Closed Lost", color: "#dc2626" },
];
export const stageLabel = (k: string) => STAGES.find((s) => s.key === k)?.label ?? k;
export const stageColor = (k: string) => STAGES.find((s) => s.key === k)?.color ?? "#64748b";
export const OPEN_STAGES = ["new", "contacted", "qualified", "property_matched", "viewing_scheduled", "negotiation", "documentation"];
export const WON_STAGES = ["closed_won", "post_sale"];

export const LOST_REASONS = [
  "Budget too low", "Bought elsewhere", "Not responding", "Changed plans / postponed",
  "Mortgage rejected", "Price not agreed", "Property no longer available",
  "Went with another agency", "Other",
];

export const DEAL_CHECKLIST: { key: string; label: string; hint: string }[] = [
  { key: "docs_verified", label: "Documents verified", hint: "Passport, Emirates ID, title deed, POA where applicable" },
  { key: "form_a", label: "Form A signed", hint: "Seller / landlord – broker agreement" },
  { key: "form_b", label: "Form B signed", hint: "Buyer / tenant – broker agreement" },
  { key: "form_f", label: "Form F signed", hint: "Memorandum of Understanding (sale agreement)" },
  { key: "deposit", label: "Deposit received", hint: "Typically 10% – held in escrow / manager's cheque" },
  { key: "noc", label: "NOC obtained", hint: "Developer no-objection certificate" },
  { key: "mortgage", label: "Mortgage approved", hint: "Skip if cash purchase" },
  { key: "transfer", label: "DLD transfer completed", hint: "Title deed issued at Trustee Office / DLD" },
];

export const OFFER_PARTIES = ["Buyer", "Seller", "Tenant", "Landlord"];
export const DEFAULT_COMMISSION_PCT = 2;
